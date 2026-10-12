import { pool } from '../../config/database.js'

const serviceColumns = `
  services.services_id AS id,
  services.category_id AS "categoryId",
  category.category_name AS "categoryName",
  services.service_name AS name,
  services.service_description AS description,
  services.service_price AS price,
  services.deposit_amount AS "depositAmount",
  services.duration_minutes AS "durationMinutes",
  services.is_active AS "isActive"
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

export async function findManagementServices() {
  const { rows } = await pool.query(`
    SELECT ${serviceColumns}
    FROM public.services AS services
    JOIN public.category AS category
      ON category.category_id = services.category_id
    ORDER BY category.category_id, services.services_id
  `)

  return rows
}

export async function createCategory(name) {
  const { rows } = await pool.query(
    `
      INSERT INTO public.category (category_name)
      VALUES ($1)
      RETURNING category_id AS id, category_name AS name
    `,
    [name],
  )

  return rows[0]
}

export async function updateCategory(categoryId, name) {
  const { rows } = await pool.query(
    `
      UPDATE public.category
      SET category_name = $2
      WHERE category_id = $1
      RETURNING category_id AS id, category_name AS name
    `,
    [categoryId, name],
  )

  return rows[0] ?? null
}

export async function deleteCategory(categoryId) {
  const result = await pool.query(
    'DELETE FROM public.category WHERE category_id = $1',
    [categoryId],
  )
  return result.rowCount > 0
}

export async function createService({
  categoryId,
  name,
  description,
  price,
  depositAmount,
  durationMinutes,
}) {
  const { rows } = await pool.query(
    `
      INSERT INTO public.services (
        category_id,
        service_name,
        service_description,
        service_price,
        deposit_amount,
        duration_minutes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING services_id AS id, service_name AS name
    `,
    [categoryId, name, description || null, price, depositAmount, durationMinutes],
  )

  return rows[0]
}

export async function updateService(serviceId, {
  categoryId,
  name,
  description,
  price,
  depositAmount,
  durationMinutes,
}) {
  const { rows } = await pool.query(
    `
      UPDATE public.services
      SET category_id = $2,
          service_name = $3,
          service_description = $4,
          service_price = $5,
          deposit_amount = $6,
          duration_minutes = $7
      WHERE services_id = $1
      RETURNING services_id AS id, service_name AS name
    `,
    [serviceId, categoryId, name, description || null, price, depositAmount, durationMinutes],
  )

  return rows[0] ?? null
}

export async function deactivateService(serviceId) {
  const { rows } = await pool.query(
    `
      UPDATE public.services
      SET is_active = FALSE
      WHERE services_id = $1 AND is_active = TRUE
      RETURNING services_id AS id
    `,
    [serviceId],
  )

  return rows[0] ?? null
}

export async function activateService(serviceId) {
  const { rows } = await pool.query(
    `
      UPDATE public.services
      SET is_active = TRUE
      WHERE services_id = $1 AND is_active = FALSE
      RETURNING services_id AS id
    `,
    [serviceId],
  )

  return rows[0] ?? null
}
