<script setup>
import headerImage from '../../../assets/Header1.png'

defineOptions({
  name: 'HomeHeader',
})
</script>

<template>
  <section class="bg-[#FAF9F4] px-6 py-10 md:px-12 md:py-14">
    <div class="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">

      <!-- Hero Text -->
      <div class="order-2 md:order-1">
        <p class="mb-5 text-[10px] uppercase tracking-[0.25em] text-[#77758A]">
          Silang, Cavite · November 2, 2026
        </p>

        <h1 class="font-serif text-5xl leading-[0.95] text-[#393970] md:text-7xl">
          Eternal
          <br />
          Happiness
        </h1>

        <p class="mt-6 max-w-md text-sm leading-6 text-gray-500">
          Photos, videos, and treasured memories from our
          2026 International Convention Hosting in Silang, Cavite.
          A day together. A lifetime to remember.
        </p>

        <div class="mt-7 flex flex-wrap items-center gap-5">
          <RouterLink
            to="/photos"
            class="inline-flex items-center gap-8 bg-[#F5C400] px-5 py-3 text-xs font-medium text-[#393970] transition hover:bg-[#E5B600]"
          >
            Browse all photos
            <span></span>
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
        <div class="relative border-r-[12px] border-[#F5C400] pr-3">

          <img
            :src="headerImage"
            alt="Convention gathering"
            class="h-auto w-full object-contain"
          />

        </div>

        <div class="mt-3 flex justify-between text-[9px] uppercase tracking-widest text-gray-400">
          <span>SPRINGVILE CONGREGATION WITH DELEGATES AROUND THE WORLD</span>
        </div>
      </div>

    </div>
  </section>
</template>
