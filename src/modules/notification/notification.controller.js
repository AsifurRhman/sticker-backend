import catchAsync from "../../utils/catchAsync.js";
import { NotificationModel } from "./notification.model.js";
import { UserModel } from "../user/user.model.js";
import httpStatus from 'http-status';
import sendResponse from "../../utils/sendResponse.js";
import sendError from "../../utils/sendError.js";
import jwt from 'jsonwebtoken';
import { findUserById } from "../user/user.service.js";


  
export const getMyNotification = catchAsync(async (req, res) => {
    // Extract the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, httpStatus.UNAUTHORIZED, {
        message: 'No token provided or invalid format.',
      });
    }
  
    const token = authHeader.split(' ')[1]; // Get the token part from 'Bearer <token>'
  
    try {
      // Decode the token to get the user ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const userId = decoded.id;
  
      // Find the user by userId
      const user = await findUserById(userId);
      if (!user) {
        return sendError(res, httpStatus.NOT_FOUND, {
          message: 'User not found.',
        });
      }
  
      // Pagination logic
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 20) || 20;
      const skip = (page - 1) * limit;
  
      let notifications;
      let totalNotifications;
  
      if (user.role === 'admin') {
        // For admin, fetch all admin messages
        notifications = await NotificationModel.find({ adminMsg: { $exists: true } })
          .select('adminMsg createdAt updatedAt')
          .sort({ createdAt: -1 }) // Sort by createdAt in descending order
          .skip(skip)
          .limit(limit);
  
        totalNotifications = await NotificationModel.countDocuments({ adminMsg: { $exists: true } });
      } else {
        // For regular users, fetch their specific notifications
        notifications = await NotificationModel.find({ userId: userId })
          .select('userId userMsg createdAt updatedAt')
          .sort({ createdAt: -1 }) // Sort by createdAt in descending order
          .skip(skip)
          .limit(limit);
  
        totalNotifications = await NotificationModel.countDocuments({ userId: userId });
      }
  
      // Calculate total pages
      const totalPages = Math.ceil(totalNotifications / limit);
  
      // Format the notifications
      const formattedNotifications = notifications.map(notification => ({
        _id: notification._id,
        msg: user.role === 'admin' ? notification.adminMsg : notification.userMsg,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt
      }));
  
      // Check if notifications is empty
      if (formattedNotifications.length === 0) {
        return sendResponse(res, {
          statusCode: httpStatus.OK,
          success: true,
          message: 'You have no notifications.',
          data: {
            notifications: [],
            currentPage: page,
            totalPages,
            totalNotifications,
            limit
          },
        });
      }
  
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Here are your notifications.",
        data: {
          notifications: formattedNotifications,
          currentPage: page,
          totalPages,
          totalNotifications,
          limit
        },
      });
    } catch (error) {
      return sendError(res, httpStatus.UNAUTHORIZED, {
        message: 'Invalid token or token expired.',
      });
    }
  });