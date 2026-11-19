<script setup>
import { ref, computed } from 'vue'

import PhotoHeader from './components/PhotoHeader.vue'
import PhotoToolbar from './components/PhotoToolbar.vue'
import PhotoGallery from './components/PhotoGallery.vue'
import PhotoCTA from './components/PhotoCTA.vue'
import { heroImage } from '../../services/mediaService'

// Categories available in the gallery
const categories = [
  'All photos',
  'Event',
  'Ministry',
  'Shared meals',
  'Manila'
]

// Selected filters
const search = ref('')
const activeCategory = ref('All photos')
const sortOrder = ref('default')

// Temporary photo data
const photos = ref([
  {
    id: 1,
    title: 'Together in Manila',
    category: 'Event',
    date: 'November 2, 2026',
    image: heroImage
  },
  {
    id: 2,
    title: 'United in worship',
    category: 'Ministry',
    date: 'November 2, 2026',
    image: heroImage
  },
  {
    id: 3,
    title: 'Warmth & fellowship',
    category: 'Event',
    date: 'November 2, 2026',
    image: heroImage
  },
  {
    id: 4,
    title: 'Around the table',
    category: 'Shared meals',
    date: 'November 2, 2026',
    image: heroImage
  },
  {
    id: 5,
    title: 'Moments together',
    category: 'Ministry',
    date: 'November 2, 2026',
    image: heroImage
  },
  {
    id: 6,
    title: 'Manila, remembered',
    category: 'Manila',
    date: 'November 2, 2026',
    image: heroImage
  }
])

// Search and category filtering
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

  // Sorting
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
</script>

<template>
  <div>
    <PhotoHeader />

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

    <PhotoCTA />
  </div>
</template>
