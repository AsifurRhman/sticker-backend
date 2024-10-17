import express from 'express';
import { adminMiddleware } from '../../middleware/auth.js';
import validateRequest from '../../middleware/validateRequest.js';
import { createSticker, deleteSticker, getAllSticker, getMyStickers, getSingleSticker, updateSticker } from './stickers.controller.js';
import { createStickerValidationSchema, } from './stickers.validation.js';
import {  upload } from '../../middleware/fileUploadNormal.js';


const router = express.Router();


router.post('/create', 
    adminMiddleware("admin"),  
    upload.single('image'),   
    createSticker          
  );
router.get('/all', getAllSticker);
router.put('/update', adminMiddleware("admin"),  upload.single('image'),updateSticker);
router.delete('/delete', adminMiddleware("admin"), deleteSticker);
router.get('/sticker-detail', getSingleSticker);
router.get('/my-sticker', getMyStickers );
export default router;
