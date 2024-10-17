import express from 'express';
import userRoutes from '../modules/user/user.route.js';
import stickerRoutes from '../modules/stickers/stickers.route.js';
import promoCodeRoutes from '../modules/promo_code/promoCode.route.js';
import notificationRoutes from '../modules/notification/notification.route.js';
import paymentRoutes from '../modules/payment/payment.route.js';
import termsRoutes from '../modules/terms_conditions/terms.route.js';
import privacyRoutes from '../modules/privacy_policy/privacy.route.js';
import aboutRoutes from '../modules/about_us/about.route.js';
import cartRoutes from '../modules/cart/cart.route.js';
import downloadRoutes from '../modules/download/download.route.js';



const router = express.Router();


router.use("/api/v1/user", userRoutes);
router.use("/api/v1/sticker", stickerRoutes);
router.use("/api/v1/promo-code", promoCodeRoutes);
router.use("/api/v1/notification",notificationRoutes );
router.use("/api/v1/transaction",paymentRoutes );
router.use("/api/v1/terms",termsRoutes );
router.use("/api/v1/privacy",privacyRoutes );
router.use("/api/v1/about",aboutRoutes );
router.use("/api/v1/cart",cartRoutes );
router.use("/api/v1/download",downloadRoutes );



export default router;
