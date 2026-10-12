import { Router } from 'express'
import {
  createCategory,
  createService,
  deleteCategory,
  deleteService,
  getCategories,
  getManagementServices,
  getServices,
  getServicesByCategory,
  restoreService,
  updateCategory,
  updateService,
} from '../controllers/serviceController.js'
import {
  requireManagementAdmin,
  requireManagementCredential,
} from '../middleware/requireManagementCredential.js'

const router = Router()

router.get('/categories', getCategories)
router.get('/categories/:categoryId/services', getServicesByCategory)
router.get('/services', getServices)
router.get('/management/services', requireManagementCredential, requireManagementAdmin, getManagementServices)
router.post('/categories', requireManagementCredential, requireManagementAdmin, createCategory)
router.post('/services', requireManagementCredential, requireManagementAdmin, createService)
router.patch('/categories/:categoryId', requireManagementCredential, requireManagementAdmin, updateCategory)
router.delete('/categories/:categoryId', requireManagementCredential, requireManagementAdmin, deleteCategory)
router.patch('/services/:serviceId', requireManagementCredential, requireManagementAdmin, updateService)
router.delete('/services/:serviceId', requireManagementCredential, requireManagementAdmin, deleteService)
router.post(
  '/services/:serviceId/restore',
  requireManagementCredential,
  requireManagementAdmin,
  restoreService,
)

export default router
