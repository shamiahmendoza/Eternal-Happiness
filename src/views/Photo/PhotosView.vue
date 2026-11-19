<script setup>
import { ref, computed } from 'vue'

import PhotoHeader from './components/PhotoHeader.vue'
import PhotoToolbar from './components/PhotoToolbar.vue'
import PhotoGallery from './components/PhotoGallery.vue'
import PhotoCTA from './components/PhotoCTA.vue'

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
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01f18?auto=format&fit=crop&w=1000&q=85'
  },
  {
    id: 2,
    title: 'United in worship',
    category: 'Ministry',
    date: 'November 2, 2026',
    image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1000&q=85'
  },
  {
    id: 3,
    title: 'Warmth & fellowship',
    category: 'Event',
    date: 'November 2, 2026',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85'
  },
  {
    id: 4,
    title: 'Around the table',
    category: 'Shared meals',
    date: 'November 2, 2026',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85'
  },
  {
    id: 5,
    title: 'Moments together',
    category: 'Ministry',
    date: 'November 2, 2026',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1000&q=85'
  },
  {
    id: 6,
    title: 'Manila, remembered',
    category: 'Manila',
    date: 'November 2, 2026',
    image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1000&q=85'
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
