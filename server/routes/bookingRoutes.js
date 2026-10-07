import { Router } from 'express'
import {
  createBooking,
  getBookingPaymentStatus,
} from '../controllers/bookingController.js'

const router = Router()

router.post('/bookings', createBooking)
router.get('/bookings/payment-status', getBookingPaymentStatus)

export default router
