import { pool } from '../../config/database.js'

export async function findPortfolioImages() {
  const { rows } = await pool.query(`
    SELECT id, image_url AS "imageUrl", alt_text AS "altText"
    FROM public.portfolio_images
    ORDER BY created_at DESC, id DESC
  `)

  return rows
}

export async function createPortfolioImage({ imageUrl, altText }) {
  const { rows } = await pool.query(
    `
      INSERT INTO public.portfolio_images (image_url, alt_text)
      VALUES ($1, $2)
      RETURNING id, image_url AS "imageUrl", alt_text AS "altText"
    `,
    [imageUrl, altText],
  )

  return rows[0]
}

export async function updatePortfolioImage(imageId, { imageUrl, altText }) {
  const { rows } = await pool.query(
    `
      UPDATE public.portfolio_images
      SET image_url = $2, alt_text = $3
      WHERE id = $1
      RETURNING id, image_url AS "imageUrl", alt_text AS "altText"
    `,
    [imageId, imageUrl, altText],
  )

  return rows[0] ?? null
}

export async function deletePortfolioImage(imageId) {
  const result = await pool.query(
    'DELETE FROM public.portfolio_images WHERE id = $1',
    [imageId],
  )
  return result.rowCount > 0
}
