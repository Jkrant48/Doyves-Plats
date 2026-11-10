import { pool } from '../../config/database.js'

export async function portfolioServiceExists(serviceId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM public.services WHERE services_id = $1',
    [serviceId],
  )
  return rows.length > 0
}

export async function findPortfolioImages() {
  const { rows } = await pool.query(`
    SELECT portfolio_images.id,
    portfolio_images.image_url AS "imageUrl",
    portfolio_images.alt_text AS "altText",
    portfolio_images.storage_path AS "storagePath",
    portfolio_images.portfolio_title AS title,
    portfolio_images.portfolio_description AS description,
    portfolio_images.services_id AS "serviceId",
    services.service_name AS "serviceName",
    category.category_name AS "categoryName"
    FROM public.portfolio_images
    JOIN public.services AS services
    ON services.services_id = portfolio_images.services_id
    JOIN public.category AS category
    ON category.category_id = services.category_id
    ORDER BY portfolio_images.created_at DESC, portfolio_images.id DESC
  `)

  return rows
}

export async function createPortfolioImage({
  imageUrl,
  altText,
  storagePath,
  title,
  description,
  serviceId,
}) {
  const { rows } = await pool.query(
    `
      INSERT INTO public.portfolio_images (
        image_url, alt_text, storage_path, portfolio_title,
        portfolio_description, services_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, image_url AS "imageUrl", alt_text AS "altText",
        storage_path AS "storagePath", portfolio_title AS title,
        portfolio_description AS description, services_id AS "serviceId"
    `,
    [imageUrl, altText, storagePath, title, description, serviceId],
  )

  return rows[0]
}

export async function updatePortfolioImage(imageId, {
  imageUrl,
  altText,
  storagePath,
  title,
  description,
  serviceId,
}) {
  const { rows } = await pool.query(
    `
      WITH previous AS (
        SELECT storage_path FROM public.portfolio_images WHERE id = $1
      ),
      updated AS (
        UPDATE public.portfolio_images
        SET image_url = $2, alt_text = $3, storage_path = $4,
          portfolio_title = $5, portfolio_description = $6, services_id = $7
        WHERE id = $1
        RETURNING id, image_url AS "imageUrl", alt_text AS "altText",
          storage_path AS "storagePath", portfolio_title AS title,
          portfolio_description AS description, services_id AS "serviceId"
      )
      SELECT updated.*, previous.storage_path AS "previousStoragePath"
      FROM updated CROSS JOIN previous
    `,
    [imageId, imageUrl, altText, storagePath, title, description, serviceId],
  )

  return rows[0] ?? null
}

export async function deletePortfolioImage(imageId) {
  const { rows } = await pool.query(
    `DELETE FROM public.portfolio_images
     WHERE id = $1
     RETURNING id, storage_path AS "storagePath"`,
    [imageId],
  )
  return rows[0] ?? null
}
