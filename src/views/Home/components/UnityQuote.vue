<script setup>
import { heroImage } from '../../../services/mediaService'

const image = heroImage
</script>

<template>
  <section class="grid md:grid-cols-2">

    <!-- Photo -->
    <div class="min-h-[280px] md:min-h-[400px]">
      <img
        :src="image"
        alt="Friends celebrating together"
        loading="lazy"
        class="h-full min-h-[280px] w-full object-cover md:min-h-[400px]"
      />
    </div>

    <!-- Bible Verse -->
    <div class="flex flex-col justify-center bg-[#F5C400] px-8 py-12 md:px-14 md:py-16">

      <p class="text-[9px] uppercase tracking-[0.25em] text-[#393970]">
        Psalm 133:1
      </p>

      <h2 class="mt-6 max-w-lg font-serif text-3xl leading-tight text-[#393970] md:text-4xl">
        "Look! How good and how pleasant it is for brothers to dwell together in unity!"
      </h2>

      <p class="mt-7 text-[9px] uppercase tracking-[0.2em] text-[#393970]/70">
        Manila · November 2, 2026
      </p>

    </div>

  </section>
</template>
