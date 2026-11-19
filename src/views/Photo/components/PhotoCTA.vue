<template>
  <section class="bg-[#EFEDF7] px-6 py-10 md:px-12 md:py-14">
    <div class="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">

      <div>
        <p class="text-[9px] uppercase tracking-[0.2em] text-[#77758A]">
          More ways to remember
        </p>

        <h2 class="mt-4 font-serif text-3xl text-[#393970] md:text-4xl">
          A day together. A lifetime to remember.
        </h2>

        <p class="mt-3 text-xs text-gray-500">
          Revisit the stories and the moments in motion.
        </p>
      </div>

      <RouterLink
        to="/videos"
        class="inline-flex shrink-0 items-center justify-center gap-2 bg-[#F5C400] px-5 py-3 text-[10px] text-[#393970] transition hover:bg-[#E5B600]"
      >
        Watch the videos
        <span>↗</span>
      </RouterLink>

    </div>
  </section>
</template>
