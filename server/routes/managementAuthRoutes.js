import { Router } from 'express'
import {
  createManagementUserAccount,
  getBootstrapStatus,
  loginManagementAccount,
  registerManagementAccount,
} from '../controllers/managementAuthController.js'
import {
  requireManagementAdmin,
  requireManagementCredential,
} from '../middleware/requireManagementCredential.js'

const router = Router()

router.get('/management/auth/bootstrap-status', getBootstrapStatus)
router.post('/management/auth/register', registerManagementAccount)
router.post('/management/auth/login', loginManagementAccount)
router.post(
  '/management/auth/accounts',
  requireManagementCredential,
  requireManagementAdmin,
  createManagementUserAccount,
)

export default router
