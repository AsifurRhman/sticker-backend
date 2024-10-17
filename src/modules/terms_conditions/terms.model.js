import mongoose, { Schema } from 'mongoose';

const termsSchema = new Schema(
  {
    description: { type: String, required: true,trim: true }
  },
  { timestamps: true},
);

export const termsModel = mongoose.models.Terms || mongoose.model('Terms', termsSchema);
