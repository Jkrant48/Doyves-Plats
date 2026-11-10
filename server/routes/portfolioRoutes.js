import { raw, Router } from 'express'
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
const imageUpload = raw({ type: 'image/*', limit: '5mb' })

router.get('/portfolio', getPortfolioImages)
router.post(
  '/management/portfolio',
  requireManagementCredential,
  requireManagementAdmin,
  imageUpload,
  createPortfolioImage,
)
router.patch(
  '/management/portfolio/:imageId',
  requireManagementCredential,
  requireManagementAdmin,
  imageUpload,
  updatePortfolioImage,
)
router.delete(
  '/management/portfolio/:imageId',
  requireManagementCredential,
  requireManagementAdmin,
  deletePortfolioImage,
)

export default router
