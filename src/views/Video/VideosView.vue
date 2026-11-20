<script setup>
import { ref, computed, onMounted } from 'vue'

import VideoHeader from './components/VideoHeader.vue'
import FeaturedVideo from './components/FeaturedVideo.vue'
import VideoGallery from './components/VideoGallery.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import PhotoUpload from '../../component/PhotoUpload.vue'

const videos = ref([])
const selectedVideo = ref(null)
const loading = ref(true)
const loadError = ref('')

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function fetchVideos() {
  loading.value = true
  loadError.value = ''

  try {
    const response = await fetch('/api/media?type=video')

    if (!response.ok) {
      throw new Error('Unable to load videos.')
    }

    const result = await response.json()

    videos.value = result.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      category: item.category,
      thumbnail: '/media/Event/cat.jpg',
      url: item.media_url,
      date: formatDate(item.created_at),
    }))
  } catch (error) {
    loadError.value = error.message
  } finally {
    loading.value = false
  }
}

const featuredVideo = computed(() => videos.value[0] || null)

const otherVideos = computed(() => videos.value.slice(1))

function playVideo(video) {
  selectedVideo.value = video
}

function closeVideo() {
  selectedVideo.value = null
}

function handleUpload() {
  fetchVideos()
}

onMounted(fetchVideos)
</script>

<template>
  <div>
    <VideoHeader />

    <PhotoUpload media-type="video" @uploaded="handleUpload" />

    <div v-if="loading" class="bg-[#FAF9F4] py-16 text-center text-sm text-gray-500">
      Loading videos...
    </div>

    <div v-else-if="loadError" class="bg-[#FAF9F4] py-16 text-center text-sm text-red-600">
      {{ loadError }}

      <button @click="fetchVideos" class="ml-2 underline">Try again</button>
    </div>

    <template v-else-if="featuredVideo">
      <FeaturedVideo :video="featuredVideo" @play="playVideo" />

      <VideoGallery :videos="otherVideos" @play="playVideo" />
    </template>

    <div v-else class="bg-[#FAF9F4] px-6 py-20 text-center">
      <h2 class="font-serif text-2xl text-[#393970]">No videos yet.</h2>

      <p class="mt-2 text-sm text-gray-500">Upload a video to start building your archive.</p>
    </div>

    <VideoPlayer :video="selectedVideo" @close="closeVideo" />
  </div>
</template>
