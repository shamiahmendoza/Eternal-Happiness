<script setup>
const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Photos', path: '/photos' },
  { name: 'Videos', path: '/videos' },
  { name: 'Memories', path: '/memories' },
  { name: 'About', path: '/about' },
]
</script>

<template>
  <footer class="w-full bg-[#393970] px-4 py-4 text-white sm:px-6 md:px-12">
    <!-- Main Footer Content -->
    <div class="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:gap-8">
      <!-- Branding -->
      <div>
        <RouterLink to="/">
          <h2 class="font-serif text-lg leading-snug tracking-wide sm:text-xl">
            SVC International Convention 2026
          </h2>
        </RouterLink>

        <p class="mt-1 text-xs text-white/70">One worldwide family. Memories to keep.</p>
      </div>

      <!-- Navigation and Quote -->
      <div class="flex min-w-0 flex-col gap-2">
        <nav class="flex flex-wrap gap-x-5 gap-y-2">
          <RouterLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="py-1 text-[10px] text-white/90 transition-colors hover:text-yellow-300"
          >
            {{ link.name }}
          </RouterLink>
        </nav>

        <p class="text-[10px] leading-relaxed text-white/70">
          "How good and how pleasant it is..." — Psalm 133:1
        </p>
      </div>
    </div>

    <!-- Divider -->
    <div class="mx-auto my-3 max-w-7xl border-t border-white/15"></div>

    <!-- Bottom Footer -->
    <div
      class="mx-auto flex max-w-7xl flex-col justify-between gap-1 text-[9px] leading-relaxed text-white/70 sm:flex-row sm:gap-4"
    >
      <p>2026 International Convention · Manila, Philippines</p>

      <p>November 2, 2025 · Remembered with love</p>
    </div>
  </footer>
</template>
