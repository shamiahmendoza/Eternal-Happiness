const R2_BASE_URL = import.meta.env.VITE_R2_BASE_URL

export function getMediaUrl(key) {
  if (!key || !R2_BASE_URL) return ''

  const cleanKey = key
    .split('/')
    .map(encodeURIComponent)
    .join('/')

  return `${R2_BASE_URL.replace(/\/$/, '')}/${cleanKey}`
}

export const heroImage = getMediaUrl('Event/cat.jfif')
