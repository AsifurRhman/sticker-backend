import mongoose, { Schema } from 'mongoose';

const privacySchema = new Schema(
  {
    description: { type: String, required: true,trim: true }
  },
  { timestamps: true},
);

export const privacyModel = mongoose.models.Privacy || mongoose.model('Privacy', privacySchema );
