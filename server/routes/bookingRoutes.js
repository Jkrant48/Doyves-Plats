import { Router } from 'express'
import {
  createBooking,
  deleteManagedAvailability,
  getBookingAvailability,
  getManagedAvailability,
  getManagedAppointments,
  getBookingPaymentStatus,
  updateManagedAvailability,
  updateAppointmentOutcome,
} from '../controllers/bookingController.js'
import {
  requireManagementAdmin,
  requireManagementCredential,
} from '../middleware/requireManagementCredential.js'

const router = Router()

router.post('/bookings', createBooking)
router.get('/bookings/availability', getBookingAvailability)
router.get('/bookings/payment-status', getBookingPaymentStatus)
router.get(
  '/management/availability',
  requireManagementCredential,
  requireManagementAdmin,
  getManagedAvailability,
)
router.put(
  '/management/availability',
  requireManagementCredential,
  requireManagementAdmin,
  updateManagedAvailability,
)
router.delete(
  '/management/availability/:date',
  requireManagementCredential,
  requireManagementAdmin,
  deleteManagedAvailability,
)
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
