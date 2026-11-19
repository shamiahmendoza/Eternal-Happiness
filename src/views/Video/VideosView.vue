<script setup>
import { ref } from 'vue'

import VideoHeader from './components/VideoHeader.vue'
import FeaturedVideo from './components/FeaturedVideo.vue'
import VideoGallery from './components/VideoGallery.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import { heroImage } from '../../services/mediaService'

// Temporary sample video URL
const sampleVideoUrl =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

// Featured video
const featuredVideo = {
  id: 1,
  title: 'Our time in Manila',
  description: 'Convention highlights · Manila, Philippines',
  category: 'Convention',
  thumbnail: heroImage,
  url: sampleVideoUrl
}

// Other videos
const videos = ref([
  {
    id: 2,
    title: 'Worshipping together',
    category: 'Convention',
    thumbnail: heroImage,
    description: 'Moments of worship and encouragement.',
    url: sampleVideoUrl
  },
  {
    id: 3,
    title: 'A warm Filipino welcome',
    category: 'Fellowship',
    thumbnail: heroImage,
    description: 'The warmth of friendship and hospitality.',
    url: sampleVideoUrl
  },
  {
    id: 4,
    title: 'Friendships to treasure',
    category: 'Together',
    thumbnail: heroImage,
    description: 'The memories and friendships we treasure.',
    url: sampleVideoUrl
  }
])

// Currently selected video
const selectedVideo = ref(null)

function playVideo(video) {
  selectedVideo.value = video
}

function closeVideo() {
  selectedVideo.value = null
}
</script>

<template>
  <div>
    <VideoHeader />

    <FeaturedVideo
      :video="featuredVideo"
      @play="playVideo"
    />

    <VideoGallery
      :videos="videos"
      @play="playVideo"
    />

    <VideoPlayer
      :video="selectedVideo"
      @close="closeVideo"
    />
  </div>
</template>
