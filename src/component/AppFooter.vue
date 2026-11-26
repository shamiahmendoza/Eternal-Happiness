<script setup>
import { RouterLink } from 'vue-router'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Photos', path: '/photos' },
  { name: 'Videos', path: '/videos' },
  { name: 'About', path: '/about' },
]
</script>

<template>
  <footer class="w-full bg-[#393970] text-white">
    <div class="mx-auto max-w-7xl px-6 py-12 md:px-10">
      <div class="grid grid-cols-1 gap-10 md:grid-cols-3">
        <!-- Branding -->
        <div>
          <h2 class="text-xl font-bold tracking-wide">SVC International Convention 2026</h2>

          <p class="mt-3 text-sm text-white/70">One worldwide family. Memories to keep.</p>
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
            A Reminder: See Yourself as Jehovah Does
          </h3>

          <p class="text-sm italic leading-relaxed text-white/80">
            "For you became precious in my eyes,
            You were honored, and I have loved you.
            So I will give people in place of you
            And nations in exchange for your life."
          </p>

          <p class="mt-2 text-xs text-white/50">Isaiah 43:4</p>
        </div>
      </div>

      <!-- Bottom Footer -->
      <div class="mt-10 border-t border-white/15 pt-6">
        <div
          class="flex flex-col items-center justify-between gap-4 text-center text-xs text-white/50 md:flex-row md:text-left"
        >
          <p>2026 International Convention · Manila, Philippines</p>

          <div class="flex flex-wrap items-center justify-center gap-3">
            <span> November 2, 2025 · Remembered with love </span>

            <span class="text-white/30">|</span>

            <RouterLink to="/photos?admin=1" class="transition-colors hover:text-yellow-300">
              Photos Admin
            </RouterLink>

            <span class="text-white/30">|</span>

            <RouterLink to="/videos?admin=1" class="transition-colors hover:text-yellow-300">
              Videos Admin
            </RouterLink>

            <span class="text-white/30">|</span>

            <RouterLink
              to="/videos?admin=1&featured=1#featured"
              class="font-semibold text-yellow-300 transition-colors hover:text-yellow-200"
            >
              + Upload Featured Video
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
