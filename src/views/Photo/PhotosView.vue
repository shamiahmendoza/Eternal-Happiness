
<script setup>
import { ref, computed, onMounted } from 'vue'

import PhotoHeader from './components/PhotoHeader.vue'
import PhotoToolbar from './components/PhotoToolbar.vue'
import PhotoGallery from './components/PhotoGallery.vue'
import PhotoCTA from './components/PhotoCTA.vue'
import PhotoUpload from '../../component/PhotoUpload.vue'

const categories = [
  'All photos',
  'Event',
  'Ministry',
  'Shared meals',
  'Manila'
]

const search = ref('')
const activeCategory = ref('All photos')
const sortOrder = ref('default')

const photos = ref([])
const loading = ref(true)
const loadError = ref('')

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

async function fetchPhotos() {
  loading.value = true
  loadError.value = ''

  try {
    const response = await fetch('/api/media?type=photo')

    if (!response.ok) {
      throw new Error('Unable to load photos.')
    }

    const result = await response.json()

    photos.value = result.items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      date: formatDate(item.created_at),
      image: item.media_url
    }))
  } catch (error) {
    loadError.value = error.message
  } finally {
    loading.value = false
  }
}

function handleUpload() {
  fetchPhotos()
}

const filteredPhotos = computed(() => {
  let result = photos.value.filter(photo => {
    const matchesCategory =
      activeCategory.value === 'All photos' ||
      photo.category === activeCategory.value

    const searchTerm = search.value.toLowerCase().trim()

    const matchesSearch =
      photo.title.toLowerCase().includes(searchTerm) ||
      photo.category.toLowerCase().includes(searchTerm)

    return matchesCategory && matchesSearch
  })

  if (sortOrder.value === 'az') {
    result.sort((a, b) => a.title.localeCompare(b.title))
  }

  if (sortOrder.value === 'newest') {
    result.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  if (sortOrder.value === 'oldest') {
    result.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  return result
})

onMounted(fetchPhotos)
</script>

<template>
  <div>
    <PhotoHeader />

    <PhotoUpload
      media-type="photo"
      @uploaded="handleUpload"
    />

    <PhotoToolbar
      :categories="categories"
      :search="search"
      :active-category="activeCategory"
      :sort-order="sortOrder"
      @update:search="search = $event"
      @update:active-category="activeCategory = $event"
      @update:sort-order="sortOrder = $event"
    />

    <div v-if="loading" class="bg-[#FAF9F4] py-16 text-center text-sm text-gray-500">
      Loading photos...
    </div>

    <div v-else-if="loadError" class="bg-[#FAF9F4] py-16 text-center text-sm text-red-600">
      {{ loadError }}
      <button @click="fetchPhotos" class="ml-2 underline">
        Try again
      </button>
    </div>

    <PhotoGallery
      v-else
      :photos="filteredPhotos"
    />

    <PhotoCTA />
  </div>
</template>
