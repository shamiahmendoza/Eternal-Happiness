<script setup>
defineProps({
  video: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['play'])
</script>

<template>
  <section v-if="video" class="bg-[#FAF9F4] px-6 pb-14 md:px-12 md:pb-20">
    <div class="mx-auto max-w-7xl">
      <p class="text-[9px] uppercase tracking-[0.2em] text-[#77758A]">Featured Video</p>

      <h2 class="mt-4 font-serif text-3xl text-[#393970] md:text-4xl">
        {{ video.title }}
      </h2>

      <div
        class="group relative mt-7 aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-[#242442]"
        role="button"
        tabindex="0"
        :aria-label="`Play ${video.title}`"
        @click="emit('play', video)"
        @keydown.enter="emit('play', video)"
        @keydown.space.prevent="emit('play', video)"
      >
        <img
          v-if="video.thumbnail"
          :src="video.thumbnail"
          :alt="`${video.title} thumbnail`"
          class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div v-else class="absolute inset-0 flex items-center justify-center bg-[#393970]">
          <span class="text-sm text-white/70">Featured Video</span>
        </div>

        <div class="absolute inset-0 bg-black/25 transition group-hover:bg-black/40"></div>

        <div class="absolute inset-0 flex items-center justify-center">
          <span
            class="flex size-16 items-center justify-center rounded-full bg-white/90 text-[#393970] shadow-lg transition group-hover:scale-110"
          >
            <svg viewBox="0 0 24 24" class="ml-1 size-7 fill-current" aria-hidden="true">
              <path d="M7 4.5v15l12-7.5z" />
            </svg>
          </span>
        </div>

        <span
          class="absolute bottom-4 left-4 rounded bg-black/50 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-white"
        >
          Watch featured video
        </span>
      </div>

      <p v-if="video.description" class="mt-5 max-w-3xl text-sm leading-relaxed text-gray-500">
        {{ video.description }}
      </p>

      <p class="mt-3 text-[10px] uppercase tracking-wider text-[#9995A8]">
        {{ video.category }}<span v-if="video.date"> · {{ video.date }}</span>
      </p>

      <p class="mt-8 font-serif text-sm text-[#393970]">A day together. A lifetime to remember.</p>
    </div>
  </section>
</template>
