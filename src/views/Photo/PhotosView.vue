<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import PhotoHeader from './components/PhotoHeader.vue'
import PhotoToolbar from './components/PhotoToolbar.vue'
import PhotoGallery from './components/PhotoGallery.vue'
import PhotoUpload from '../../component/PhotoUpload.vue'

const route = useRoute()

// Categories
const categories = ['All photos', 'Event', 'Ministry', 'Shared meals', 'Manila']

// Photo data
const photos = ref([])

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
const deleteError = ref('')
const deleteMessage = ref('')

// Format date
const formatDate = (dateValue) => {
  if (!dateValue) return ''

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Fetch photos
const fetchPhotos = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const response = await fetch('/api/media?type=photo')

    if (!response.ok) {
      throw new Error('Unable to load photos.')
    }

    const result = await response.json()

    photos.value = (result.items || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      date: formatDate(item.created_at),
      image: item.media_url,
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error('Error fetching photos:', error)
    loadError.value = 'Unable to load photos. Please try again.'
  } finally {
    loading.value = false
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
const handleUpload = () => {
  closeUploadModal()
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
    const dateA = new Date(a.createdAt || 0).getTime()
    const dateB = new Date(b.createdAt || 0).getTime()

    return sortOrder.value === 'oldest' ? dateA - dateB : dateB - dateA
  })

  return result
})

// Admin mode from footer link
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
  { immediate: true },
)

// Delete photo
const deletePhoto = async (photo) => {
  deleteError.value = ''
  deleteMessage.value = ''

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
        class="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8"
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

    <!-- Admin Management Panel -->
    <section v-if="adminMode" class="mx-auto max-w-7xl px-6 pb-8 md:px-10">
      <div class="rounded-xl border border-gray-200 bg-gray-50 p-5 md:p-7">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-800">Photo Management</h2>

            <p class="mt-1 text-sm text-gray-500">Manage and delete uploaded photos.</p>
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
        <p v-if="deleteError" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {{ deleteError }}
        </p>

        <!-- Success Message -->
        <p
          v-if="deleteMessage"
          class="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {{ deleteMessage }}
        </p>

        <!-- Photo Count -->
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Uploaded Photos</h3>

          <span class="text-xs text-gray-500"> {{ photos.length }} photos </span>
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
              <p class="truncate text-sm font-medium text-gray-800">
                {{ photo.title }}
              </p>

              <p class="mt-1 text-xs text-gray-500">{{ photo.category }} · {{ photo.date }}</p>
            </div>

            <button
              type="button"
              @click="deletePhoto(photo)"
              :disabled="deletingId === photo.id"
              class="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ deletingId === photo.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>

        <p v-else class="rounded-lg bg-white p-5 text-center text-sm text-gray-500">
          No photos available.
        </p>
      </div>
    </section>

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
        @update:active-category="activeCategory = $event"
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
