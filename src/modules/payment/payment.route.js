import express from 'express';
import { getAllPayment, getPayment, getSingleTransaction, paymentCreate } from './payment.controller.js';
import { adminMiddleware } from '../../middleware/auth.js';


const router = express.Router();

router.post("/purchase",adminMiddleware("user"),paymentCreate );
router.get('/all', adminMiddleware("admin"), getAllPayment);
router.get('/all-payment', adminMiddleware("admin"), getPayment);
router.get('/detail', adminMiddleware("admin"), getSingleTransaction);

export default router;