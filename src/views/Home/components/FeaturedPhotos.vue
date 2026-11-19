<script setup>
import { heroImage } from '../../../services/mediaService'

const photos = [
  {
    title: 'Warmth of fellowship',
    description: 'A welcome that feels like home.',
    image: heroImage
  },
  {
    title: 'All the smiles',
    description: 'Joy in every moment.',
    image: heroImage
  },
  {
    title: 'Around the table',
    description: 'Good company, grateful hearts.',
    image: heroImage
  },
  {
    title: 'Moments together',
    description: 'Memories worth keeping.',
    image: heroImage
  }
]
</script>

<template>
  <section class="bg-[#FAF9F4] px-6 py-12 md:px-12 md:py-14">
    <div class="mx-auto max-w-7xl">

      <!-- Section Heading -->
      <div class="mb-7 flex items-end justify-between gap-4">
        <div>
          <p class="text-[9px] uppercase tracking-[0.25em] text-[#77758A]">
            From our photo album
          </p>

          <h2 class="mt-3 font-serif text-3xl text-[#393970] md:text-4xl">
            Photos from our time together
          </h2>

          <p class="mt-2 text-xs text-gray-500">
            The little moments. The familiar faces. The joy we carry with us.
          </p>
        </div>

        <RouterLink
          to="/photos"
          class="hidden shrink-0 items-center gap-7 bg-[#F5C400] px-5 py-3 text-xs text-[#393970] transition hover:bg-[#E5B600] sm:inline-flex"
        >
          All photos
          <span>↗</span>
        </RouterLink>
      </div>

      <!-- Photo Cards -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        <RouterLink
          v-for="(photo, index) in photos"
          :key="photo.title"
          to="/photos"
          class="group min-w-0"
        >
          <div class="overflow-hidden">
            <img
              :src="photo.image"
              :alt="photo.title"
              loading="lazy"
              class="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </div>

          <h3 class="mt-3 font-serif text-base text-[#393970]">
            {{ photo.title }}
          </h3>

          <p class="mt-1 text-[10px] leading-4 text-gray-500">
            {{ photo.description }}
          </p>
        </RouterLink>
      </div>

      <RouterLink
        to="/photos"
        class="mt-6 inline-flex items-center gap-7 bg-[#F5C400] px-5 py-3 text-xs text-[#393970] sm:hidden"
      >
        All photos
        <span>↗</span>
      </RouterLink>

    </div>
  </section>
</template>
