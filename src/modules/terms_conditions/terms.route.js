import express from 'express';
import { adminMiddleware } from '../../middleware/auth.js';
import { createTerms, deleteTerms, getAllTerms, updateTerms,  } from './terms.controller.js';



const router = express.Router();


router.post('/create', adminMiddleware("admin"), createTerms);
 router.get('/all', getAllTerms);
 router.put('/update', adminMiddleware("admin"), updateTerms);
 router.delete('/delete', adminMiddleware("admin"), deleteTerms);

export default router;
