import mongoose, { Schema } from 'mongoose';

const StickerSchema = new Schema(
  {
    name: { type: String, required: true,trim: true },
    image: {
      type: Object,
      required: false,
      default: { publicFileURL: "images/stickers/sticker.png", path: "public\\images\\sticker.png" },
    },
    price: { type: Number, required: true },
    description: { type: String, required: true ,trim: true}
  },
  { timestamps: true},
);

export const Sticker = mongoose.models.Sticker || mongoose.model('Sticker', StickerSchema);