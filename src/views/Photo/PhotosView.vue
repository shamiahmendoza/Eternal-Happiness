<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PhotoHeader from './components/PhotoHeader.vue'
import PhotoToolbar from './components/PhotoToolbar.vue'
import PhotoGallery from './components/PhotoGallery.vue'
import PhotoUpload from '../../component/PhotoUpload.vue'
import { generatePhotoPreview } from '../../services/photoPreviewService.js'

const route = useRoute()
const router = useRouter()

// Categories
const categories = ['All photos', 'Event', 'Ministry', 'Shared meals', 'Manila']
const photoCategories = categories.slice(1)

// Photo data
const photos = ref([])
const defaultPhotoIds = ref(
  Object.fromEntries(photoCategories.map((category) => [category, null])),
)

const search = ref('')
const activeCategory = ref('All photos')
const sortOrder = ref('newest')

const loading = ref(false)
const loadError = ref('')

// Upload modal
const showUploadModal = ref(false)

// Admin controls
const adminMode = ref(false)
const adminPassword = ref('')
const deletingId = ref(null)
const editingPhotoId = ref(null)
const savingMetadataId = ref(null)
const editTitle = ref('')
const editDescription = ref('')
const deleteError = ref('')
const deleteMessage = ref('')
const metadataError = ref('')
const metadataMessage = ref('')
const defaultPhotoError = ref('')
const defaultPhotoMessage = ref('')
const settingDefaultPhotoId = ref(null)
const generatingPreviews = ref(false)
const previewProgress = ref('')
const previewError = ref('')
const previewMessage = ref('')

// Fetch photos
const fetchPhotos = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const [response, defaultsResponse] = await Promise.all([
      fetch('/api/media?type=photo'),
      fetch('/api/default-photos'),
    ])

    if (!response.ok || !defaultsResponse.ok) {
      throw new Error('Unable to load photos and category defaults.')
    }

    const [result, defaultsResult] = await Promise.all([
      response.json(),
      defaultsResponse.json(),
    ])

    photos.value = (result.items || []).map((item) => ({
      id: item.id,
      title: item.title || 'Untitled photo',
      storedTitle: item.title || '',
      description: item.description || '',
      category: item.category,
      image: item.thumbnail_url || item.media_url,
      fullImage: item.media_url,
      thumbnailUrl: item.thumbnail_url,
      createdAt: item.created_at,
    }))
    defaultPhotoIds.value = Object.fromEntries(
      photoCategories.map((category) => [
        category,
        defaultsResult.defaults?.[category]?.id || null,
      ]),
    )
  } catch (error) {
    console.error('Error fetching photos:', error)
    loadError.value = 'Unable to load photos. Please try again.'
  } finally {
    loading.value = false
  }
}

async function generateMissingPhotoPreviews() {
  previewError.value = ''
  previewMessage.value = ''

  if (!adminPassword.value.trim()) {
    previewError.value = 'Please enter the admin password.'
    return
  }

  const photosWithoutPreviews = photos.value.filter((photo) => !photo.thumbnailUrl)

  if (!photosWithoutPreviews.length) return

  generatingPreviews.value = true
  let generatedCount = 0
  const failures = []

  try {
    for (const [index, photo] of photosWithoutPreviews.entries()) {
      previewProgress.value = `Generating preview ${index + 1} of ${photosWithoutPreviews.length}...`

      try {
        const imageResponse = await fetch(photo.fullImage)

        if (!imageResponse.ok) {
          throw new Error(`Could not download original photo (${imageResponse.status}).`)
        }

        const preview = await generatePhotoPreview(await imageResponse.blob())
        const response = await fetch(`/api/media/${encodeURIComponent(photo.id)}/thumbnail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'image/jpeg',
            'X-Admin-Password': adminPassword.value,
            'X-File-Size': String(preview.size),
          },
          body: preview,
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Could not save photo preview.')
        }

        photo.thumbnailUrl = result.thumbnail_url
        photo.image = result.thumbnail_url
        generatedCount += 1
      } catch (error) {
        failures.push(`${photo.title}: ${error.message}`)
      }
    }

    previewMessage.value = `${generatedCount} photo preview${generatedCount === 1 ? '' : 's'} generated.`

    if (failures.length) {
      previewError.value = failures.join(' ')
    }
  } finally {
    generatingPreviews.value = false
    previewProgress.value = ''
  }
}

// Upload modal controls
const openUploadModal = () => {
  showUploadModal.value = true
}

const closeUploadModal = () => {
  showUploadModal.value = false
}

// Refresh after successful upload
const handleUpload = (result) => {
  if (!result?.failures?.length) {
    closeUploadModal()
  }

  fetchPhotos()
}

// Search, filter, and sort photos
const filteredPhotos = computed(() => {
  let result = [...photos.value]

  if (activeCategory.value !== 'All photos') {
    result = result.filter((photo) => photo.category === activeCategory.value)
  }

  if (search.value.trim()) {
    const keyword = search.value.toLowerCase()

    result = result.filter((photo) =>
      [photo.title, photo.description, photo.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword)),
    )
  }

  result.sort((a, b) => {
    if (activeCategory.value !== 'All photos') {
      const defaultPhotoId = defaultPhotoIds.value[activeCategory.value]

      if (a.id === defaultPhotoId) return -1
      if (b.id === defaultPhotoId) return 1
    }

    const dateA = new Date(a.createdAt || 0).getTime()
    const dateB = new Date(b.createdAt || 0).getTime()

    return sortOrder.value === 'oldest' ? dateA - dateB : dateB - dateA
  })

  return result
})

watch(
  () => route.query.category,
  (category) => {
    activeCategory.value = photoCategories.includes(category)
      ? category
      : 'All photos'
  },
  { immediate: true },
)

// Admin mode from footer link
watch(
  () => route.query.admin,
  (value) => {
    adminMode.value = value === '1'

    if (!adminMode.value) {
      adminPassword.value = ''
      deleteError.value = ''
      deleteMessage.value = ''
      metadataError.value = ''
      metadataMessage.value = ''
      defaultPhotoError.value = ''
      defaultPhotoMessage.value = ''
      previewError.value = ''
      previewMessage.value = ''
      editingPhotoId.value = null
    }
  },
  { immediate: true },
)

function selectCategory(category) {
  activeCategory.value = category

  const query = { ...route.query }

  if (category === 'All photos') {
    delete query.category
  } else {
    query.category = category
  }

  router.replace({ query })
}

async function setDefaultPhoto(photo) {
  defaultPhotoError.value = ''
  defaultPhotoMessage.value = ''

  if (!adminPassword.value.trim()) {
    defaultPhotoError.value = 'Please enter the admin password.'
    return
  }

  settingDefaultPhotoId.value = photo.id

  try {
    const response = await fetch('/api/default-photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': adminPassword.value,
      },
      body: JSON.stringify({
        category: photo.category,
        id: photo.id,
      }),
    })
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Could not set the category default photo.')
    }

    defaultPhotoIds.value = {
      ...defaultPhotoIds.value,
      [photo.category]: photo.id,
    }
    defaultPhotoMessage.value = `${photo.category} home photo updated.`
  } catch (error) {
    console.error('Set default photo error:', error)
    defaultPhotoError.value = error.message || 'Could not set the category default photo.'
  } finally {
    settingDefaultPhotoId.value = null
  }
}

function editPhotoDetails(photo) {
  editingPhotoId.value = photo.id
  editTitle.value = photo.storedTitle
  editDescription.value = photo.description
  metadataError.value = ''
  metadataMessage.value = ''
}

function cancelPhotoEdit() {
  editingPhotoId.value = null
  metadataError.value = ''
}

async function savePhotoDetails(photo) {
  metadataError.value = ''
  metadataMessage.value = ''

  if (!adminPassword.value.trim()) {
    metadataError.value = 'Please enter the admin password.'
    return
  }

  savingMetadataId.value = photo.id

  try {
    const response = await fetch(`/api/media/${encodeURIComponent(photo.id)}`, {
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
      throw new Error(result.error || 'Failed to update photo details.')
    }

    photo.storedTitle = result.title
    photo.title = result.title || 'Untitled photo'
    photo.description = result.description
    editingPhotoId.value = null
    metadataMessage.value = 'Photo details updated.'
  } catch (error) {
    console.error('Update photo details error:', error)
    metadataError.value = error.message || 'Unable to update photo details.'
  } finally {
    savingMetadataId.value = null
  }
}

// Delete photo
const deletePhoto = async (photo) => {
  deleteError.value = ''
  deleteMessage.value = ''
  metadataError.value = ''
  metadataMessage.value = ''

  if (!adminPassword.value.trim()) {
    deleteError.value = 'Please enter the admin password.'
    return
  }

  const confirmed = window.confirm(`Are you sure you want to permanently delete "${photo.title}"?`)

  if (!confirmed) return

  deletingId.value = photo.id

  try {
    const response = await fetch(`/api/media/${encodeURIComponent(photo.id)}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Password': adminPassword.value,
      },
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete photo.')
    }

    photos.value = photos.value.filter((item) => item.id !== photo.id)
    if (defaultPhotoIds.value[photo.category] === photo.id) {
      defaultPhotoIds.value = {
        ...defaultPhotoIds.value,
        [photo.category]: null,
      }
    }

    deleteMessage.value = `"${photo.title}" was deleted successfully.`
  } catch (error) {
    console.error('Delete error:', error)
    deleteError.value = error.message || 'Unable to delete photo.'
  } finally {
    deletingId.value = null
  }
}

// Load photos
onMounted(fetchPhotos)
</script>

<template>
  <main class="min-h-screen bg-white">
    <!-- Page Header -->
    <PhotoHeader />

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
          aria-labelledby="uploadPhotoModalTitle"
        >
          <!-- Modal Header -->
          <div class="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2
                id="uploadPhotoModalTitle"
                class="font-serif text-2xl font-semibold text-[#393970]"
              >
                Upload a Photo
              </h2>

              <p class="mt-1 text-sm text-gray-500">Share your memories with everyone.</p>
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

          <!-- Photo Upload Component -->
          <PhotoUpload media-type="photo" @uploaded="handleUpload" />
        </div>
      </div>
    </Teleport>

    <!-- Admin Management Modal -->
    <Teleport to="body">
      <div
        v-if="adminMode"
        class="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8"
        @click.self="router.push('/photos')"
      >
      <div
        class="relative my-auto max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-2xl md:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photoManagementTitle"
      >
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 id="photoManagementTitle" class="text-lg font-semibold text-gray-800">
              Photo Management
            </h2>

            <p class="mt-1 text-sm text-gray-500">
              Manage photos and add titles and descriptions.
            </p>
          </div>

          <button
            type="button"
            @click="$router.push('/photos')"
            class="text-sm text-gray-500 transition hover:text-red-600"
          >
            Close
          </button>
        </div>

        <!-- Admin Password -->
        <div class="mb-5">
          <label for="adminPassword" class="mb-2 block text-sm font-medium text-gray-700">
            Admin Password
          </label>

          <input
            id="adminPassword"
            v-model="adminPassword"
            type="password"
            placeholder="Enter admin password"
            autocomplete="current-password"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <!-- Error Message -->
        <p
          v-if="defaultPhotoError || metadataError || deleteError"
          class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ defaultPhotoError || metadataError || deleteError }}
        </p>

        <!-- Success Message -->
        <p
          v-if="defaultPhotoMessage || metadataMessage || deleteMessage"
          class="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {{ defaultPhotoMessage || metadataMessage || deleteMessage }}
        </p>

        <!-- Photo Count -->
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Uploaded Photos</h3>

          <span class="text-xs text-gray-500"> {{ photos.length }} photos </span>
        </div>

        <div v-if="photos.some((photo) => !photo.thumbnailUrl)" class="mb-4">
          <button
            type="button"
            @click="generateMissingPhotoPreviews"
            :disabled="generatingPreviews"
            class="rounded-lg bg-[#393970] px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {{ generatingPreviews ? previewProgress : 'Generate missing photo previews' }}
          </button>

          <p v-if="previewMessage" class="mt-2 text-xs text-green-700">{{ previewMessage }}</p>
          <p v-if="previewError" class="mt-2 text-xs text-red-600">{{ previewError }}</p>
        </div>

        <!-- Photo List -->
        <div v-if="photos.length" class="space-y-3">
          <div
            v-for="photo in photos"
            :key="photo.id"
            class="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3"
          >
            <img
              :src="photo.image"
              :alt="photo.title"
              class="h-16 w-16 shrink-0 rounded-lg object-cover"
            />

            <div class="min-w-0 flex-1">
              <template v-if="editingPhotoId === photo.id">
                <input
                  v-model="editTitle"
                  type="text"
                  maxlength="150"
                  placeholder="Photo title (optional)"
                  class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />

                <textarea
                  v-model="editDescription"
                  maxlength="1000"
                  rows="2"
                  placeholder="Photo description (optional)"
                  class="mt-2 w-full resize-y rounded border border-gray-300 px-3 py-2 text-sm"
                ></textarea>

                <div class="mt-2 flex gap-2">
                  <button
                    type="button"
                    @click="savePhotoDetails(photo)"
                    :disabled="savingMetadataId === photo.id"
                    class="rounded bg-[#393970] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {{ savingMetadataId === photo.id ? 'Saving...' : 'Save details' }}
                  </button>

                  <button
                    type="button"
                    @click="cancelPhotoEdit"
                    :disabled="savingMetadataId === photo.id"
                    class="rounded bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </template>

              <template v-else>
                <p class="truncate text-sm font-medium text-gray-800">
                  {{ photo.title }}
                </p>

                <p class="mt-1 text-xs text-gray-500">
                  {{ photo.category }}
                  <span v-if="defaultPhotoIds[photo.category] === photo.id">
                    · Home default
                  </span>
                </p>

                <p v-if="photo.description" class="mt-1 line-clamp-2 text-xs text-gray-500">
                  {{ photo.description }}
                </p>
              </template>
            </div>

            <div class="flex shrink-0 flex-col gap-2">
              <button
                type="button"
                @click="setDefaultPhoto(photo)"
                :disabled="
                  settingDefaultPhotoId !== null ||
                  defaultPhotoIds[photo.category] === photo.id
                "
                class="rounded-lg bg-[#F5C400] px-3 py-2 text-xs font-medium text-[#393970] transition hover:bg-[#E5B600] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{
                  settingDefaultPhotoId === photo.id
                    ? 'Saving...'
                    : defaultPhotoIds[photo.category] === photo.id
                      ? 'Home default'
                      : 'Set as home photo'
                }}
              </button>

              <button
                type="button"
                @click="editPhotoDetails(photo)"
                :disabled="editingPhotoId !== null || savingMetadataId !== null"
                class="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Edit details
              </button>

              <button
                type="button"
                @click="deletePhoto(photo)"
                :disabled="deletingId === photo.id"
                class="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ deletingId === photo.id ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>

        <p v-else class="rounded-lg bg-white p-5 text-center text-sm text-gray-500">
          No photos available.
        </p>
      </div>
      </div>
    </Teleport>

    <!-- Loading -->
    <div v-if="loading" class="mx-auto max-w-7xl px-6 py-10 text-center text-sm text-gray-500">
      Loading photos...
    </div>

    <!-- Loading Error -->
    <div v-else-if="loadError" class="mx-auto max-w-7xl px-6 py-10 text-center">
      <p class="text-sm text-red-600">
        {{ loadError }}
      </p>

      <button
        type="button"
        @click="fetchPhotos"
        class="mt-3 text-sm font-medium text-indigo-600 hover:underline"
      >
        Try again
      </button>
    </div>

    <!-- Gallery -->
    <template v-else>
      <PhotoToolbar
        :categories="categories"
        :search="search"
        :active-category="activeCategory"
        :sort-order="sortOrder"
        @update:search="search = $event"
        @update:active-category="selectCategory"
        @update:sort-order="sortOrder = $event"
      />

      <PhotoGallery :photos="filteredPhotos" />

      <!-- Add Photo CTA -->
      <section class="mx-auto max-w-7xl px-6 pb-16 pt-12 md:px-10">
        <div class="border-t border-[#E8E6E0] pt-10 text-center">
          <h2 class="font-serif text-2xl font-semibold text-[#393970]">Want to add a photo?</h2>

          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Share a favorite moment and let it become part of our memories.
          </p>

          <button
            type="button"
            @click="openUploadModal"
            class="mt-5 inline-flex items-center gap-2 rounded-full border border-[#393970] px-6 py-2.5 text-sm font-medium text-[#393970] transition hover:bg-[#393970] hover:text-white"
          >
            <span class="text-base">+</span>
            Add a Photo
          </button>
        </div>
      </section>
    </template>
  </main>
</template>
