import express from 'express';
import { adminMiddleware } from '../../middleware/auth.js';
import { addToDownload } from './download.controller.js';


const router = express.Router();

router.post('/', adminMiddleware('user'), addToDownload);      


export default router;
