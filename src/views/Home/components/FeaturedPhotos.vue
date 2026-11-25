
<script setup>
import { ref, onMounted } from 'vue'

const categories = ['Event', 'Ministry', 'Shared meals', 'Manila']
const categoryPhotos = ref({})
const loading = ref(true)
const error = ref(false)

const fetchCategoryPhotos = async () => {
  loading.value = true
  error.value = false

  try {
    const [mediaResponse, defaultsResponse] = await Promise.all([
      fetch('/api/media?type=photo'),
      fetch('/api/default-photos'),
    ])

    if (!mediaResponse.ok || !defaultsResponse.ok) {
      throw new Error('Failed to fetch category photos')
    }

    const [mediaData, defaultsData] = await Promise.all([
      mediaResponse.json(),
      defaultsResponse.json(),
    ])
    const photos = mediaData.items || []
    const defaults = defaultsData.defaults || {}

    categoryPhotos.value = Object.fromEntries(
      categories.map((category) => {
        const selectedPhoto = defaults[category]
        const photo = photos.find((item) => item.id === selectedPhoto?.id)
          || photos.find((item) => item.category === category)

        return [category, photo || null]
      }),
    )
  } catch (err) {
    console.error('Error fetching category photos:', err)
    error.value = true
    categoryPhotos.value = {}
  } finally {
    loading.value = false
  }
}

onMounted(fetchCategoryPhotos)
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

      <p v-if="error" class="mb-4 text-sm text-red-600">
        Unable to load category photos. Please try again later.
      </p>

      <div class="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        <RouterLink
          v-for="category in categories"
          :key="category"
          :to="{ path: '/photos', query: { category } }"
          class="group min-w-0"
        >
          <div class="overflow-hidden bg-[#EFEDF7]">
            <img
              v-if="categoryPhotos[category]"
              :src="categoryPhotos[category].thumbnail_url || categoryPhotos[category].media_url"
              :alt="`${category} photos`"
              loading="lazy"
              decoding="async"
              class="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div
              v-else
              class="flex aspect-[4/3] items-center justify-center px-3 text-center text-xs text-gray-500"
            >
              {{ loading ? 'Loading photo...' : 'No photo selected yet' }}
            </div>
          </div>

          <h3 class="mt-3 font-serif text-lg text-[#393970]">
            {{ category }}
          </h3>
        </RouterLink>
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
