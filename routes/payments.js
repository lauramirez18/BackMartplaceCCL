import express from 'express';
import { handlePayPalPayment } from '../controllers/paymentsc.js';
import { createPayPalOrder } from '../controllers/paymentsc.js';

const router = express.Router();

// PayPal payment confirmation endpoint
router.post('/paypal/confirm', handlePayPalPayment);
router.post('/paypal/create', createPayPalOrder);
export default router; 