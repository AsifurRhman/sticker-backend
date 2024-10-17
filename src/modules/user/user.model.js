import mongoose, { Schema } from "mongoose";





const PendingUserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },  // Unhashed password (only for temporary storage)
  confirmPassword: { type: String, required: true },
}, { timestamps: true });

export const PendingUserModel = mongoose.model('PendingUser', PendingUserSchema);


const UserSchema = new Schema({
  name: { type: String,trim: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  confirmPassword: { type: String },
  phone: { type: String },
  address: { type: String,trim: true },
  image: {
    type: Object,
    required: false,
    default: { publicFileURL: "/images/user.png", path: "public\\images\\user.png" },
  },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  promoCode: {
    type: String, // Store the name of the promo code
    default: '',  // Default value will be an empty string
  },

}, { timestamps: true });


export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);


// OTP schema
const OTPSchema = new Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 1 * 60 * 1000) } // Expires in 1 minute
});

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTPModel = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);
