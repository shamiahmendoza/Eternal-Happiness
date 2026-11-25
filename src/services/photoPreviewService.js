export async function generatePhotoPreview(file) {
  const image = await createImageBitmap(file)

  try {
    const maxDimension = 1280
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')

    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))

    const context = canvas.getContext('2d', { alpha: false })

    if (!context) {
      throw new Error('Could not create photo preview.')
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size <= 2 * 1024 * 1024) {
            resolve(blob)
          } else {
            reject(new Error('The photo preview could not be compressed below 2 MB.'))
          }
        },
        'image/jpeg',
        0.8,
      )
    })
  } finally {
    image.close()
  }
}
