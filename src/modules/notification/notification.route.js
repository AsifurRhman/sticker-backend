import express from 'express';
import { getMyNotification } from './notification.controller.js';



const router = express.Router();

router.get('/my-notification',getMyNotification);



export default router;