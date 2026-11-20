
const MAX_FILE_SIZE = 90 * 1024 * 1024

const CATEGORIES = {
  Event: 'event',
  Ministry: 'ministry',
  'Shared meals': 'shared-meals',
  Manila: 'manila'
}

const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov'
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  })
}

function decodeHeader(value = '') {
  try {
    return decodeURIComponent(value).trim()
  } catch {
    return null
  }
}

async function verifyPassword(input, expected) {
  if (!input || !expected) return false

  const encoder = new TextEncoder()

  const [inputHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(input)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected))
  ])

  const a = new Uint8Array(inputHash)
  const b = new Uint8Array(expectedHash)

  let difference = 0

  for (let i = 0; i < a.length; i++) {
    difference |= a[i] ^ b[i]
  }

  return difference === 0
}

async function getMedia(request, env) {
  const url = new URL(request.url)

  const type = url.searchParams.get('type')
  const category = url.searchParams.get('category')

  if (type && !['photo', 'video'].includes(type)) {
    return json({ error: 'Invalid media type.' }, 400)
  }

  if (category && !Object.hasOwn(CATEGORIES, category)) {
    return json({ error: 'Invalid category.' }, 400)
  }

  let sql = `
    SELECT
      id,
      title,
      description,
      category,
      media_type,
      r2_key,
      content_type,
      size_bytes,
      created_at
    FROM media
    WHERE 1 = 1
  `

  const params = []

  if (type) {
    sql += ' AND media_type = ?'
    params.push(type)
  }

  if (category) {
    sql += ' AND category = ?'
    params.push(category)
  }

  sql += ' ORDER BY created_at DESC LIMIT 200'

  const result = await env.eternalhappiness_db
    .prepare(sql)
    .bind(...params)
    .all()

  const items = (result.results || []).map(item => ({
    ...item,
    media_url: `/media/${item.r2_key
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`
  }))

  return json({ items })
}

async function uploadMedia(request, env) {
  const password = request.headers.get('X-Upload-Password')

  const validPassword = await verifyPassword(
    password,
    env.UPLOAD_PASSWORD
  )

  if (!validPassword) {
    return json({ error: 'Incorrect upload password.' }, 401)
  }

  const contentType = request.headers.get('Content-Type') || ''
  const extension = ALLOWED_TYPES[contentType]

  if (!extension) {
    return json({ error: 'Unsupported file type.' }, 400)
  }

  const category = decodeHeader(
    request.headers.get('X-Category') || ''
  )

  if (!category || !Object.hasOwn(CATEGORIES, category)) {
    return json({ error: 'Invalid category.' }, 400)
  }

  const title = decodeHeader(
    request.headers.get('X-Title') || ''
  )

  const description = decodeHeader(
    request.headers.get('X-Description') || ''
  )

  if (title === null || !title || title.length > 150) {
    return json({
      error: 'Title is required (maximum 150 characters).'
    }, 400)
  }

  if (description === null || description.length > 1000) {
    return json({ error: 'Description is too long or invalid.' }, 400)
  }

  // Validate the file size supplied by the frontend.
  const size = Number(request.headers.get('X-File-Size'))

  if (!Number.isSafeInteger(size) || size <= 0) {
    return json({ error: 'Invalid file size.' }, 400)
  }

  if (size > MAX_FILE_SIZE) {
    return json({
      error: 'File exceeds the 90 MB upload limit.'
    }, 413)
  }

  if (!request.body) {
    return json({ error: 'No file was provided.' }, 400)
  }

  const mediaType = contentType.startsWith('image/')
    ? 'photo'
    : 'video'

  const id = crypto.randomUUID()

  const folder = mediaType === 'photo' ? 'photos' : 'videos'
  const categoryFolder = CATEGORIES[category]

  const key = `${folder}/${categoryFolder}/${id}.${extension}`

  try {
    // Upload the original file to R2.
    await env.MEDIA_BUCKET.put(key, request.body, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable'
      },
      customMetadata: {
        title,
        category,
        mediaType
      }
    })

    try {
      // Register the uploaded file in D1.
      await env.eternalhappiness_db
        .prepare(`
          INSERT INTO media (
            id,
            title,
            description,
            category,
            media_type,
            r2_key,
            content_type,
            size_bytes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          title,
          description,
          category,
          mediaType,
          key,
          contentType,
          size
        )
        .run()
    } catch (databaseError) {
      // Remove the R2 file if its database record fails.
      await env.MEDIA_BUCKET.delete(key)
      throw databaseError
    }

    return json({
      success: true,
      message: 'Media uploaded successfully.',
      id,
      media_url: `/media/${key}`
    }, 201)

  } catch (error) {
    console.error('Upload error:', error)

    return json({
      error: 'Upload failed. Please try again.'
    }, 500)
  }
}

async function serveMedia(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 })
  }

  let key

  try {
    key = new URL(request.url).pathname
      .slice('/media/'.length)
      .split('/')
      .map(decodeURIComponent)
      .join('/')
  } catch {
    return new Response('Invalid media path', { status: 400 })
  }

  if (!key || key.includes('..')) {
    return new Response('Invalid media path', { status: 400 })
  }

  const object = await env.MEDIA_BUCKET.get(key)

  if (!object) {
    return new Response('Media not found', { status: 404 })
  }

  const headers = new Headers()

  object.writeHttpMetadata(headers)

  headers.set('ETag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('X-Content-Type-Options', 'nosniff')

  return new Response(
    request.method === 'HEAD' ? null : object.body,
    { headers }
  )
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    try {
      if (url.pathname === '/api/media' && request.method === 'GET') {
        return await getMedia(request, env)
      }

      if (url.pathname === '/api/upload' && request.method === 'POST') {
        return await uploadMedia(request, env)
      }

      if (url.pathname.startsWith('/api/')) {
        return json({ error: 'API endpoint not found.' }, 404)
      }

      if (url.pathname.startsWith('/media/')) {
        return await serveMedia(request, env)
      }

      return env.ASSETS.fetch(request)

    } catch (error) {
      console.error('Worker error:', error)
      return json({ error: 'Internal server error.' }, 500)
    }
  }
}
