import { Buffer } from 'node:buffer'
import {
  createPortfolioImage as insertPortfolioImage,
  deletePortfolioImage as deletePortfolioImageRecord,
  findPortfolioImages,
  portfolioServiceExists,
  updatePortfolioImage as updatePortfolioImageRecord,
} from '../services/portfolioService.js'
import {
  deletePortfolioStorageObject,
  uploadPortfolioImage as uploadStorageImage,
} from '../services/supabaseStorageService.js'

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function matchesImageSignature(buffer, mimetype) {
  if (mimetype === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }
  if (mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  }
  if (mimetype === 'image/gif') {
    return ['GIF87a', 'GIF89a'].some((signature) =>
      buffer.subarray(0, 6).equals(Buffer.from(signature)),
    )
  }
  if (mimetype === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    )
  }
  return false
}

export async function getPortfolioImages(_request, response) {
  const images = await findPortfolioImages()
  return response.json({ images })
}

function validateUpload(request, response) {
  const altText = request.query.altText ?? ''
  const title = request.query.title
  const description = request.query.description ?? ''
  const serviceId = Number(request.query.serviceId)
  const mimetype = request.get('content-type')?.split(';')[0]

  if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
    response.status(400).json({ error: 'Select an image to upload.' })
    return null
  }
  if (!imageTypes.has(mimetype)) {
    response.status(400).json({ error: 'Use a JPEG, PNG, WebP, or GIF image.' })
    return null
  }
  if (!matchesImageSignature(request.body, mimetype)) {
    response.status(400).json({ error: 'The uploaded file does not match its image type.' })
    return null
  }
  if (typeof altText !== 'string' || altText.trim().length > 200) {
    response.status(400).json({ error: 'Alt text must be 200 characters or fewer.' })
    return null
  }
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 100) {
    response.status(400).json({ error: 'Title must be between 1 and 100 characters.' })
    return null
  }
  if (typeof description !== 'string' || description.length > 5000) {
    response.status(400).json({ error: 'Description must be 5,000 characters or fewer.' })
    return null
  }
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    response.status(400).json({ error: 'Select a service for this image.' })
    return null
  }

  return {
    file: { buffer: request.body, mimetype },
    altText: altText.trim(),
    title: title.trim(),
    description: description.trim(),
    serviceId,
  }
}

async function validateService(input, response) {
  if (!(await portfolioServiceExists(input.serviceId))) {
    response.status(400).json({ error: 'Select an existing service for this image.' })
    return false
  }
  return true
}

async function removeUploadedObjectOrThrow(objectPath, originalError) {
  try {
    await deletePortfolioStorageObject(objectPath)
  } catch (cleanupError) {
    throw new AggregateError(
      [originalError, cleanupError],
      'The portfolio image operation failed and its uploaded file could not be cleaned up.',
      { cause: cleanupError },
    )
  }
}

export async function createPortfolioImage(request, response) {
  const input = validateUpload(request, response)
  if (!input) return
  if (!(await validateService(input, response))) return

  const uploaded = await uploadStorageImage(input.file)
  try {
    const image = await insertPortfolioImage({
      imageUrl: uploaded.imageUrl,
      storagePath: uploaded.objectPath,
      altText: input.altText,
      title: input.title,
      description: input.description,
      serviceId: input.serviceId,
    })
    return response.status(201).json({ image })
  } catch (error) {
    await removeUploadedObjectOrThrow(uploaded.objectPath, error)
    throw error
  }
}

function parseImageId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function updatePortfolioImage(request, response) {
  const imageId = parseImageId(request.params.imageId)
  if (!imageId) {
    return response.status(400).json({ error: 'Image ID must be a positive integer.' })
  }

  const input = validateUpload(request, response)
  if (!input) return
  if (!(await validateService(input, response))) return

  const uploaded = await uploadStorageImage(input.file)
  let image
  try {
    image = await updatePortfolioImageRecord(imageId, {
      imageUrl: uploaded.imageUrl,
      storagePath: uploaded.objectPath,
      altText: input.altText,
      title: input.title,
      description: input.description,
      serviceId: input.serviceId,
    })
  } catch (error) {
    await removeUploadedObjectOrThrow(uploaded.objectPath, error)
    throw error
  }

  if (!image) {
    await deletePortfolioStorageObject(uploaded.objectPath)
    return response.status(404).json({ error: 'Portfolio image not found.' })
  }

  if (image.previousStoragePath) {
    await deletePortfolioStorageObject(image.previousStoragePath)
  }
  delete image.previousStoragePath
  return response.json({ image })
}

export async function deletePortfolioImage(request, response) {
  const imageId = parseImageId(request.params.imageId)
  if (!imageId) {
    return response.status(400).json({ error: 'Image ID must be a positive integer.' })
  }

  const deleted = await deletePortfolioImageRecord(imageId)
  if (!deleted) return response.status(404).json({ error: 'Portfolio image not found.' })

  if (deleted.storagePath) {
    await deletePortfolioStorageObject(deleted.storagePath)
  }
  return response.status(204).end()
}
