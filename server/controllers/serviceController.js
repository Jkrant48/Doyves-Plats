import {
  findCategories,
  findAllServices,
  findCategoryById,
  findManagementServices,
  findServicesByCategory,
  createCategory as insertCategory,
  createService as insertService,
  updateCategory as updateCategoryRecord,
  deleteCategory as deleteCategoryRecord,
  updateService as updateServiceRecord,
  deactivateService as deactivateServiceRecord,
  activateService as activateServiceRecord,
} from '../services/serviceService.js'

export async function getCategories(_request, response) {
  const categories = await findCategories()
  response.json({ categories })
}

export async function getServices(request, response) {
  const services = await findAllServices()
  response.json({ services })
}

export async function getManagementServices(_request, response) {
  const services = await findManagementServices()
  return response.json({ services })
}

export async function getServicesByCategory(request, response) {
  const categoryId = Number(request.params.categoryId)

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return response.status(400).json({ error: 'Category ID must be a positive integer.' })
  }

  const category = await findCategoryById(categoryId)

  if (!category) {
    return response.status(404).json({ error: 'Service category not found.' })
  }

  const services = await findServicesByCategory(categoryId)
  return response.json({ category, services })
}

export async function createCategory(request, response) {
  const name = request.body?.name
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    return response.status(400).json({
      error: 'Category name must be between 1 and 100 characters.',
    })
  }

  try {
    const category = await insertCategory(name.trim())
    return response.status(201).json({ category })
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ error: 'That category already exists.' })
    }
    throw error
  }
}

function validateServiceInput(body) {
  const { categoryId, name, description, price, depositAmount, durationMinutes } =
    body ?? {}
  const parsedPrice = Number(price)
  const parsedDeposit = Number(depositAmount)

  if (
    !Number.isInteger(categoryId) ||
    categoryId < 1 ||
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 150 ||
    (description !== undefined && typeof description !== 'string') ||
    (typeof description === 'string' && description.length > 5000) ||
    !Number.isFinite(parsedPrice) ||
    parsedPrice <= 0 ||
    parsedPrice > 99999999.99 ||
    !Number.isFinite(parsedDeposit) ||
    parsedDeposit < 0 ||
    parsedDeposit > parsedPrice ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 2147483647
  ) {
    return {
      error: 'Provide a valid category, name, description, price, deposit, and duration.',
    }
  }

  return {
    value: {
      categoryId,
      name: name.trim(),
      description: description?.trim(),
      price: parsedPrice,
      depositAmount: parsedDeposit,
      durationMinutes,
    },
  }
}

async function validateCategoryId(categoryId, response) {
  const category = await findCategoryById(categoryId)
  if (!category) {
    response.status(400).json({ error: 'Select an existing category.' })
    return false
  }

  return true
}

function parseRecordId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function createService(request, response) {
  const validated = validateServiceInput(request.body)
  if (validated.error) {
    return response.status(400).json({ error: validated.error })
  }
  if (!(await validateCategoryId(validated.value.categoryId, response))) return

  const service = await insertService(validated.value)
  return response.status(201).json({ service })
}

export async function updateCategory(request, response) {
  const categoryId = parseRecordId(request.params.categoryId)
  const name = request.body?.name
  if (!categoryId || typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    return response.status(400).json({
      error: 'Provide a valid category ID and a name between 1 and 100 characters.',
    })
  }

  try {
    const category = await updateCategoryRecord(categoryId, name.trim())
    if (!category) return response.status(404).json({ error: 'Category not found.' })
    return response.json({ category })
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ error: 'That category already exists.' })
    }
    throw error
  }
}

export async function deleteCategory(request, response) {
  const categoryId = parseRecordId(request.params.categoryId)
  if (!categoryId) {
    return response.status(400).json({ error: 'Category ID must be a positive integer.' })
  }

  try {
    const deleted = await deleteCategoryRecord(categoryId)
    if (!deleted) return response.status(404).json({ error: 'Category not found.' })
    return response.status(204).end()
  } catch (error) {
    if (error.code === '23503') {
      return response.status(409).json({
        error: 'This category still has services. Delete its services first.',
      })
    }
    throw error
  }
}

export async function updateService(request, response) {
  const serviceId = parseRecordId(request.params.serviceId)
  if (!serviceId) {
    return response.status(400).json({ error: 'Service ID must be a positive integer.' })
  }

  const validated = validateServiceInput(request.body)
  if (validated.error) {
    return response.status(400).json({ error: validated.error })
  }
  if (!(await validateCategoryId(validated.value.categoryId, response))) return

  const service = await updateServiceRecord(serviceId, validated.value)
  if (!service) return response.status(404).json({ error: 'Service not found.' })
  return response.json({ service })
}

export async function deleteService(request, response) {
  const serviceId = parseRecordId(request.params.serviceId)
  if (!serviceId) {
    return response.status(400).json({ error: 'Service ID must be a positive integer.' })
  }

  const service = await deactivateServiceRecord(serviceId)
  if (!service) return response.status(404).json({ error: 'Active service not found.' })
  return response.status(204).end()
}

export async function restoreService(request, response) {
  const serviceId = parseRecordId(request.params.serviceId)
  if (!serviceId) {
    return response.status(400).json({ error: 'Service ID must be a positive integer.' })
  }

  const service = await activateServiceRecord(serviceId)
  if (!service) return response.status(404).json({ error: 'Inactive service not found.' })
  return response.json({ service })
}
