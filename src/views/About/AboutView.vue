<script setup>
import conventionLogo from '../../assets/event-logo-full.png'
</script>

<template>
  <main class="bg-[#FAF9F4] px-6 py-10 md:px-12 md:py-14">
    <article class="mx-auto max-w-6xl">
      <header class="grid items-center gap-8 border-b border-[#393970]/15 pb-10 md:grid-cols-[1fr_280px] md:gap-12">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#77758A]">
            International Convention
          </p>
          <h1 class="mt-4 font-serif text-4xl leading-tight text-[#393970] md:text-6xl">
            <span class="block uppercase">Philippines</span>
            <span class="mt-1 block text-2xl tracking-wide md:text-3xl">Manila</span>
          </h1>
        </div>

        <img
          :src="conventionLogo"
          alt="Philippines 2026 convention logo"
          class="mx-auto w-full max-w-[280px]"
        />
      </header>

      <div class="mx-auto max-w-3xl py-12 md:py-16">
        <p class="font-serif text-2xl leading-relaxed text-[#393970] md:text-3xl">
          <em>Maligayang pagdating!</em> A warm welcome to you!
        </p>

        <div class="mt-8 space-y-6 text-[15px] leading-8 text-[#55555F] md:text-base">
          <p>
            We would be delighted to welcome you to Manila, Philippines, for the 2026 International
            Convention of Jehovah’s Witnesses. As we anticipate this special spiritual event, we are
            reminded of the psalmist’s joyful words: “I rejoiced when they said to me: ‘Let us go to
            the house of Jehovah.’” (Ps. 122:1) What a privilege it will be to worship together in
            unity with our global brotherhood!
          </p>

          <p>
            During your travel in the Philippines, you will experience the beauty of Jehovah’s
            creation. This archipelago of over 7,100 islands is known for its stunning landscapes,
            rich biodiversity, and exceptionally warm hospitality. From pristine beaches and lush
            mountains to coral reefs teeming with life, the natural wonders of the Philippines
            reflect Jehovah’s awe-inspiring creative works. We warmly invite you to enjoy not only
            the spiritual blessings of the convention but also the beauty of the country.
          </p>

          <p>
            As we look forward to this joyful occasion, we reflect on Psalm 133:1: “Look! How good
            and how pleasant it is for brothers to dwell together in unity!” Your presence in Manila
            will uplift our local brothers and sisters and leave you with treasured memories of
            heartfelt worship and global unity.
          </p>

          <div class="pt-3">
            <p class="font-serif text-xl text-[#393970]">With love,</p>
            <p class="mt-2 font-serif text-xl text-[#393970]">
              Your brothers and sisters in the Philippines
            </p>
          </div>

          <p class="border-t border-[#393970]/15 pt-5 text-xs leading-6 text-[#77758A]">
            Source:
            <a
              href="https://events.jw.org/en/a736720b-aa4a-4cc3-b543-24faa3829a6e/welcome"
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-4 transition-colors hover:text-[#393970]"
            >
              JW Events — Philippines 2026 welcome
            </a>
          </p>
        </div>
      </div>
    </article>
  </main>
</template>
