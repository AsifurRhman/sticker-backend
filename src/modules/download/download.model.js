import mongoose, { Schema } from 'mongoose';

const downloadSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stickers: [{ type: Schema.Types.ObjectId, ref: 'Sticker' }] // Array of sticker ObjectIds
  },
  { timestamps: true }
);

export const downloadModel = mongoose.models.download || mongoose.model('download', downloadSchema);
