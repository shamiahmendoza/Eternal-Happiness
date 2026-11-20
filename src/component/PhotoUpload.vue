<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  mediaType: {
    type: String,
    default: 'photo',
  },
})

const emit = defineEmits(['uploaded'])

const categories = ['Event', 'Ministry', 'Shared meals', 'Manila']

const password = ref('')
const title = ref('')
const description = ref('')
const category = ref('Event')
const selectedFile = ref(null)

const uploading = ref(false)
const message = ref('')
const error = ref('')
const progress = ref(0)

const isPhoto = computed(() => props.mediaType === 'photo')

const acceptedFiles = computed(() =>
  isPhoto.value
    ? 'image/jpeg,image/png,image/webp,image/gif'
    : 'video/mp4,video/webm,video/quicktime',
)

const filePreview = computed(() => {
  if (!selectedFile.value) return ''

  return URL.createObjectURL(selectedFile.value)
})

function selectFile(event) {
  selectedFile.value = event.target.files[0] || null
  message.value = ''
  error.value = ''
}

async function uploadMedia() {
  message.value = ''
  error.value = ''
  progress.value = 0

  const file = selectedFile.value

  if (!password.value) {
    error.value = 'Please enter the upload password.'
    return
  }

  if (!file) {
    error.value = 'Please select a file.'
    return
  }

  if (!title.value.trim()) {
    error.value = 'Please enter a title.'
    return
  }

  if (file.size > 90 * 1024 * 1024) {
    error.value = 'The maximum file size is 90 MB.'
    return
  }

  if (!file.type || !acceptedFiles.value.split(',').includes(file.type)) {
    error.value = 'This file format is not supported.'
    return
  }

  uploading.value = true

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
        'X-Upload-Password': password.value,
        'X-File-Size': String(file.size),
        'X-Title': encodeURIComponent(title.value.trim()),
        'X-Description': encodeURIComponent(description.value.trim()),
        'X-Category': encodeURIComponent(category.value),
      },
      body: file,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed.')
    }

    message.value = 'Media uploaded successfully!'

    progress.value = 100

    emit('uploaded', result)

    // Reset form fields except password.
    title.value = ''
    description.value = ''
    category.value = 'Event'
    selectedFile.value = null
  } catch (err) {
    error.value = err.message || 'Something went wrong.'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <section class="bg-[#FAF9F4] px-6 py-12 md:px-12">
    <div class="mx-auto max-w-3xl">
      <div class="mb-8">
        <p class="text-[10px] uppercase tracking-[0.2em] text-[#77758A]">Archive contribution</p>

        <h2 class="mt-3 font-serif text-3xl text-[#393970]">
          Add {{ isPhoto ? 'a photo' : 'a video' }}
        </h2>

        <p class="mt-2 text-sm text-gray-500">Share a memory with the Eternal Happiness archive.</p>
      </div>

      <form class="space-y-5" @submit.prevent="uploadMedia">
        <!-- Password -->
        <div>
          <label class="mb-2 block text-xs text-[#393970]"> Upload password </label>

          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="Enter upload password"
            class="w-full border border-[#DCD9E8] bg-white px-4 py-3 text-sm outline-none focus:border-[#393970]"
          />
        </div>

        <!-- File -->
        <div>
          <label class="mb-2 block text-xs text-[#393970]">
            Select {{ isPhoto ? 'photo' : 'video' }}
          </label>

          <input
            type="file"
            :accept="acceptedFiles"
            required
            @change="selectFile"
            class="w-full border border-[#DCD9E8] bg-white p-3 text-sm"
          />

          <p class="mt-2 text-[10px] text-gray-400">Maximum file size: 90 MB</p>

          <div v-if="selectedFile" class="mt-3">
            <img
              v-if="isPhoto"
              :src="filePreview"
              alt="Selected photo preview"
              class="max-h-64 w-full object-contain bg-[#EFEDF7]"
            />

            <p class="mt-2 text-xs text-gray-500">
              File: {{ selectedFile.name }}
              <br />
              Size: {{ (selectedFile.size / (1024 * 1024)).toFixed(2) }} MB
              <br />
              Format: {{ selectedFile.type || 'Unknown' }}
            </p>
          </div>
        </div>

        <!-- Title -->
        <div>
          <label class="mb-2 block text-xs text-[#393970]"> Title </label>

          <input
            v-model="title"
            type="text"
            maxlength="150"
            required
            placeholder="Enter a title"
            class="w-full border border-[#DCD9E8] bg-white px-4 py-3 text-sm outline-none focus:border-[#393970]"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="mb-2 block text-xs text-[#393970]"> Description </label>

          <textarea
            v-model="description"
            maxlength="1000"
            rows="3"
            placeholder="Write a short description (optional)"
            class="w-full resize-none border border-[#DCD9E8] bg-white px-4 py-3 text-sm outline-none focus:border-[#393970]"
          ></textarea>
        </div>

        <!-- Category -->
        <div>
          <label class="mb-2 block text-xs text-[#393970]"> Category </label>

          <select
            v-model="category"
            class="w-full border border-[#DCD9E8] bg-white px-4 py-3 text-sm outline-none focus:border-[#393970]"
          >
            <option v-for="item in categories" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>

        <!-- Messages -->
        <p v-if="error" class="text-sm text-red-600">
          {{ error }}
        </p>

        <p v-if="message" class="text-sm text-green-700">
          {{ message }}
        </p>

        <!-- Upload Button -->
        <button
          type="submit"
          :disabled="uploading"
          class="w-full bg-[#393970] px-6 py-4 text-xs uppercase tracking-widest text-white transition hover:bg-[#292952] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ uploading ? 'Uploading...' : 'Upload to archive' }}
        </button>
      </form>
    </div>
  </section>
</template>
