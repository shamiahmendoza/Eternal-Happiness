
<script setup>
import { RouterLink } from 'vue-router'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Photos', path: '/photos' },
  { name: 'Videos', path: '/videos' },
  { name: 'Memories', path: '/memories' },
  { name: 'About', path: '/about' },
]
</script>

<template>
  <footer class="w-full bg-[#393970] text-white">
    <div class="mx-auto max-w-7xl px-6 py-12 md:px-10">

      <!-- Main Footer Content -->
      <div class="grid grid-cols-1 gap-10 md:grid-cols-3">

        <!-- Branding -->
        <div>
          <h2 class="text-xl font-bold tracking-wide">
            SVC International Convention 2026
          </h2>

          <p class="mt-3 text-sm text-white/70">
            One worldwide family. Memories to keep.
          </p>
        </div>

        <!-- Navigation -->
        <div>
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-yellow-300">
            Quick Links
          </h3>

          <ul class="space-y-2">
            <li v-for="link in navLinks" :key="link.path">
              <RouterLink
                :to="link.path"
                class="text-sm text-white/70 transition-colors hover:text-yellow-300"
              >
                {{ link.name }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Bible Verse -->
        <div>
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-yellow-300">
            A Reminder
          </h3>

          <p class="text-sm italic leading-relaxed text-white/80">
            "How good and how pleasant it is..."
          </p>

          <p class="mt-2 text-xs text-white/50">
            Psalm 133:1
          </p>
        </div>

      </div>

      <!-- Bottom Footer -->
      <div class="mt-10 border-t border-white/15 pt-6">
        <div class="flex flex-col items-center justify-between gap-3 text-center text-xs text-white/50 md:flex-row md:text-left">

          <p>
            2026 International Convention · Manila, Philippines
          </p>

          <div class="flex flex-wrap items-center justify-center gap-3">
            <span>
              November 2, 2025 · Remembered with love
            </span>

            <span class="text-white/30">|</span>

            <RouterLink
              to="/photos?admin=1"
              class="transition-colors hover:text-yellow-300"
            >
              Photos Admin
            </RouterLink>

            <span class="text-white/30">|</span>

            <RouterLink
              to="/videos?admin=1"
              class="transition-colors hover:text-yellow-300"
            >
              Videos Admin
            </RouterLink>
          </div>

        </div>
      </div>

    </div>
  </footer>
</template>
