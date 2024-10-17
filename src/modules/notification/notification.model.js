import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of ObjectIds for multiple admins
  adminMsg: { type: String },
  userMsg: { type: String },
}, { timestamps: true });

export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
