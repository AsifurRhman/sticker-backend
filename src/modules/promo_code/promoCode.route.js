
import express from 'express';

import { adminMiddleware } from '../../middleware/auth.js';
import { createPromoCode, deletePromoCode, getPromoCode, updatePromoCode, usePromoCode } from './promoCode.controller.js';


const router = express.Router();

router.post('/create',adminMiddleware("admin"), createPromoCode);
router.get('/',adminMiddleware("admin"),getPromoCode);
router.put('/update', adminMiddleware("admin"), updatePromoCode);
router.delete('/', adminMiddleware("admin"), deletePromoCode);
router.post('/use-promo', adminMiddleware("user"), usePromoCode);

export default router;