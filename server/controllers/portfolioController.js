import {
  createPortfolioImage as insertPortfolioImage,
  deletePortfolioImage as deletePortfolioImageRecord,
  findPortfolioImages,
  updatePortfolioImage as updatePortfolioImageRecord,
} from '../services/portfolioService.js'

export async function getPortfolioImages(_request, response) {
  const images = await findPortfolioImages()
  return response.json({ images })
}

export async function createPortfolioImage(request, response) {
  const { imageUrl, altText = '' } = request.body ?? {}
  let parsedUrl

  try {
    parsedUrl = new URL(imageUrl)
  } catch {
    return response.status(400).json({ error: 'Provide a valid image URL.' })
  }

  if (
    typeof imageUrl !== 'string' ||
    imageUrl.length > 2048 ||
    !['http:', 'https:'].includes(parsedUrl.protocol) ||
    typeof altText !== 'string' ||
    altText.trim().length > 200
  ) {
    return response.status(400).json({
      error: 'Provide an HTTP or HTTPS image URL and alt text up to 200 characters.',
    })
  }

  const image = await insertPortfolioImage({
    imageUrl: parsedUrl.href,
    altText: altText.trim(),
  })

  return response.status(201).json({ image })
}

function parseImageInput(body) {
  const { imageUrl, altText = '' } = body ?? {}
  if (typeof imageUrl !== 'string' || imageUrl.length > 2048) {
    return { error: 'Provide a valid image URL.' }
  }

  let parsedUrl
  try {
    parsedUrl = new URL(imageUrl)
  } catch {
    return { error: 'Provide a valid image URL.' }
  }

  if (
    !['http:', 'https:'].includes(parsedUrl.protocol) ||
    typeof altText !== 'string' ||
    altText.trim().length > 200
  ) {
    return {
      error: 'Provide an HTTP or HTTPS image URL and alt text up to 200 characters.',
    }
  }

  return { value: { imageUrl: parsedUrl.href, altText: altText.trim() } }
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

  const validated = parseImageInput(request.body)
  if (validated.error) return response.status(400).json({ error: validated.error })

  const image = await updatePortfolioImageRecord(imageId, validated.value)
  if (!image) return response.status(404).json({ error: 'Portfolio image not found.' })
  return response.json({ image })
}

export async function deletePortfolioImage(request, response) {
  const imageId = parseImageId(request.params.imageId)
  if (!imageId) {
    return response.status(400).json({ error: 'Image ID must be a positive integer.' })
  }

  const deleted = await deletePortfolioImageRecord(imageId)
  if (!deleted) return response.status(404).json({ error: 'Portfolio image not found.' })
  return response.status(204).end()
}
