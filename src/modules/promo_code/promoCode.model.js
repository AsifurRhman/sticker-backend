import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
   
   
    status: {
      type: String,
      enum: ['new', 'used'],
      default: 'new',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
    
    },
  },
  {
    timestamps: true,
  }
);

export const PromoCodeModel = mongoose.models.PromoCode || mongoose.model('PromoCode', promoCodeSchema);
