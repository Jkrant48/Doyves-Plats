import { Router } from 'express'
import {
  createBooking,
  getManagedAppointments,
  getBookingPaymentStatus,
  updateAppointmentOutcome,
} from '../controllers/bookingController.js'
import {
  requireManagementAdmin,
  requireManagementCredential,
} from '../middleware/requireManagementCredential.js'

const router = Router()

router.post('/bookings', createBooking)
router.get('/bookings/payment-status', getBookingPaymentStatus)
router.get(
  '/management/appointments',
  requireManagementCredential,
  getManagedAppointments,
)
router.patch(
  '/management/appointments/:appointmentId',
  requireManagementCredential,
  requireManagementAdmin,
  updateAppointmentOutcome,
)

export default router
