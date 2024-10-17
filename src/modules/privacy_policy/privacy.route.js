import express from 'express';
import { adminMiddleware } from '../../middleware/auth.js';
import { createPrivacy, deletePrivacy, getAllPrivacy, updatePrivacy } from './privacy.controller.js';





const router = express.Router();


router.post('/create', adminMiddleware("admin"), createPrivacy);
 router.get('/all', getAllPrivacy);
 router.put('/update', adminMiddleware("admin"), updatePrivacy);
 router.delete('/delete', adminMiddleware("admin"), deletePrivacy);

export default router;
