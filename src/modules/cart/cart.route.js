import express from 'express';
import { adminMiddleware } from '../../middleware/auth.js';
import { addToCart, deleteCartItem, getCart } from './cart.controller.js';

const router = express.Router();

router.post('/add-to-cart', adminMiddleware('user'), addToCart);      
router.get('/my-cart', adminMiddleware('user'), getCart);      
router.delete('/delete', adminMiddleware('user'), deleteCartItem); 

export default router;
