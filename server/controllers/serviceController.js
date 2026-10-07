import {
  findCategories,
  findAllServices,
  findCategoryById,
  findServicesByCategory,
} from '../services/serviceService.js'

export async function getCategories(_request, response) {
  const categories = await findCategories()
  response.json({ categories })
}

export async function getServices(request, response) {
  const services = await findAllServices()
  response.json({ services })
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
