<script setup>
defineProps({
  video: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['play'])
</script>

<template>
  <section class="bg-[#FAF9F4] px-6 pb-10 md:px-12">
    <div class="mx-auto max-w-7xl">

      <button
        type="button"
        class="group relative block w-full overflow-hidden bg-[#393970] text-left"
        @click="emit('play', video)"
      >
        <!-- Thumbnail -->
        <img
          :src="video.thumbnail"
          :alt="video.title"
          class="aspect-[16/8] w-full object-cover transition duration-700 group-hover:scale-[1.02]"
        />

        <!-- Dark Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#17172F]/90 via-[#17172F]/20 to-transparent"></div>

        <!-- Featured Label -->
        <span class="absolute left-5 top-5 bg-[#F5C400] px-4 py-2 text-[9px] font-medium uppercase tracking-widest text-[#393970] md:left-8 md:top-8">
          Featured video
        </span>

        <!-- Play Button -->
        <span class="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#393970] transition group-hover:scale-110 md:size-16">
          <svg viewBox="0 0 24 24" class="ml-1 size-6 fill-current" aria-hidden="true">
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
        </span>

        <!-- Video Information -->
        <div class="absolute bottom-0 left-0 p-5 text-white md:p-8">
          <h2 class="font-serif text-3xl md:text-5xl">
            {{ video.title }}
          </h2>

          <p class="mt-2 text-[10px] text-white/80 md:text-xs">
            {{ video.description }}
          </p>
        </div>

        <span class="absolute bottom-5 right-5 rounded-full bg-white px-4 py-2 text-[9px] uppercase tracking-wider text-[#393970] md:bottom-8 md:right-8">
          Play video ↗
        </span>
      </button>

    </div>
  </section>
</template>
