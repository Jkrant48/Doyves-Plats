import { pool } from '../../config/database.js'

const serviceColumns = `
  services.services_id AS id,
  services.category_id AS "categoryId",
  category.category_name AS "categoryName",
  services.service_name AS name,
  services.service_description AS description,
  services.service_price AS price,
  services.deposit_amount AS "depositAmount",
  services.duration_minutes AS "durationMinutes"
`

export async function findCategories() {
  const { rows } = await pool.query(`
    SELECT category_id AS id, category_name AS name
    FROM public.category
    ORDER BY category_id
  `)

  return rows
}

export async function findCategoryById(categoryId) {
  const { rows } = await pool.query(
    `
      SELECT category_id AS id, category_name AS name
      FROM public.category
      WHERE category_id = $1
    `,
    [categoryId],
  )

  return rows[0] ?? null
}

export async function findAllServices() {
  const { rows } = await pool.query(`
    SELECT ${serviceColumns}
    FROM public.services AS services
    JOIN public.category AS category
      ON category.category_id = services.category_id
    WHERE services.is_active = TRUE
    ORDER BY category.category_id, services.services_id
  `)

  return rows
}

export async function findServicesByCategory(categoryId) {
  const { rows } = await pool.query(
    `
      SELECT ${serviceColumns}
      FROM public.services AS services
      JOIN public.category AS category
        ON category.category_id = services.category_id
      WHERE services.category_id = $1 AND services.is_active = TRUE
      ORDER BY services.services_id
    `,
    [categoryId],
  )

  return rows
}
