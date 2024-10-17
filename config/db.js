import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../src/modules/user/user.model.js';
import { hashPassword } from '../src/modules/user/user.utils.js';


dotenv.config();



const admin = {
  name: 'MD Admin',
  email: 'admin@gmail.com',
  phone: "01533887945",
  password: "1qazxsw2", // This will be hashed before saving
  role: 'admin',
  isDeleted: false
};

export const seedSuperAdmin = async () => {
  const isSuperAdminExists = await UserModel.findOne({ email: admin.email });
  
  if (!isSuperAdminExists) {
    const hashedPassword = await hashPassword(admin.password); 
    admin.password = hashedPassword; 
   
    await UserModel.create(admin); 
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB connected...');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
  }
};

export default connectDB;