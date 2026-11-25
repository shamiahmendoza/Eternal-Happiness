<script setup>
defineProps({
  video: {
    type: Object,
    default: null,
  },
})

defineEmits(['close'])
</script>

<template>
  <div
    v-if="video"
    class="fixed inset-0 z-50 flex items-center justify-center bg-[#17172F]/95 p-4 md:p-8"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-5xl">
      <!-- Close Button -->
      <div class="mb-3 flex justify-end">
        <button
          type="button"
          aria-label="Close video"
          class="text-3xl text-white transition hover:text-[#F5C400]"
          @click="$emit('close')"
        >
          ×
        </button>
      </div>

      <!-- Video Player -->
      <video
        :key="video.id"
        class="max-h-[75vh] w-full bg-black"
        controls
        autoplay
        playsinline
        preload="metadata"
      >
        <source :src="video.url" :type="video.contentType || 'video/mp4'" />

        Your browser does not support video playback.
      </video>

      <!-- Video Details -->
      <div class="mt-4 text-white">
        <h2 class="font-serif text-2xl">
          {{ video.title }}
        </h2>

        <p v-if="video.description" class="mt-2 text-sm leading-relaxed text-white/75">
          {{ video.description }}
        </p>
      </div>
    </div>
  </div>
</template>
