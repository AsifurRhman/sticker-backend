import mongoose from 'mongoose';
import { UserModel } from './user.model.js';
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer";
import httpStatus from 'http-status';
import { convertDateToISO, convertDateToISODB, formatDate } from './user.utils.js';
import { PaymentModel } from '../payment/payment.model.js';
import { Sticker } from '../stickers/stickers.model.js';


export const findUserByEmail = async (email) => {
  
  return UserModel.findOne({ email });
};

export const createUser = async ({ name, email, hashedPassword, role, }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newUser = { name, email, password: hashedPassword,  role,  };
    const createdUser = await UserModel.create([newUser], { session });

    await session.commitTransaction();
    
    return { createdUser: createdUser[0] };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const findUserById = async (id) => {

  return UserModel.findById(id);
};

export const updateUserById = async (id, updateData) => {
  return UserModel.findByIdAndUpdate(id, updateData, { new: true });
};



export const deleteUserById = async (id) => {
  return UserModel.findByIdAndDelete(id);
};



export const getUserList = async (userId, skip, limit, date, name, email) => {
  // Build the match query
  const matchQuery = {
    _id: { $ne: userId },
    role: { $ne: "admin" },
  };

  // Add filtering by date if provided
 
  if (date) {
    const isoDate = convertDateToISODB(date);
    matchQuery.createdAt = { 
      $gte: new Date(isoDate),  // Start from the beginning of the day
      $lt: new Date(new Date(isoDate).setDate(new Date(isoDate).getDate() + 1)) // Less than the next day (ignores time)
    };
  }

  // Add filtering by name if provided
  if (name) {
    matchQuery.name = new RegExp(name, 'i'); // Case-insensitive search for name
  }

  // Add filtering by email if provided
  if (email) {
    matchQuery.email = new RegExp(email, 'i'); // Case-insensitive search for email
  }

  // Retrieve the users
  const users = await UserModel.aggregate([
    {
      $match: matchQuery,
    },
    {
      $setWindowFields: {
        sortBy: { createdAt: -1 },
        output: {
          serial: {
            $documentNumber: {},
          },
        },
      },
    },
    {
      $project: {
        email: 1,
        name: 1,
        serial: 1, // Include serial from the $setWindowFields
        createdAt: 1,
        promoCode: 1, // Include promoCode field
        address: 1,
        phone:1
        
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

 

  // Format the date field
  users.forEach(user => {
    user.createdAt = formatDate(user.createdAt);
  });

  // Count the total number of users matching the query
  const totalUsers = await UserModel.countDocuments(matchQuery);

  // Calculate total pages
  const totalPages = Math.ceil(totalUsers / limit);

  // Return users and pagination info
  return { users, totalUsers, totalPages };
};





export const getDashboardStats = async () => {
  const [userCount, totalEarnings, stickerCount] = await Promise.all([
    UserModel.countDocuments(),
    PaymentModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]),
    Sticker.countDocuments()
  ]);

  return {
    totalUsers: userCount || 0,
    totalEarnings: totalEarnings.length > 0 ? totalEarnings[0].total : 0,
    totalStickers: stickerCount || 0
  };
};

/**
 * Function to retrieve yearly earnings for the admin dashboard
 * @param {Number} year - The year for which to fetch earnings
 */
export const getYearlyEarnings = async (year) => {
  // Start and end date for the year
  const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

  // Aggregate payments by month where isCompleted is true
  const payments = await PaymentModel.aggregate([
    {
      $addFields: {
        dateAsDate: { $toDate: "$date" }  // Convert the 'date' field to a Date type if stored as a string
      }
    },
    {
      $match: {
        dateAsDate: { $gte: startDate, $lte: endDate },  // Filter for the specified year
        isCompleted: true  // Only include completed payments
      }
    },
    {
      $group: {
        _id: { $month: "$dateAsDate" },  // Group by the month (1 = Jan, 12 = Dec)
        totalEarnings: { $sum: "$amount" }  // Sum the earnings for each month
      }
    },
    {
      $sort: { "_id": 1 }  // Sort by month
    }
  ]);

  
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Create an array of earnings for each month in the desired format
  const earningsByMonth = monthNames.map((month, index) => {
    const foundPayment = payments.find(p => p._id === index + 1);
    return {
      name: month,  // Month name (e.g., 'Jan')
      earn: foundPayment ? foundPayment.totalEarnings : 0  // Earnings for the month, or 0 if none
    };
  });

  return {
    year,
    earnings: earningsByMonth
  };
};

