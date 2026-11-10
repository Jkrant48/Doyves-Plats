import { Router } from 'express'
import {
  approveReview,
  createReview,
  getApprovedReviews,
  getPendingReviews,
} from '../controllers/reviewController.js'
import {
  requireManagementAdmin,
  requireManagementCredential,
} from '../middleware/requireManagementCredential.js'

const router = Router()

router.get('/reviews', getApprovedReviews)
router.post('/reviews', createReview)
router.get(
  '/management/reviews',
  requireManagementCredential,
  requireManagementAdmin,
  getPendingReviews,
)
router.patch(
  '/management/reviews/:reviewId/approve',
  requireManagementCredential,
  requireManagementAdmin,
  approveReview,
)

export default router
