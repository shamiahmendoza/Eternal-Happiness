<script setup>
defineProps({
  search: {
    type: String,
    default: ''
  },
  activeCategory: {
    type: String,
    default: 'All photos'
  },
  categories: {
    type: Array,
    required: true
  },
  sortOrder: {
    type: String,
    default: 'default'
  }
})

const emit = defineEmits([
  'update:search',
  'update:activeCategory',
  'update:sortOrder'
])
</script>

<template>
  <section class="bg-[#FAF9F4] px-6 pb-6 md:px-12">
    <div class="mx-auto max-w-7xl">

      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <!-- Search -->
        <div class="w-full lg:max-w-md">
          <input
            :value="search"
            @input="emit('update:search', $event.target.value)"
            type="search"
            placeholder="Search photos..."
            class="w-full border border-[#E7E3D9] bg-white px-4 py-3 text-xs text-[#393970] outline-none transition placeholder:text-gray-400 focus:border-[#393970]"
          />
        </div>

        <!-- Category Filters -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="category in categories"
            :key="category"
            @click="emit('update:activeCategory', category)"
            class="rounded-full px-4 py-2 text-[10px] transition"
            :class="activeCategory === category
              ? 'bg-[#393970] text-white'
              : 'bg-white text-[#393970] hover:bg-[#EFEDF7]'"
          >
            {{ category }}
          </button>
        </div>

      </div>

      <!-- Collection Label and Sort -->
      <div class="mt-6 flex items-center justify-between">
        <p class="text-[9px] uppercase tracking-[0.2em] text-[#77758A]">
          The preview collection
        </p>

        <label class="flex items-center gap-2 text-[10px] text-gray-500">
          Sort:
          <select
            :value="sortOrder"
            @change="emit('update:sortOrder', $event.target.value)"
            class="cursor-pointer bg-transparent text-[#393970] outline-none"
          >
            <option value="default">Collection order</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">Title A–Z</option>
          </select>
        </label>
      </div>

    </div>
  </section>
</template>
