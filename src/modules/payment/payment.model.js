import mongoose, { Schema } from 'mongoose';

// Define the Payment schema
const paymentSchema = new Schema(
  {
    transactionId: { 
      type: String, 
      required: [true, "Transaction ID is required"], 
      unique: true, 
      minlength: 3, 
      maxlength: 30 
    },
    userId: { 
      type: mongoose.Schema.ObjectId, 
      ref: 'User', 
      required: [true, "User ID is required"] 
    },
    // Change stickerId to an array of ObjectIds
    stickerId: [
      { 
        type: mongoose.Schema.ObjectId, 
        ref: 'Sticker', 
        required: [true, "Sticker ID is required"] 
      }
    ],
    amount: { 
      type: Number, 
      required: [true, "Amount is required"] 
    },
    date: { 
      type: Date, 
      required: [true, "Date is required"] 
    },
    
    paymentData: { 
      type: Object, 
      required: false 
    },
    status: { 
      type: String, 
      enum: ["completed", "pending", "failed"], 
      default: "pending" 
    },
    isCompleted: { 
      type: Boolean, 
      default: false 
    },
    
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
