import mongoose, { Schema } from 'mongoose';
const aboutSchema = new Schema(
  {
    description: { type: String, required: true, trim: true }
  },
  { timestamps: true },
);



export const AboutModel = mongoose.models.About || mongoose.model('About', aboutSchema );
