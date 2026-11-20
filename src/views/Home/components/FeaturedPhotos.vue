
<script setup>
import { ref, onMounted } from 'vue'

const latestPhoto = ref(null)
const loading = ref(true)
const error = ref(false)

const API_URL = 'https://eternal-happiness2026-svc.shamiahmacawilimendoza0809.workers.dev'

const fetchLatestPhoto = async () => {
  loading.value = true
  error.value = false

  try {
    const response = await fetch(`${API_URL}/api/media?type=photo`)

    if (!response.ok) {
      throw new Error('Failed to fetch photos')
    }

    const data = await response.json()

    // Your Worker returns { items: [...] }
    const photos = data.items || []

    // First item is the latest because Worker uses ORDER BY created_at DESC
    latestPhoto.value = photos.length ? photos[0] : null

  } catch (err) {
    console.error('Error fetching latest photo:', err)
    error.value = true
    latestPhoto.value = null
  } finally {
    loading.value = false
  }
}

onMounted(fetchLatestPhoto)
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

      <!-- Latest Uploaded Photo -->
      <RouterLink
        v-if="latestPhoto"
        to="/photos"
        class="group block max-w-2xl"
      >
        <div class="overflow-hidden bg-[#EFEDF7]">
          <img
            :src="latestPhoto.media_url"
            :alt="latestPhoto.title"
            loading="lazy"
            class="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>

        <h3 class="mt-3 font-serif text-lg text-[#393970]">
          {{ latestPhoto.title }}
        </h3>

        <p class="mt-1 text-[10px] uppercase tracking-[0.15em] text-gray-400">
          {{ latestPhoto.category }} · Latest upload
        </p>
      </RouterLink>

      <!-- Loading -->
      <div
        v-else-if="loading"
        class="flex min-h-48 items-center justify-center bg-[#EFEDF7]"
      >
        <p class="text-xs uppercase tracking-widest text-[#77758A]">
          Loading latest photo...
        </p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!error"
        class="flex min-h-48 max-w-2xl flex-col items-center justify-center border border-dashed border-[#D8D5E2] bg-[#EFEDF7] px-6 text-center"
      >
        <svg
          viewBox="0 0 24 24"
          class="mb-3 size-10 fill-none stroke-[#77758A]"
          stroke-width="1.3"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>

        <h3 class="font-serif text-xl text-[#393970]">
          No Picture Yet
        </h3>

        <p class="mt-2 text-xs text-gray-500">
          Our photo memories will appear here once uploaded.
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else
        class="flex min-h-48 max-w-2xl items-center justify-center bg-[#EFEDF7] px-6 text-center"
      >
        <p class="text-xs text-gray-500">
          Unable to load the latest photo. Please try again later.
        </p>
      </div>

      <!-- Mobile Link -->
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
