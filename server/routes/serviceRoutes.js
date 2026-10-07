import { Router } from 'express'
import {
  getCategories,
  getServices,
  getServicesByCategory,
} from '../controllers/serviceController.js'

const router = Router()

router.get('/categories', getCategories)
router.get('/categories/:categoryId/services', getServicesByCategory)
router.get('/services', getServices)

export default router
