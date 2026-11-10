import { randomUUID } from 'node:crypto'
import process from 'node:process'

const imageExtensions = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
])

function getStorageConfig() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET

  if (!supabaseUrl || !serviceRoleKey || !bucketName) {
    const error = new Error(
      'Supabase Storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET.',
    )
    error.status = 503
    throw error
  }

  let baseUrl
  try {
    baseUrl = new URL(supabaseUrl)
  } catch {
    const error = new Error('SUPABASE_URL must be a valid URL.')
    error.status = 503
    throw error
  }
  if (!['https:', 'http:'].includes(baseUrl.protocol)) {
    const error = new Error('SUPABASE_URL must use HTTP or HTTPS.')
    error.status = 503
    throw error
  }

  return { baseUrl, serviceRoleKey, bucketName }
}

function objectUrl(baseUrl, bucketName, objectPath) {
  const encodedBucket = encodeURIComponent(bucketName)
  const encodedPath = objectPath
    .split('/')
    .map(encodeURIComponent)
    .join('/')
  return new URL(
    `/storage/v1/object/${encodedBucket}/${encodedPath}`,
    baseUrl,
  )
}

async function storageRequest(url, serviceRoleKey, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const details = await response.text()
    if (
      response.status === 400 &&
      details.includes('"code":"AccessDenied"') &&
      details.includes('signature verification failed')
    ) {
      const error = new Error(
        'Supabase rejected the Storage credentials. Verify that SUPABASE_SERVICE_ROLE_KEY is the service-role key for the project in SUPABASE_URL, then restart the API.',
      )
      error.status = 503
      throw error
    }

    throw new Error(
      `Supabase Storage request failed (${response.status}): ${details || response.statusText}`,
    )
  }

  return response
}

export async function uploadPortfolioImage(file) {
  const { baseUrl, serviceRoleKey, bucketName } = getStorageConfig()
  const extension = imageExtensions.get(file.mimetype)
  if (!extension) {
    const error = new Error('Use a JPEG, PNG, WebP, or GIF image.')
    error.status = 400
    throw error
  }

  const objectPath = `portfolio/${randomUUID()}.${extension}`
  await storageRequest(
    objectUrl(baseUrl, bucketName, objectPath),
    serviceRoleKey,
    {
      method: 'POST',
      headers: {
        'Content-Type': file.mimetype,
        'x-upsert': 'false',
      },
      body: file.buffer,
    },
  )

  return {
    objectPath,
    imageUrl: new URL(
      `/storage/v1/object/public/${encodeURIComponent(bucketName)}/${objectPath
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`,
      baseUrl,
    ).href,
  }
}

export async function deletePortfolioStorageObject(objectPath) {
  const { baseUrl, serviceRoleKey, bucketName } = getStorageConfig()
  const url = new URL(
    `/storage/v1/object/${encodeURIComponent(bucketName)}`,
    baseUrl,
  )
  await storageRequest(url, serviceRoleKey, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [objectPath] }),
  })
}
