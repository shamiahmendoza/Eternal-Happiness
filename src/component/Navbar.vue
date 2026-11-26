<script setup>
import { ref, watch } from 'vue'

defineOptions({ name: 'AppNavbar' })
import { useRoute } from 'vue-router'

const route = useRoute()
const isMenuOpen = ref(false)

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Photos', path: '/photos' },
  { name: 'Videos', path: '/videos' },
]

watch(
  () => route.path,
  () => {
    isMenuOpen.value = false
  },
)
</script>

<template>
  <nav class="w-full bg-[#FAF8F1] px-4 py-4 sm:px-6 md:px-12">
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <!-- Website Branding -->
      <RouterLink to="/" class="min-w-0 shrink">
        <h1 class="font-serif text-[15px] leading-tight text-[#414174] sm:text-lg">
          SVC International Convention 2026
        </h1>

        <p class="text-[8px] tracking-[0.25em] text-[#77758A]">MEMORY ARCHIVE</p>
      </RouterLink>

      <!-- Navigation Links -->
      <div class="hidden items-center gap-10 md:flex">
        <RouterLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="relative py-2 text-xs text-[#414174] transition-colors hover:text-[#7772A8]"
          :class="{
            'after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-yellow-500':
              route.path === link.path,
          }"
        >
          {{ link.name }}
        </RouterLink>
      </div>

      <!-- About Button -->
      <RouterLink
        to="/about"
        class="hidden shrink-0 rounded-sm bg-[#414174] px-5 py-2 text-[10px] text-white transition-colors hover:bg-[#302F5A] md:inline-flex"
      >
        About the convention ↗
      </RouterLink>

      <button
        type="button"
        class="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-[#414174] hover:bg-[#414174]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#414174] md:hidden"
        :aria-expanded="isMenuOpen"
        aria-controls="mobile-navigation"
        :aria-label="isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'"
        @click="isMenuOpen = !isMenuOpen"
      >
        <svg
          v-if="!isMenuOpen"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
        <svg
          v-else
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m6 18 12-12M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div
      v-show="isMenuOpen"
      id="mobile-navigation"
      class="mx-auto mt-4 flex max-w-7xl flex-col gap-3 border-t border-[#414174]/15 pt-4 md:hidden"
    >
      <RouterLink
        v-for="link in navLinks"
        :key="link.path"
        :to="link.path"
        class="py-1 text-sm text-[#414174] transition-colors hover:text-[#7772A8]"
        :aria-current="route.path === link.path ? 'page' : undefined"
      >
        {{ link.name }}
      </RouterLink>
      <RouterLink
        to="/about"
        class="mt-1 inline-flex w-fit rounded-sm bg-[#414174] px-4 py-2 text-xs text-white transition-colors hover:bg-[#302F5A]"
        :aria-current="route.path === '/about' ? 'page' : undefined"
      >
        About the convention ↗
      </RouterLink>
    </div>
  </nav>
</template>
