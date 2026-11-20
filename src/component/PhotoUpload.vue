<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

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
const uploadStatus = ref('')

const isPhoto = computed(() => props.mediaType === 'photo')

const acceptedFiles = computed(() =>
  isPhoto.value
    ? 'image/jpeg,image/png,image/webp,image/gif'
    : 'video/mp4,video/webm,video/quicktime',
)

const filePreview = ref('')

function selectFile(event) {
  if (filePreview.value) {
    URL.revokeObjectURL(filePreview.value)
  }

  selectedFile.value = event.target.files[0] || null

  filePreview.value =
    selectedFile.value && isPhoto.value ? URL.createObjectURL(selectedFile.value) : ''

  message.value = ''
  error.value = ''
  progress.value = 0
  uploadStatus.value = ''
}

onBeforeUnmount(() => {
  if (filePreview.value) {
    URL.revokeObjectURL(filePreview.value)
  }
})

// --------------------------------------------------
// VIDEO EVENT HANDLER
// --------------------------------------------------

function waitForVideoEvent(video, eventName, readyCheck) {
  if (readyCheck && readyCheck()) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Video ${eventName} timed out.`))
    }, 20000)

    function cleanup() {
      clearTimeout(timeout)
      video.removeEventListener(eventName, handleSuccess)
      video.removeEventListener('error', handleError)
    }

    function handleSuccess() {
      cleanup()
      resolve()
    }

    function handleError() {
      cleanup()
      reject(
        new Error('The browser cannot decode this video. Try an MP4 video encoded with H.264.'),
      )
    }

    video.addEventListener(eventName, handleSuccess)
    video.addEventListener('error', handleError)

    // Check again in case the event already happened.
    if (readyCheck && readyCheck()) {
      cleanup()
      resolve()
    }
  })
}

// --------------------------------------------------
// GENERATE VIDEO THUMBNAIL
// --------------------------------------------------

async function generateVideoThumbnail(file) {
  const objectUrl = URL.createObjectURL(file)
  const video = document.createElement('video')

  video.preload = 'auto'
  video.muted = true
  video.playsInline = true

  try {
    // Load the selected video.
    video.src = objectUrl
    video.load()

    // Step 1: Wait for video metadata.
    await waitForVideoEvent(video, 'loadedmetadata', () => video.readyState >= 1)

    // Step 2: Check video dimensions.
    if (
      !Number.isFinite(video.videoWidth) ||
      !Number.isFinite(video.videoHeight) ||
      video.videoWidth <= 0 ||
      video.videoHeight <= 0
    ) {
      throw new Error(
        'Could not read video dimensions. Please try an MP4 video encoded with H.264.',
      )
    }

    // Step 3: Wait until the browser has decoded a frame.
    await waitForVideoEvent(video, 'loadeddata', () => video.readyState >= 2)

    // Step 4: Select a frame to capture.
    const duration = video.duration

    let captureTime = 0

    if (Number.isFinite(duration) && duration > 0.2) {
      captureTime = Math.min(1, duration / 2)
    }

    // Step 5: Seek to the selected frame.
    if (captureTime > 0) {
      const seekPromise = waitForVideoEvent(
        video,
        'seeked',
        () => !video.seeking && Math.abs(video.currentTime - captureTime) < 0.1,
      )

      video.currentTime = captureTime

      await seekPromise
    }

    // Make sure the frame is available before drawing.
    if (video.readyState < 2) {
      await waitForVideoEvent(video, 'loadeddata', () => video.readyState >= 2)
    }

    // Step 6: Create the thumbnail canvas.
    const canvas = document.createElement('canvas')

    const maxWidth = 640
    const scale = Math.min(1, maxWidth / video.videoWidth)

    canvas.width = Math.max(1, Math.round(video.videoWidth * scale))

    canvas.height = Math.max(1, Math.round(video.videoHeight * scale))

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Could not create thumbnail canvas.')
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Step 7: Convert canvas to JPEG.
    const thumbnailBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Could not convert the video frame to JPEG.'))
          }
        },
        'image/jpeg',
        0.8,
      )
    })

    return thumbnailBlob
  } finally {
    video.pause()
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(objectUrl)
  }
}

// --------------------------------------------------
// UPLOAD THUMBNAIL
// --------------------------------------------------

function sendThumbnail(videoId, thumbnailBlob) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open('POST', `/api/media/${encodeURIComponent(videoId)}/thumbnail`, true)

    xhr.timeout = 60000
    xhr.responseType = 'json'

    xhr.setRequestHeader('Content-Type', 'image/jpeg')
    xhr.setRequestHeader('X-Upload-Password', password.value)
    xhr.setRequestHeader('X-File-Size', String(thumbnailBlob.size))

    xhr.onload = () => {
      const result = xhr.response

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(result)
      } else {
        reject(
          new Error(
            result?.details ||
              result?.error ||
              `Thumbnail upload failed. HTTP status: ${xhr.status}`,
          ),
        )
      }
    }

    xhr.onerror = () => {
      reject(new Error('Could not connect to the thumbnail upload endpoint.'))
    }

    xhr.ontimeout = () => {
      reject(new Error('Thumbnail upload timed out.'))
    }

    xhr.send(thumbnailBlob)
  })
}

// --------------------------------------------------
// UPLOAD ORIGINAL MEDIA
// --------------------------------------------------

function sendUpload(file) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open('POST', '/api/upload', true)

    xhr.timeout = 120000
    xhr.responseType = 'json'

    xhr.setRequestHeader('Content-Type', file.type)
    xhr.setRequestHeader('X-Upload-Password', password.value)
    xhr.setRequestHeader('X-File-Size', String(file.size))

    xhr.setRequestHeader('X-Title', encodeURIComponent(title.value.trim()))

    xhr.setRequestHeader('X-Description', encodeURIComponent(description.value.trim()))

    xhr.setRequestHeader('X-Category', encodeURIComponent(category.value))

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        progress.value = Math.round((event.loaded / event.total) * 100)
      }
    }

    xhr.onload = () => {
      const result = xhr.response

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(result)
      } else {
        reject(
          new Error(
            result?.details || result?.error || `Upload failed. HTTP status: ${xhr.status}`,
          ),
        )
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error while uploading. The server could not be reached.'))
    }

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out. Please try again.'))
    }

    xhr.onabort = () => {
      reject(new Error('Upload was cancelled.'))
    }

    xhr.send(file)
  })
}

// --------------------------------------------------
// MAIN UPLOAD FUNCTION
// --------------------------------------------------

async function uploadMedia() {
  message.value = ''
  error.value = ''
  progress.value = 0
  uploadStatus.value = ''

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
    // Step 1: Upload original media.
    uploadStatus.value = 'Uploading media...'

    const result = await sendUpload(file)

    let thumbnailWarning = ''

    // Step 2: Generate and upload video thumbnail.
    if (!isPhoto.value) {
      try {
        if (!result?.id) {
          throw new Error('The server did not return a media ID.')
        }

        uploadStatus.value = 'Preparing video thumbnail...'

        const thumbnailBlob = await generateVideoThumbnail(file)

        uploadStatus.value = 'Saving video thumbnail...'

        await sendThumbnail(result.id, thumbnailBlob)
      } catch (thumbnailError) {
        console.error('Thumbnail generation failed:', thumbnailError)

        thumbnailWarning =
          ' The video was uploaded, but its thumbnail could not be generated: ' +
          thumbnailError.message
      }
    }

    progress.value = 100

    message.value = `Media uploaded successfully!${thumbnailWarning}`

    emit('uploaded', result)

    // Reset form fields except password.
    title.value = ''
    description.value = ''
    category.value = 'Event'

    if (filePreview.value) {
      URL.revokeObjectURL(filePreview.value)
      filePreview.value = ''
    }

    selectedFile.value = null
  } catch (err) {
    error.value = err.message || 'Something went wrong.'
  } finally {
    uploading.value = false
    uploadStatus.value = ''
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
              class="max-h-64 w-full bg-[#EFEDF7] object-contain"
            />

            <p class="mt-2 text-xs text-gray-500">
              File: {{ selectedFile.name }}
              <br />
              Size: {{ (selectedFile.size / (1024 * 1024)).toFixed(2) }} MB
              <br />
              Format: {{ selectedFile.type || 'Unknown' }}
            </p>

            <p v-if="!isPhoto" class="mt-2 text-xs text-[#77758A]">
              A thumbnail will automatically be captured from this video.
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

        <!-- Upload Progress -->
        <div v-if="uploading">
          <div class="mb-2 flex justify-between text-xs text-gray-500">
            <span>{{ uploadStatus || 'Uploading...' }}</span>
            <span>{{ progress }}%</span>
          </div>

          <div class="h-2 w-full overflow-hidden bg-[#DCD9E8]">
            <div
              class="h-full bg-[#393970] transition-all duration-200"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
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
