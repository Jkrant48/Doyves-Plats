import { Router } from 'express'
import {
  createPortfolioImage,
  deletePortfolioImage,
  getPortfolioImages,
  updatePortfolioImage,
} from '../controllers/portfolioController.js'
import {
  requireManagementAdmin,
  requireManagementCredential,
} from '../middleware/requireManagementCredential.js'

const router = Router()

router.get('/portfolio', getPortfolioImages)
router.post('/management/portfolio', requireManagementCredential, requireManagementAdmin, createPortfolioImage)
router.patch(
  '/management/portfolio/:imageId',
  requireManagementCredential,
  requireManagementAdmin,
  updatePortfolioImage,
)
router.delete(
  '/management/portfolio/:imageId',
  requireManagementCredential,
  requireManagementAdmin,
  deletePortfolioImage,
)

export default router
