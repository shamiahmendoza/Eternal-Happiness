<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import VideoHeader from './components/VideoHeader.vue'
import FeaturedVideo from './components/FeaturedVideo.vue'
import VideoGallery from './components/VideoGallery.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import PhotoUpload from '../../component/PhotoUpload.vue'

const route = useRoute()
const router = useRouter()

const videos = ref([])
const featuredVideo = ref(null)
const selectedVideo = ref(null)

const loading = ref(true)
const loadError = ref('')

const showUploadModal = ref(false)
const isFeaturedUpload = ref(false)

const adminMode = ref(false)
const adminPassword = ref('')

const deletingId = ref(null)
const settingFeaturedId = ref(null)
const editingVideoId = ref(null)
const savingMetadataId = ref(null)
const editTitle = ref('')
const editDescription = ref('')

const deleteError = ref('')
const deleteMessage = ref('')
const metadataError = ref('')
const metadataMessage = ref('')
const featuredError = ref('')
const featuredMessage = ref('')

function formatDate(date) {
  if (!date) return ''

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return ''

  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function mapVideo(item) {
  return {
    id: item.id,
    title: item.title || 'Untitled video',
    storedTitle: item.title || '',
    description: item.description || '',
    category: item.category,
    thumbnail: item.thumbnail_url || null,
    url: item.media_url,
    contentType: item.content_type || 'video/mp4',
    date: formatDate(item.created_at),
    createdAt: item.created_at,
  }
}

async function fetchVideos() {
  const response = await fetch('/api/media?type=video')

  if (!response.ok) {
    throw new Error('Unable to load videos.')
  }

  const result = await response.json()

  videos.value = (result.items || []).map(mapVideo)
}

async function fetchFeaturedVideo() {
  const response = await fetch('/api/featured')

  if (!response.ok) {
    throw new Error('Unable to load the Featured Video.')
  }

  const result = await response.json()

  featuredVideo.value = result.video ? mapVideo(result.video) : null
}

async function refreshVideos() {
  loading.value = true
  loadError.value = ''

  try {
    await Promise.all([fetchVideos(), fetchFeaturedVideo()])
  } catch (error) {
    console.error('Error loading videos:', error)
    loadError.value = error.message || 'Unable to load videos.'
  } finally {
    loading.value = false
  }
}

// Keep the selected featured video out of the regular gallery.
const otherVideos = computed(() =>
  videos.value.filter((video) => video.id !== featuredVideo.value?.id),
)

function playVideo(video) {
  selectedVideo.value = video
}

function closeVideo() {
  selectedVideo.value = null
}

function openUploadModal(featured = false) {
  isFeaturedUpload.value = featured
  showUploadModal.value = true
}

function closeUploadModal() {
  showUploadModal.value = false
}

// Called after PhotoUpload successfully uploads a video.
async function handleUpload(result) {
  if (isFeaturedUpload.value) {
    await makeFeaturedVideo(result.id)
  }

  closeUploadModal()
  await refreshVideos()
}

async function makeFeaturedVideo(id) {
  featuredError.value = ''
  featuredMessage.value = ''

  if (!adminPassword.value.trim()) {
    featuredError.value = 'Please enter the admin password first.'
    return false
  }

  try {
    const response = await fetch('/api/featured', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': adminPassword.value,
      },
      body: JSON.stringify({ id }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Could not update Featured Video.')
    }

    featuredMessage.value = 'Featured Video updated successfully.'
    return true
  } catch (error) {
    console.error('Featured video update error:', error)
    featuredError.value = error.message || 'Could not update Featured Video.'
    return false
  }
}

async function selectFeatured(video) {
  settingFeaturedId.value = video.id
  featuredError.value = ''
  featuredMessage.value = ''
  metadataError.value = ''
  metadataMessage.value = ''

  const success = await makeFeaturedVideo(video.id)

  if (success) {
    await refreshVideos()
  }

  settingFeaturedId.value = null
}

// Admin panel from footer link.
watch(
  () => [route.query.admin, route.query.featured],
  ([admin, featured]) => {
    adminMode.value = admin === '1'

    if (adminMode.value && featured === '1') {
      openUploadModal(true)
    } else if (!adminMode.value) {
      adminPassword.value = ''
      deleteError.value = ''
      deleteMessage.value = ''
      metadataError.value = ''
      metadataMessage.value = ''
      editingVideoId.value = null
      featuredError.value = ''
      featuredMessage.value = ''
      closeUploadModal()
    }
  },
  { immediate: true },
)

function closeAdmin() {
  closeUploadModal()
  router.push('/videos')
}

function editVideoDetails(video) {
  editingVideoId.value = video.id
  editTitle.value = video.storedTitle
  editDescription.value = video.description
  metadataError.value = ''
  metadataMessage.value = ''
}

function cancelVideoEdit() {
  editingVideoId.value = null
  metadataError.value = ''
}

async function saveVideoDetails(video) {
  metadataError.value = ''
  metadataMessage.value = ''

  if (!adminPassword.value.trim()) {
    metadataError.value = 'Please enter the admin password.'
    return
  }

  savingMetadataId.value = video.id

  try {
    const response = await fetch(`/api/media/${encodeURIComponent(video.id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': adminPassword.value,
      },
      body: JSON.stringify({
        title: editTitle.value,
        description: editDescription.value,
      }),
    })

    if (response.status === 405) {
      throw new Error(
        'The deployed Worker does not support metadata edits yet. Deploy the latest Worker code and try again.',
      )
    }

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update video details.')
    }

    video.storedTitle = result.title
    video.title = result.title || 'Untitled video'
    video.description = result.description

    if (featuredVideo.value?.id === video.id) {
      featuredVideo.value.title = video.title
      featuredVideo.value.description = video.description
      featuredVideo.value.storedTitle = video.storedTitle
    }

    if (selectedVideo.value?.id === video.id) {
      selectedVideo.value.title = video.title
      selectedVideo.value.description = video.description
      selectedVideo.value.storedTitle = video.storedTitle
    }

    editingVideoId.value = null
    metadataMessage.value = 'Video details updated.'
  } catch (error) {
    console.error('Update video details error:', error)
    metadataError.value = error.message || 'Unable to update video details.'
  } finally {
    savingMetadataId.value = null
  }
}

async function deleteVideo(video) {
  deleteError.value = ''
  deleteMessage.value = ''
  metadataError.value = ''
  metadataMessage.value = ''

  if (!adminPassword.value.trim()) {
    deleteError.value = 'Please enter the admin password.'
    return
  }

  const confirmed = window.confirm(`Are you sure you want to permanently delete "${video.title}"?`)

  if (!confirmed) return

  deletingId.value = video.id

  try {
    const response = await fetch(`/api/media/${encodeURIComponent(video.id)}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Password': adminPassword.value,
      },
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete video.')
    }

    if (selectedVideo.value?.id === video.id) {
      selectedVideo.value = null
    }

    deleteMessage.value = `"${video.title}" was deleted successfully.`

    await refreshVideos()
  } catch (error) {
    console.error('Delete error:', error)
    deleteError.value = error.message || 'Unable to delete video.'
  } finally {
    deletingId.value = null
  }
}

// Load videos when the page opens.
refreshVideos()
</script>

<template>
  <div class="min-h-screen bg-[#FAF9F4]">
    <VideoHeader />

    <!-- Upload Modal -->
    <Teleport to="body">
      <div
        v-if="showUploadModal"
        class="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8"
        @click.self="closeUploadModal"
      >
        <div
          class="relative my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl md:p-8"
          role="dialog"
          aria-modal="true"
        >
          <div class="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 class="font-serif text-2xl font-semibold text-[#393970]">
                {{ isFeaturedUpload ? 'Upload Featured Video' : 'Upload a Video' }}
              </h2>

              <p class="mt-1 text-sm text-gray-500">
                {{
                  isFeaturedUpload
                    ? 'Upload a video to replace the current Featured Video.'
                    : 'Share your memories with everyone.'
                }}
              </p>
            </div>

            <button
              type="button"
              @click="closeUploadModal"
              aria-label="Close upload modal"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
              &times;
            </button>
          </div>

          <!-- Admin password is needed to select the new featured video. -->
          <div v-if="isFeaturedUpload" class="mb-5">
            <label class="mb-2 block text-xs font-medium text-[#393970]"> Admin password </label>

            <input
              v-model="adminPassword"
              type="password"
              autocomplete="current-password"
              placeholder="Enter admin password"
              class="w-full border border-[#DCD9E8] bg-white px-4 py-3 text-sm outline-none focus:border-[#393970]"
            />
          </div>

          <PhotoUpload
            :key="isFeaturedUpload ? 'featured-upload' : 'regular-upload'"
            media-type="video"
            @uploaded="handleUpload"
          />
        </div>
      </div>
    </Teleport>

    <!-- Admin Management Modal -->
    <Teleport to="body">
      <div
        v-if="adminMode"
        class="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8"
        @click.self="closeAdmin"
      >
      <div
        class="relative my-auto max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-2xl md:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="videoManagementTitle"
      >
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 id="videoManagementTitle" class="text-lg font-semibold text-gray-800">
              Video Management
            </h2>

            <p class="mt-1 text-sm text-gray-500">
              Manage videos, update their details, and choose your Featured Video.
            </p>
          </div>

          <button
            type="button"
            @click="closeAdmin"
            class="text-sm text-gray-500 transition hover:text-red-600"
          >
            Close
          </button>
        </div>

        <!-- Admin Password -->
        <div class="mb-5">
          <label for="videoAdminPassword" class="mb-2 block text-sm font-medium text-gray-700">
            Admin Password
          </label>

          <input
            id="videoAdminPassword"
            v-model="adminPassword"
            type="password"
            placeholder="Enter admin password"
            autocomplete="current-password"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <p
          v-if="metadataError || deleteError || featuredError"
          class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ metadataError || deleteError || featuredError }}
        </p>

        <p
          v-if="metadataMessage || deleteMessage || featuredMessage"
          class="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {{ metadataMessage || deleteMessage || featuredMessage }}
        </p>

        <!-- Video Count -->
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Uploaded Videos</h3>

          <span class="text-xs text-gray-500"> {{ videos.length }} videos </span>
        </div>

        <!-- Video List -->
        <div v-if="videos.length" class="space-y-3">
          <div
            v-for="video in videos"
            :key="video.id"
            class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
          >
            <img
              v-if="video.thumbnail"
              :src="video.thumbnail"
              :alt="`${video.title} thumbnail`"
              class="h-16 w-20 shrink-0 rounded-lg bg-gray-100 object-cover"
            />

            <div
              v-else
              class="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-[#EFEDF7] text-xs text-[#77758A]"
            >
              No preview
            </div>

            <div class="min-w-0 flex-1">
              <template v-if="editingVideoId === video.id">
                <input
                  v-model="editTitle"
                  type="text"
                  maxlength="150"
                  placeholder="Video title (optional)"
                  class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />

                <textarea
                  v-model="editDescription"
                  maxlength="1000"
                  rows="2"
                  placeholder="Video description (optional)"
                  class="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-sm"
                ></textarea>

                <div class="mt-2 flex gap-2">
                  <button
                    type="button"
                    @click="saveVideoDetails(video)"
                    :disabled="savingMetadataId === video.id"
                    class="rounded bg-[#393970] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {{ savingMetadataId === video.id ? 'Saving...' : 'Save details' }}
                  </button>

                  <button
                    type="button"
                    @click="cancelVideoEdit"
                    :disabled="savingMetadataId === video.id"
                    class="rounded bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </template>

              <template v-else>
                <p class="truncate text-sm font-medium text-gray-800">
                  {{ video.title }}
                </p>

                <p class="mt-1 text-xs text-gray-500">{{ video.category }} · {{ video.date }}</p>

                <p v-if="video.description" class="mt-1 line-clamp-2 text-xs text-gray-500">
                  {{ video.description }}
                </p>

                <p
                  v-if="featuredVideo?.id === video.id"
                  class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#77758A]"
                >
                  Current Featured Video
                </p>
              </template>
            </div>

            <div class="flex shrink-0 flex-col gap-2">
              <button
                type="button"
                @click="editVideoDetails(video)"
                :disabled="editingVideoId !== null || savingMetadataId !== null"
                class="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Edit details
              </button>

              <button
                v-if="featuredVideo?.id !== video.id"
                type="button"
                @click="selectFeatured(video)"
                :disabled="settingFeaturedId === video.id"
                class="rounded-lg bg-[#393970] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#292955] disabled:opacity-50"
              >
                {{ settingFeaturedId === video.id ? 'Updating...' : 'Make Featured' }}
              </button>

              <button
                type="button"
                @click="deleteVideo(video)"
                :disabled="deletingId === video.id"
                class="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                {{ deletingId === video.id ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>

        <p v-else class="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500">
          No videos available.
        </p>
      </div>
      </div>
    </Teleport>

    <!-- Loading -->
    <div v-if="loading" class="bg-[#FAF9F4] py-16 text-center text-sm text-gray-500">
      Loading videos...
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="bg-[#FAF9F4] py-16 text-center text-sm text-red-600">
      {{ loadError }}

      <button type="button" @click="refreshVideos" class="ml-2 underline">Try again</button>
    </div>

    <!-- Featured Video and Regular Gallery -->
    <template v-else>
      <FeaturedVideo v-if="featuredVideo" :video="featuredVideo" @play="playVideo" />

      <section v-else class="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <p class="text-sm text-gray-500">No Featured Video has been selected yet.</p>

        <button
          v-if="adminMode"
          type="button"
          @click="openUploadModal(true)"
          class="mt-4 rounded-lg bg-[#393970] px-5 py-3 text-sm text-white"
        >
          Upload Featured Video
        </button>
      </section>

      <VideoGallery :videos="otherVideos" @play="playVideo" />

      <!-- Empty Gallery Message -->
      <div v-if="!featuredVideo && !otherVideos.length" class="bg-[#FAF9F4] px-6 py-12 text-center">
        <h2 class="font-serif text-2xl text-[#393970]">No videos yet.</h2>

        <p class="mt-2 text-sm text-gray-500">Upload a video to start building your archive.</p>
      </div>

      <!-- Add Video CTA -->
      <section class="mx-auto max-w-7xl px-6 pb-16 pt-12 md:px-10">
        <div class="border-t border-[#E8E6E0] pt-10 text-center">
          <h2 class="font-serif text-2xl font-semibold text-[#393970]">Want to add a video?</h2>

          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Share a video and help us preserve more moments and memories.
          </p>

          <button
            type="button"
            @click="openUploadModal(false)"
            class="mt-5 inline-flex items-center gap-2 rounded-full border border-[#393970] px-6 py-2.5 text-sm font-medium text-[#393970] transition hover:bg-[#393970] hover:text-white"
          >
            <span class="text-base">+</span>
            Add a Video
          </button>
        </div>
      </section>
    </template>

    <!-- Video Player -->
    <VideoPlayer :video="selectedVideo" @close="closeVideo" />
  </div>
</template>
