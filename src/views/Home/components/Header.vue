
<script setup>
import { ref } from 'vue'
import { heroImage } from '../../../services/mediaService'

const imageLoaded = ref(false)
const imageError = ref(false)

console.log('Hero image URL:', heroImage)

function handleImageLoad() {
  imageLoaded.value = true
  imageError.value = false

  console.log('Hero image loaded successfully:', heroImage)
}

function handleImageError(event) {
  imageLoaded.value = false
  imageError.value = true

  console.error('Failed image URL:', event.target.currentSrc)
  console.error('Image source:', event.target.src)
}
</script>

<template>
  <section class="bg-[#FAF9F4] px-6 py-10 md:px-12 md:py-14">
    <div class="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">

      <!-- Hero Text -->
      <div class="order-2 md:order-1">
        <p class="mb-5 text-[10px] uppercase tracking-[0.25em] text-[#77758A]">
          Manila · November 2, 2026
        </p>

        <h1 class="font-serif text-5xl leading-[0.95] text-[#393970] md:text-7xl">
          Eternal
          <br />
          Happiness
        </h1>

        <p class="mt-6 max-w-md text-sm leading-6 text-gray-500">
          Photos, videos, and treasured memories from our
          2026 International Convention in Manila.
          A day together. A lifetime to remember.
        </p>

        <div class="mt-7 flex flex-wrap items-center gap-5">
          <RouterLink
            to="/photos"
            class="inline-flex items-center gap-8 bg-[#F5C400] px-5 py-3 text-xs font-medium text-[#393970] transition hover:bg-[#E5B600]"
          >
            Browse all photos
            <span>↗</span>
          </RouterLink>

          <RouterLink
            to="/videos"
            class="text-xs text-[#393970] hover:underline"
          >
            Watch the videos →
          </RouterLink>
        </div>
      </div>

      <!-- Hero Image -->
      <div class="order-1 md:order-2">
        <div class="relative">

          <img
            :src="heroImage"
            alt="Convention gathering"
            class="h-[300px] w-full object-cover md:h-[450px]"
            @load="handleImageLoad"
            @error="handleImageError"
          />

          <!-- Image Loading Status -->
          <div
            v-if="!imageLoaded && !imageError"
            class="absolute bottom-3 left-3 bg-white/90 px-3 py-2 text-[10px] text-gray-500"
          >
            Loading R2 image...
          </div>

          <div
            v-if="imageLoaded"
            class="absolute bottom-3 left-3 bg-green-100 px-3 py-2 text-[10px] text-green-700"
          >
            R2 image loaded successfully
          </div>

          <div
            v-if="imageError"
            class="absolute bottom-3 left-3 max-w-[90%] break-all bg-red-100 px-3 py-2 text-[10px] text-red-700"
          >
            Unable to load R2 image.
            <br />
            {{ heroImage }}
          </div>

        </div>

        <div class="mt-3 flex justify-between text-[9px] uppercase tracking-widest text-gray-400">
          <span>Faith. Friendship. Forever.</span>
          <span>01 / 04</span>
        </div>
      </div>

    </div>
  </section>
</template>
