<script setup>
defineProps({
  videos: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['play'])
</script>

<template>
  <section v-if="videos.length" class="bg-[#FAF9F4] px-6 pb-16 md:px-12 md:pb-20">
    <div class="mx-auto max-w-7xl">
      <p class="text-[9px] uppercase tracking-[0.2em] text-[#77758A]">The archive</p>

      <h2 class="mt-4 font-serif text-3xl text-[#393970] md:text-4xl">More moments in motion</h2>

      <div class="mt-8 divide-y divide-[#E5E2D9] border-y border-[#E5E2D9]">
        <article v-for="video in videos" :key="video.id" class="group flex items-center gap-4 py-5">
          <!-- Actual video thumbnail -->
          <button
            type="button"
            class="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-[#393970] sm:h-24 sm:w-40"
            :aria-label="`Play ${video.title}`"
            @click="emit('play', video)"
          >
            <img
              v-if="video.thumbnail"
              :src="video.thumbnail"
              :alt="`${video.title} thumbnail`"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />

            <div
              v-else
              class="flex h-full w-full items-center justify-center text-xs text-white/70"
            >
              Video
            </div>

            <span
              class="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/40"
            >
              <span
                class="flex size-9 items-center justify-center rounded-full bg-white/90 text-[#393970]"
              >
                <svg viewBox="0 0 24 24" class="ml-0.5 size-4 fill-current" aria-hidden="true">
                  <path d="M7 4.5v15l12-7.5z" />
                </svg>
              </span>
            </span>
          </button>

          <!-- Video Details -->
          <div class="min-w-0 flex-1">
            <p class="text-[9px] uppercase tracking-[0.15em] text-[#9995A8]">
              {{ video.category }}
            </p>

            <h3
              class="mt-1 truncate font-serif text-lg text-[#393970] transition group-hover:text-[#77758A]"
            >
              {{ video.title }}
            </h3>

            <p class="mt-1 text-[10px] uppercase tracking-wider text-gray-400">
              {{ video.date }}
            </p>

            <p v-if="video.description" class="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
              {{ video.description }}
            </p>
          </div>

          <button
            type="button"
            @click="emit('play', video)"
            class="hidden shrink-0 text-[9px] uppercase tracking-[0.2em] text-[#77758A] transition hover:text-[#393970] sm:block"
          >
            Watch video
          </button>
        </article>
      </div>
    </div>
  </section>
</template>
