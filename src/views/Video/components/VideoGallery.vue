<script setup>
defineProps({
  videos: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['play'])
</script>

<template>
  <section class="bg-[#FAF9F4] px-6 pb-12 md:px-12 md:pb-16">
    <div class="mx-auto max-w-7xl">

      <p class="text-[9px] uppercase tracking-[0.2em] text-[#77758A]">
        Relive the day
      </p>

      <h2 class="mt-4 font-serif text-3xl text-[#393970] md:text-4xl">
        More moments in motion
      </h2>

      <!-- Video Cards -->
      <div class="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

        <article
          v-for="video in videos"
          :key="video.id"
          class="group min-w-0"
        >
          <button
            type="button"
            class="relative block w-full overflow-hidden bg-[#393970] text-left"
            @click="emit('play', video)"
          >
            <img
              :src="video.thumbnail"
              :alt="video.title"
              loading="lazy"
              class="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-105"
            />

            <!-- Category Label -->
            <span class="absolute left-0 top-0 bg-[#F5C400] px-3 py-2 text-[8px] uppercase tracking-wider text-[#393970]">
              {{ video.category }}
            </span>

            <!-- Play Button -->
            <span class="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#393970] transition group-hover:scale-110">
              <svg viewBox="0 0 24 24" class="ml-0.5 size-4 fill-current" aria-hidden="true">
                <path d="M7 4.5v15l12-7.5z" />
              </svg>
            </span>
          </button>

          <h3 class="mt-3 font-serif text-lg text-[#393970]">
            {{ video.title }}
          </h3>

          <p class="mt-1 text-[9px] uppercase tracking-[0.15em] text-gray-400">
            {{ video.category }} · Video preview
          </p>
        </article>

      </div>

      <p class="mt-10 font-serif text-sm text-[#393970]">
        A day together. A lifetime to remember.
      </p>

    </div>
  </section>
</template>
