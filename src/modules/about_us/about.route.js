import express from 'express';
import { adminMiddleware } from '../../middleware/auth.js';
import { createAbout, deleteAbout, getAllAbout, updateAbout } from './about.controller.js';






const router = express.Router();


router.post('/create', adminMiddleware("admin"), createAbout);
 router.get('/all', getAllAbout);
 router.put('/update', adminMiddleware("admin"), updateAbout);
 router.delete('/delete', adminMiddleware("admin"), deleteAbout);

export default router;
