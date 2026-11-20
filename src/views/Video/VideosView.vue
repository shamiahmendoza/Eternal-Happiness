
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import VideoHeader from './components/VideoHeader.vue'
import FeaturedVideo from './components/FeaturedVideo.vue'
import VideoGallery from './components/VideoGallery.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import PhotoUpload from '../../component/PhotoUpload.vue'

const route = useRoute()

// Video data
const videos = ref([])
const selectedVideo = ref(null)
const loading = ref(true)
const loadError = ref('')

// Admin controls
const adminMode = ref(false)
const adminPassword = ref('')
const deletingId = ref(null)
const deleteError = ref('')
const deleteMessage = ref('')

// Format date
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

// Fetch videos
async function fetchVideos() {
  loading.value = true
  loadError.value = ''

  try {
    const response = await fetch('/api/media?type=video')

    if (!response.ok) {
      throw new Error('Unable to load videos.')
    }

    const result = await response.json()

    videos.value = (result.items || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      category: item.category,
      thumbnail: '/media/Event/cat.jpg',
      url: item.media_url,
      date: formatDate(item.created_at),
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error('Error fetching videos:', error)
    loadError.value = error.message || 'Unable to load videos.'
  } finally {
    loading.value = false
  }
}

// Featured and other videos
const featuredVideo = computed(() => videos.value[0] || null)

const otherVideos = computed(() => videos.value.slice(1))

// Video player
function playVideo(video) {
  selectedVideo.value = video
}

function closeVideo() {
  selectedVideo.value = null
}

// Refresh after upload
function handleUpload() {
  fetchVideos()
}

// Open admin panel using footer link
watch(
  () => route.query.admin,
  (value) => {
    adminMode.value = value === '1'

    if (!adminMode.value) {
      adminPassword.value = ''
      deleteError.value = ''
      deleteMessage.value = ''
    }
  },
  { immediate: true }
)

// Delete video
async function deleteVideo(video) {
  deleteError.value = ''
  deleteMessage.value = ''

  if (!adminPassword.value.trim()) {
    deleteError.value = 'Please enter the admin password.'
    return
  }

  const confirmed = window.confirm(
    `Are you sure you want to permanently delete "${video.title}"?`
  )

  if (!confirmed) return

  deletingId.value = video.id

  try {
    const response = await fetch(
      `/api/media/${encodeURIComponent(video.id)}`,
      {
        method: 'DELETE',
        headers: {
          'X-Admin-Password': adminPassword.value,
        },
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete video.')
    }

    videos.value = videos.value.filter(
      (item) => item.id !== video.id
    )

    if (selectedVideo.value?.id === video.id) {
      selectedVideo.value = null
    }

    deleteMessage.value = `"${video.title}" was deleted successfully.`
  } catch (error) {
    console.error('Delete error:', error)
    deleteError.value = error.message || 'Unable to delete video.'
  } finally {
    deletingId.value = null
  }
}

// Load videos
onMounted(fetchVideos)
</script>

<template>
  <div class="min-h-screen bg-[#FAF9F4]">

    <VideoHeader />

    <!-- Video Upload -->
    <section class="mx-auto max-w-7xl px-6 py-8 md:px-10">
      <PhotoUpload
        media-type="video"
        @uploaded="handleUpload"
      />
    </section>

    <!-- Admin Management Panel -->
    <section
      v-if="adminMode"
      class="mx-auto max-w-7xl px-6 pb-8 md:px-10"
    >
      <div class="rounded-xl border border-gray-200 bg-white p-5 md:p-7">

        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-800">
              Video Management
            </h2>

            <p class="mt-1 text-sm text-gray-500">
              Manage and delete uploaded videos.
            </p>
          </div>

          <button
            type="button"
            @click="$router.push('/videos')"
            class="text-sm text-gray-500 transition hover:text-red-600"
          >
            Close
          </button>
        </div>

        <!-- Admin Password -->
        <div class="mb-5">
          <label
            for="videoAdminPassword"
            class="mb-2 block text-sm font-medium text-gray-700"
          >
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

        <!-- Error -->
        <p
          v-if="deleteError"
          class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ deleteError }}
        </p>

        <!-- Success -->
        <p
          v-if="deleteMessage"
          class="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {{ deleteMessage }}
        </p>

        <!-- Video Count -->
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">
            Uploaded Videos
          </h3>

          <span class="text-xs text-gray-500">
            {{ videos.length }} videos
          </span>
        </div>

        <!-- Video List -->
        <div
          v-if="videos.length"
          class="space-y-3"
        >
          <div
            v-for="video in videos"
            :key="video.id"
            class="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3"
          >
            <img
              :src="video.thumbnail"
              :alt="video.title"
              class="h-16 w-16 shrink-0 rounded-lg object-cover"
            />

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-800">
                {{ video.title }}
              </p>

              <p class="mt-1 text-xs text-gray-500">
                {{ video.category }} · {{ video.date }}
              </p>
            </div>

            <button
              type="button"
              @click="deleteVideo(video)"
              :disabled="deletingId === video.id"
              class="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{
                deletingId === video.id
                  ? 'Deleting...'
                  : 'Delete'
              }}
            </button>
          </div>
        </div>

        <p
          v-else
          class="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500"
        >
          No videos available.
        </p>

      </div>
    </section>

    <!-- Loading -->
    <div
      v-if="loading"
      class="bg-[#FAF9F4] py-16 text-center text-sm text-gray-500"
    >
      Loading videos...
    </div>

    <!-- Error -->
    <div
      v-else-if="loadError"
      class="bg-[#FAF9F4] py-16 text-center text-sm text-red-600"
    >
      {{ loadError }}

      <button
        type="button"
        @click="fetchVideos"
        class="ml-2 underline"
      >
        Try again
      </button>
    </div>

    <!-- Video Content -->
    <template v-else-if="featuredVideo">
      <FeaturedVideo
        :video="featuredVideo"
        @play="playVideo"
      />

      <VideoGallery
        :videos="otherVideos"
        @play="playVideo"
      />
    </template>

    <!-- Empty State -->
    <div
      v-else
      class="bg-[#FAF9F4] px-6 py-20 text-center"
    >
      <h2 class="font-serif text-2xl text-[#393970]">
        No videos yet.
      </h2>

      <p class="mt-2 text-sm text-gray-500">
        Upload a video to start building your archive.
      </p>
    </div>

    <!-- Video Player -->
    <VideoPlayer
      :video="selectedVideo"
      @close="closeVideo"
    />

  </div>
</template>
