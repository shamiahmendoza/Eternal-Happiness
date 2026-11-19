<script setup>
import Navbar from './component/Navbar.vue'
import Footer from './component/Footer.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <Navbar />

    <main class="flex-1">
      <RouterView />
    </main>

    <Footer />
  </div>
</template>
