<template>
  <section class="bg-[#FAF9F4] px-6 py-12 md:px-12 md:py-16">
    <div class="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">

      <div>
        <p class="text-[9px] uppercase tracking-[0.25em] text-[#77758A]">
          Remembering our time together
        </p>

        <h2 class="mt-5 font-serif text-3xl leading-tight text-[#393970] md:text-4xl">
          Relive the joy
          <br />
          of being together.
        </h2>

        <p class="mt-4 text-xs text-gray-500">
          Keep the friendships close and the memories alive.
        </p>

        <RouterLink
          to="/memories"
          class="mt-6 inline-flex items-center gap-8 bg-[#F5C400] px-5 py-3 text-xs font-medium text-[#393970] transition hover:bg-[#E5B600]"
        >
          Explore the memories
          <span>↗</span>
        </RouterLink>
      </div>

      <div class="bg-[#EFEDF7] p-8 md:p-10">
        <p class="font-serif text-3xl text-[#393970]">“</p>

        <h3 class="font-serif text-2xl leading-snug text-[#393970]">
          United by faith.
          <br />
          Connected by love.
        </h3>

        <p class="mt-5 text-[9px] uppercase tracking-[0.2em] text-[#77758A]">
          Our worldwide family
        </p>
      </div>

    </div>
  </section>
</template>
