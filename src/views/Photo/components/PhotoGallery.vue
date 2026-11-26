<script setup>
import { ref } from 'vue'

defineProps({
  photos: {
    type: Array,
    required: true
  }
})

const selectedPhoto = ref(null)
</script>

<template>
  <section class="bg-[#FAF9F4] px-6 pb-12 md:px-12 md:pb-16">
    <div class="mx-auto max-w-7xl">

      <!-- Photo Grid -->
      <div v-if="photos.length" class="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">

        <article
          v-for="photo in photos"
          :key="photo.id"
          class="group min-w-0"
        >
          <!-- Image -->
          <button
            type="button"
            class="relative block w-full overflow-hidden bg-[#EFEDF7] text-left"
            @click="selectedPhoto = photo"
          >
            <img
              :src="photo.image"
              :alt="photo.title"
              loading="lazy"
              decoding="async"
              class="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
            />

            <span class="absolute left-0 top-0 bg-[#F5C400] px-2 py-1 text-[9px] uppercase tracking-wider text-[#393970]">
              {{ photo.category }}
            </span>
          </button>

        </article>

      </div>

      <!-- No Results -->
      <div
        v-else
        class="py-20 text-center"
      >
        <h2 class="font-serif text-2xl text-[#393970]">
          No photos found.
        </h2>

        <p class="mt-2 text-xs text-gray-500">
          Try another category.
        </p>
      </div>

    </div>

    <!-- Image Lightbox -->
    <div
      v-if="selectedPhoto"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#17172F]/95 p-5"
      @click.self="selectedPhoto = null"
      @keydown.esc="selectedPhoto = null"
    >
      <button
        type="button"
        aria-label="Close image"
        class="absolute right-6 top-5 text-3xl text-white hover:text-[#F5C400]"
        @click="selectedPhoto = null"
      >
        ×
      </button>

      <div class="w-full max-w-5xl">
        <img
          :src="selectedPhoto.fullImage || selectedPhoto.image"
          :alt="selectedPhoto.title"
          class="mx-auto max-h-[75vh] w-full object-contain"
        />

        <div class="mt-4 text-center">
          <p class="mt-1 text-[10px] uppercase tracking-widest text-white/60">
            {{ selectedPhoto.category }}
          </p>
        </div>
      </div>
    </div>

  </section>
</template>
