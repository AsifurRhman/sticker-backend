import mongoose, { Schema } from 'mongoose';

const CartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stickers: [{ type: Schema.Types.ObjectId, ref: 'Sticker' }] // Array of sticker ObjectIds
  },
  { timestamps: true }
);

export const Cart = mongoose.models.Cart || mongoose.model('Cart', CartSchema);
