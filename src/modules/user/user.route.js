import express from 'express';
import { adminMiddleware } from '../../middleware/auth.js';
import validateRequest from '../../middleware/validateRequest.js';
import {
  changePassword,
  changeUserRole,
  forgotPassword,
  getDashboardInfo,

  getEarningsInfo,

  getSelfInfo,
  getUserInfo,
  loginUser,
  registerUser,
  resendOTP,
  resetPassword,
  updateUser,
  verifyForgotPasswordOTP,
  verifyOTP,

} from './user.controller.js';
import {
  loginValidationSchema,
  registerUserValidationSchema,

} from './user.validation.js';
import { upload } from '../../middleware/fileUploadNormal.js';

const router = express.Router();
router.post(
  '/register',
  validateRequest(registerUserValidationSchema),
  registerUser,
);
router.post('/login',  loginUser);
router.post('/forget-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-otp', verifyOTP);
router.post('/resend', resendOTP);
router.post('/verify-forget-otp', verifyForgotPasswordOTP );
router.post('/change-password', changePassword);
router.post(
  "/update",
  upload.single('image'),
  updateUser
);
router.get("/user-list", adminMiddleware("admin"), getUserInfo);
router.get("/information", getSelfInfo);
router.put('/change-role', adminMiddleware('admin'), changeUserRole);
router.get('/dashboard-stats', adminMiddleware('admin'), getDashboardInfo);
 router.get('/earnings', adminMiddleware('admin'), getEarningsInfo);
export default router;