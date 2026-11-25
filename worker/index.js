
const MAX_FILE_SIZE = 90 * 1024 * 1024
const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024

const CATEGORIES = {
  Event: 'event',
  Ministry: 'ministry',
  'Shared meals': 'shared-meals',
  Manila: 'manila',
}

const DEFAULT_PHOTO_SETTING_KEYS = Object.fromEntries(
  Object.entries(CATEGORIES).map(([category, value]) => [
    category,
    `default_photo_${value}`,
  ]),
)

const ALLOWED_TYPES = {
  photo: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ],
}

const encoder = new TextEncoder()

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

function decodeHeader(value) {
  if (!value) return ''

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getMediaUrl(key) {
  return `/media/${key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`
}

function validId(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  )
}

async function verifyPassword(provided, expected) {
  if (!provided || !expected) return false

  const providedHash = new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(provided),
    ),
  )

  const expectedHash = new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(expected),
    ),
  )

  if (providedHash.length !== expectedHash.length) {
    return false
  }

  let difference = 0

  for (let i = 0; i < providedHash.length; i++) {
    difference |= providedHash[i] ^ expectedHash[i]
  }

  return difference === 0
}

async function requireUploadPassword(request, env) {
  const password = request.headers.get('X-Upload-Password')

  return verifyPassword(password, env.UPLOAD_PASSWORD)
}

async function requireAdminPassword(request, env) {
  const password = request.headers.get('X-Admin-Password')

  return verifyPassword(password, env.ADMIN_PASSWORD)
}

// --------------------------------------------------
// GET MEDIA
// --------------------------------------------------

async function getMedia(request, env) {
  const url = new URL(request.url)
  const type = url.searchParams.get('type')

  if (!['photo', 'video'].includes(type)) {
    return json({
      error: 'Invalid media type.',
    }, 400)
  }

  try {
    const result = await env.eternalhappiness_db
      .prepare(`
        SELECT
          id,
          title,
          description,
          category,
          media_type,
          r2_key,
          thumbnail_key,
          content_type,
          size_bytes,
          created_at
        FROM media
        WHERE media_type = ?
        ORDER BY created_at DESC
      `)
      .bind(type)
      .all()

    const items = (result.results || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      media_type: item.media_type,
      media_url: getMediaUrl(item.r2_key),
      thumbnail_url: item.thumbnail_key
        ? getMediaUrl(item.thumbnail_key)
        : null,
      content_type: item.content_type,
      size_bytes: item.size_bytes,
      created_at: item.created_at,
    }))

    return json({ items })
  } catch (error) {
    console.error('Get media error:', error)

    return json({
      error: 'Could not retrieve media.',
    }, 500)
  }
}

// --------------------------------------------------
// UPLOAD PHOTO OR VIDEO
// --------------------------------------------------

async function uploadMedia(request, env) {
  const authorized = await requireUploadPassword(request, env)

  if (!authorized) {
    return json({
      error: 'Invalid upload password.',
    }, 401)
  }

  const contentType = request.headers.get('Content-Type') || ''
  const fileSize = Number(request.headers.get('X-File-Size') || 0)

  if (!fileSize || fileSize > MAX_FILE_SIZE) {
    return json({
      error: 'Invalid file size. Maximum allowed size is 90 MB.',
    }, 400)
  }

  const mediaType = contentType.startsWith('image/')
    ? 'photo'
    : contentType.startsWith('video/')
      ? 'video'
      : null

  if (!mediaType || !ALLOWED_TYPES[mediaType].includes(contentType)) {
    return json({
      error: 'Unsupported file format.',
    }, 400)
  }

  const title = decodeHeader(
    request.headers.get('X-Title'),
  ).trim()

  const description = decodeHeader(
    request.headers.get('X-Description'),
  ).trim()

  const category = decodeHeader(
    request.headers.get('X-Category'),
  ).trim()

  if (title.length > 150) {
    return json({
      error: 'Title must not exceed 150 characters.',
    }, 400)
  }

  if (description.length > 1000) {
    return json({
      error: 'Description is too long.',
    }, 400)
  }

  if (!Object.hasOwn(CATEGORIES, category)) {
    return json({
      error: 'Invalid category.',
    }, 400)
  }

  let fileBuffer

  try {
    fileBuffer = await request.arrayBuffer()
  } catch (error) {
    console.error('File reading error:', error)

    return json({
      error: 'Could not read uploaded file.',
    }, 400)
  }

  if (!fileBuffer.byteLength || fileBuffer.byteLength > MAX_FILE_SIZE) {
    return json({
      error: 'Invalid uploaded file size.',
    }, 400)
  }

  const id = crypto.randomUUID()

  const extensionMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  }

  const extension = extensionMap[contentType]

  const folder = mediaType === 'photo'
    ? 'photos'
    : 'videos'

  const categoryFolder = CATEGORIES[category]

  const r2Key = `${folder}/${categoryFolder}/${id}.${extension}`

  try {
    // Save original media to R2.
    await env.MEDIA_BUCKET.put(r2Key, fileBuffer, {
      httpMetadata: {
        contentType,
      },
      customMetadata: {
        id,
        title,
        category,
        mediaType,
      },
    })

    // Save media information to D1.
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
        r2Key,
        contentType,
        fileBuffer.byteLength,
      )
      .run()

    return json({
      success: true,
      id,
      title,
      media_type: mediaType,
      media_url: getMediaUrl(r2Key),
    }, 201)
  } catch (error) {
    console.error('Media upload error:', error)

    // Remove uploaded R2 file if the database insert fails.
    try {
      await env.MEDIA_BUCKET.delete(r2Key)
    } catch (deleteError) {
      console.error('R2 cleanup error:', deleteError)
    }

    return json({
      error: 'Could not save uploaded media.',
      details: error.message,
    }, 500)
  }
}

// --------------------------------------------------
// UPLOAD MEDIA THUMBNAIL
// --------------------------------------------------

async function uploadThumbnail(request, env, id) {
  const uploadAuthorized = await requireUploadPassword(request, env)
  const adminAuthorized = uploadAuthorized
    ? false
    : await requireAdminPassword(request, env)

  if (!uploadAuthorized && !adminAuthorized) {
    return json({
      error: 'Invalid upload or admin password.',
    }, 401)
  }

  if (!validId(id)) {
    return json({
      error: 'Invalid media ID.',
    }, 400)
  }

  const contentType = request.headers.get('Content-Type') || ''
  const fileSize = Number(request.headers.get('X-File-Size') || 0)

  if (contentType !== 'image/jpeg') {
    return json({
      error: 'Thumbnail must be a JPEG image.',
    }, 400)
  }

  if (!fileSize || fileSize > MAX_THUMBNAIL_SIZE) {
    return json({
      error: 'Thumbnail must not exceed 2 MB.',
    }, 400)
  }

  try {
    const media = await env.eternalhappiness_db
      .prepare(`
        SELECT id, media_type
        FROM media
        WHERE id = ?
      `)
      .bind(id)
      .first()

    if (!media) {
      return json({
        error: 'Media not found.',
      }, 404)
    }

    const thumbnailBuffer = await request.arrayBuffer()

    if (
      !thumbnailBuffer.byteLength ||
      thumbnailBuffer.byteLength > MAX_THUMBNAIL_SIZE
    ) {
      return json({
        error: 'Invalid thumbnail size.',
      }, 400)
    }

    const thumbnailKey = `thumbnails/${id}.jpg`

    await env.MEDIA_BUCKET.put(thumbnailKey, thumbnailBuffer, {
      httpMetadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable',
      },
    })

    await env.eternalhappiness_db
      .prepare(`
        UPDATE media
        SET thumbnail_key = ?
        WHERE id = ?
      `)
      .bind(thumbnailKey, id)
      .run()

    return json({
      success: true,
      id,
      thumbnail_url: getMediaUrl(thumbnailKey),
    })
  } catch (error) {
    console.error('Thumbnail upload error:', error)

    return json({
      error: 'Could not save media thumbnail.',
      details: error.message,
    }, 500)
  }
}

// --------------------------------------------------
// GET FEATURED VIDEO
// --------------------------------------------------

async function getFeaturedVideo(env) {
  try {
    const setting = await env.eternalhappiness_db
      .prepare(`
        SELECT setting_value
        FROM site_settings
        WHERE setting_key = 'featured_video_id'
      `)
      .first()

    if (!setting) {
      return json({
        video: null,
      })
    }

    const video = await env.eternalhappiness_db
      .prepare(`
        SELECT
          id,
          title,
          description,
          category,
          media_type,
          r2_key,
          thumbnail_key,
          content_type,
          size_bytes,
          created_at
        FROM media
        WHERE id = ?
        AND media_type = 'video'
      `)
      .bind(setting.setting_value)
      .first()

    if (!video) {
      return json({
        video: null,
      })
    }

    return json({
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        category: video.category,
        media_type: video.media_type,
        media_url: getMediaUrl(video.r2_key),
        thumbnail_url: video.thumbnail_key
          ? getMediaUrl(video.thumbnail_key)
          : null,
        content_type: video.content_type,
        size_bytes: video.size_bytes,
        created_at: video.created_at,
      },
    })
  } catch (error) {
    console.error('Get featured video error:', error)

    return json({
      error: 'Could not retrieve featured video.',
    }, 500)
  }
}

// --------------------------------------------------
// SET FEATURED VIDEO
// --------------------------------------------------

async function setFeaturedVideo(request, env) {
  const authorized = await requireAdminPassword(request, env)

  if (!authorized) {
    return json({
      error: 'Invalid admin password.',
    }, 401)
  }

  let body

  try {
    body = await request.json()
  } catch {
    return json({
      error: 'Invalid JSON request.',
    }, 400)
  }

  const id = body?.id

  if (!validId(id)) {
    return json({
      error: 'A valid video ID is required.',
    }, 400)
  }

  try {
    const video = await env.eternalhappiness_db
      .prepare(`
        SELECT id
        FROM media
        WHERE id = ?
        AND media_type = 'video'
      `)
      .bind(id)
      .first()

    if (!video) {
      return json({
        error: 'Selected video was not found.',
      }, 404)
    }

    await env.eternalhappiness_db
      .prepare(`
        INSERT INTO site_settings (
          setting_key,
          setting_value,
          updated_at
        )
        VALUES (
          'featured_video_id',
          ?,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT(setting_key)
        DO UPDATE SET
          setting_value = excluded.setting_value,
          updated_at = CURRENT_TIMESTAMP
      `)
      .bind(id)
      .run()

    return json({
      success: true,
      featured_video_id: id,
    })
  } catch (error) {
    console.error('Set featured video error:', error)

    return json({
      error: 'Could not update featured video.',
      details: error.message,
    }, 500)
  }
}

// --------------------------------------------------
// GET DEFAULT PHOTOS
// --------------------------------------------------

async function getDefaultPhotos(env) {
  const categories = Object.keys(DEFAULT_PHOTO_SETTING_KEYS)
  const settingKeys = categories.map(
    (category) => DEFAULT_PHOTO_SETTING_KEYS[category],
  )

  try {
    const settingsResult = await env.eternalhappiness_db
      .prepare(`
        SELECT setting_key, setting_value
        FROM site_settings
        WHERE setting_key IN (${settingKeys.map(() => '?').join(', ')})
      `)
      .bind(...settingKeys)
      .all()

    const selectedIds = Object.fromEntries(
      (settingsResult.results || []).map((setting) => [
        setting.setting_key,
        setting.setting_value,
      ]),
    )
    const photoIds = categories.map(
      (category) => selectedIds[DEFAULT_PHOTO_SETTING_KEYS[category]] || null,
    )

    const photosResult = await env.eternalhappiness_db
      .prepare(`
        SELECT id, title, description, category, r2_key, thumbnail_key, created_at
        FROM media
        WHERE media_type = 'photo'
        AND id IN (${photoIds.map(() => '?').join(', ')})
      `)
      .bind(...photoIds)
      .all()

    const photosById = new Map(
      (photosResult.results || []).map((photo) => [photo.id, photo]),
    )
    const defaults = Object.fromEntries(
      categories.map((category) => {
        const selectedId = selectedIds[DEFAULT_PHOTO_SETTING_KEYS[category]]
        const photo = selectedId ? photosById.get(selectedId) : null

        if (!photo || photo.category !== category) {
          return [category, null]
        }

        return [
          category,
          {
            id: photo.id,
            title: photo.title,
            description: photo.description,
            category: photo.category,
            media_url: getMediaUrl(photo.r2_key),
            thumbnail_url: photo.thumbnail_key
              ? getMediaUrl(photo.thumbnail_key)
              : null,
            created_at: photo.created_at,
          },
        ]
      }),
    )

    return json({ defaults })
  } catch (error) {
    console.error('Get default photos error:', error)

    return json({
      error: 'Could not retrieve default photos.',
    }, 500)
  }
}

// --------------------------------------------------
// SET DEFAULT PHOTO
// --------------------------------------------------

async function setDefaultPhoto(request, env) {
  const authorized = await requireAdminPassword(request, env)

  if (!authorized) {
    return json({
      error: 'Invalid admin password.',
    }, 401)
  }

  let body

  try {
    body = await request.json()
  } catch {
    return json({
      error: 'Invalid JSON request.',
    }, 400)
  }

  const { category, id } = body || {}

  if (!Object.hasOwn(DEFAULT_PHOTO_SETTING_KEYS, category) || !validId(id)) {
    return json({
      error: 'A valid photo ID and category are required.',
    }, 400)
  }

  try {
    const photo = await env.eternalhappiness_db
      .prepare(`
        SELECT id
        FROM media
        WHERE id = ?
        AND media_type = 'photo'
        AND category = ?
      `)
      .bind(id, category)
      .first()

    if (!photo) {
      return json({
        error: 'Selected photo was not found in that category.',
      }, 404)
    }

    await env.eternalhappiness_db
      .prepare(`
        INSERT INTO site_settings (
          setting_key,
          setting_value,
          updated_at
        )
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(setting_key)
        DO UPDATE SET
          setting_value = excluded.setting_value,
          updated_at = CURRENT_TIMESTAMP
      `)
      .bind(DEFAULT_PHOTO_SETTING_KEYS[category], id)
      .run()

    return json({
      success: true,
      category,
      default_photo_id: id,
    })
  } catch (error) {
    console.error('Set default photo error:', error)

    return json({
      error: 'Could not update the default photo.',
      details: error.message,
    }, 500)
  }
}

// --------------------------------------------------
// UPDATE MEDIA DETAILS
// --------------------------------------------------

async function updateMediaDetails(request, env, id) {
  const authorized = await requireAdminPassword(request, env)

  if (!authorized) {
    return json({
      error: 'Invalid admin password.',
    }, 401)
  }

  if (!validId(id)) {
    return json({
      error: 'Invalid media ID.',
    }, 400)
  }

  let details

  try {
    details = await request.json()
  } catch {
    return json({
      error: 'Invalid JSON body.',
    }, 400)
  }

  if (
    !details ||
    typeof details.title !== 'string' ||
    typeof details.description !== 'string'
  ) {
    return json({
      error: 'Title and description must be strings.',
    }, 400)
  }

  const title = details.title.trim()
  const description = details.description.trim()

  if (title.length > 150) {
    return json({
      error: 'Title must not exceed 150 characters.',
    }, 400)
  }

  if (description.length > 1000) {
    return json({
      error: 'Description must not exceed 1000 characters.',
    }, 400)
  }

  try {
    const media = await env.eternalhappiness_db
      .prepare('SELECT id FROM media WHERE id = ?')
      .bind(id)
      .first()

    if (!media) {
      return json({
        error: 'Media not found.',
      }, 404)
    }

    await env.eternalhappiness_db
      .prepare(`
        UPDATE media
        SET title = ?, description = ?
        WHERE id = ?
      `)
      .bind(title, description, id)
      .run()

    return json({
      success: true,
      title,
      description,
    })
  } catch (error) {
    console.error('Update media details error:', error)

    return json({
      error: 'Could not update media details.',
      details: error.message,
    }, 500)
  }
}

// --------------------------------------------------
// DELETE MEDIA
// --------------------------------------------------

async function deleteMedia(request, env, id) {
  const authorized = await requireAdminPassword(request, env)

  if (!authorized) {
    return json({
      error: 'Invalid admin password.',
    }, 401)
  }

  if (!validId(id)) {
    return json({
      error: 'Invalid media ID.',
    }, 400)
  }

  const settingKeys = [
    'featured_video_id',
    ...Object.values(DEFAULT_PHOTO_SETTING_KEYS),
  ]

  try {
    const media = await env.eternalhappiness_db
      .prepare(`
        SELECT id, r2_key, thumbnail_key
        FROM media
        WHERE id = ?
      `)
      .bind(id)
      .first()

    if (!media) {
      return json({
        error: 'Media not found.',
      }, 404)
    }

    // Delete original file from R2.
    await env.MEDIA_BUCKET.delete(media.r2_key)

    // Delete thumbnail if one exists.
    if (media.thumbnail_key) {
      await env.MEDIA_BUCKET.delete(media.thumbnail_key)
    }

    // Clear featured/default selections if this media is selected.
    await env.eternalhappiness_db
      .prepare(`
        DELETE FROM site_settings
        WHERE setting_key IN (${settingKeys.map(() => '?').join(', ')})
        AND setting_value = ?
      `)
      .bind(...settingKeys, id)
      .run()

    // Delete D1 record.
    await env.eternalhappiness_db
      .prepare(`
        DELETE FROM media
        WHERE id = ?
      `)
      .bind(id)
      .run()

    return json({
      success: true,
      message: 'Media deleted successfully.',
    })
  } catch (error) {
    console.error('Delete media error:', error)

    return json({
      error: 'Could not delete media.',
      details: error.message,
    }, 500)
  }
}

// --------------------------------------------------
// SERVE MEDIA FROM R2
// Supports GET, HEAD, and video byte-range requests.
// --------------------------------------------------

async function serveMedia(request, env) {
  const url = new URL(request.url)

  let key

  try {
    key = url.pathname
      .replace(/^\/media\//, '')
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/')
  } catch {
    return new Response('Invalid media path.', {
      status: 400,
    })
  }

  if (!key || key.includes('..')) {
    return new Response('Invalid media path.', {
      status: 400,
    })
  }

  try {
    let object
    let status = 200

    const rangeHeader = request.headers.get('Range')

    if (rangeHeader) {
      const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/)

      if (!match) {
        return new Response('Invalid range request.', {
          status: 416,
        })
      }

      const start = match[1] ? Number(match[1]) : null
      const end = match[2] ? Number(match[2]) : null

      const fullObject = await env.MEDIA_BUCKET.head(key)

      if (!fullObject) {
        return new Response('Media not found.', {
          status: 404,
        })
      }

      const totalSize = fullObject.size

      let offset
      let length

      if (start === null) {
        if (!end || end <= 0) {
          return new Response('Invalid range.', {
            status: 416,
          })
        }

        length = Math.min(end, totalSize)
        offset = totalSize - length
      } else {
        offset = start
        const finalByte = end === null
          ? totalSize - 1
          : Math.min(end, totalSize - 1)

        if (
          offset >= totalSize ||
          finalByte < offset
        ) {
          return new Response('Range not satisfiable.', {
            status: 416,
            headers: {
              'Content-Range': `bytes */${totalSize}`,
            },
          })
        }

        length = finalByte - offset + 1
      }

      object = await env.MEDIA_BUCKET.get(key, {
        range: {
          offset,
          length,
        },
      })

      if (!object) {
        return new Response('Media not found.', {
          status: 404,
        })
      }

      status = 206

      const headers = new Headers()

      object.writeHttpMetadata(headers)

      headers.set('Accept-Ranges', 'bytes')
      headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${totalSize}`)
      headers.set('Content-Length', String(length))
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')

      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/octet-stream')
      }

      return new Response(
        request.method === 'HEAD' ? null : object.body,
        {
          status,
          headers,
        },
      )
    }

    object = await env.MEDIA_BUCKET.get(key)

    if (!object) {
      return new Response('Media not found.', {
        status: 404,
      })
    }

    const headers = new Headers()

    object.writeHttpMetadata(headers)

    headers.set('Accept-Ranges', 'bytes')
    headers.set('Content-Length', String(object.size))
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/octet-stream')
    }

    return new Response(
      request.method === 'HEAD' ? null : object.body,
      {
        status: 200,
        headers,
      },
    )
  } catch (error) {
    console.error('Serve media error:', error)

    return new Response('Could not retrieve media.', {
      status: 500,
    })
  }
}

// --------------------------------------------------
// MAIN WORKER ROUTER
// --------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    try {
      // GET media list.
      if (
        path === '/api/media' &&
        method === 'GET'
      ) {
        return await getMedia(request, env)
      }

      // Upload photo or video.
      if (
        path === '/api/upload' &&
        method === 'POST'
      ) {
        return await uploadMedia(request, env)
      }

      // Get currently selected featured video.
      if (
        path === '/api/featured' &&
        method === 'GET'
      ) {
        return await getFeaturedVideo(env)
      }

      // Set featured video.
      if (
        path === '/api/featured' &&
        method === 'POST'
      ) {
        return await setFeaturedVideo(request, env)
      }

      // Get selected default photos.
      if (
        path === '/api/default-photos' &&
        method === 'GET'
      ) {
        return await getDefaultPhotos(env)
      }

      // Set a selected default photo.
      if (
        path === '/api/default-photos' &&
        method === 'POST'
      ) {
        return await setDefaultPhoto(request, env)
      }

      // Upload a video thumbnail.
      const thumbnailMatch = path.match(
        /^\/api\/media\/([^/]+)\/thumbnail$/,
      )

      if (
        thumbnailMatch &&
        method === 'POST'
      ) {
        return await uploadThumbnail(
          request,
          env,
          thumbnailMatch[1],
        )
      }

      // Update or delete media.
      const mediaMatch = path.match(
        /^\/api\/media\/([^/]+)$/,
      )

      if (
        mediaMatch &&
        method === 'PATCH'
      ) {
        return await updateMediaDetails(
          request,
          env,
          mediaMatch[1],
        )
      }

      if (
        mediaMatch &&
        method === 'DELETE'
      ) {
        return await deleteMedia(
          request,
          env,
          mediaMatch[1],
        )
      }

      // Serve R2 media.
      if (
        path.startsWith('/media/') &&
        ['GET', 'HEAD'].includes(method)
      ) {
        return await serveMedia(request, env)
      }

      // Serve frontend assets.
      if (env.ASSETS) {
        return env.ASSETS.fetch(request)
      }

      return new Response('Not found.', {
        status: 404,
      })
    } catch (error) {
      console.error('Worker error:', error)

      return json({
        error: 'Internal server error.',
      }, 500)
    }
  },
}
