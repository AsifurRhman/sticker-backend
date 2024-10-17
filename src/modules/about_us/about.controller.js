import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";

import sendError from "../../utils/sendError.js";
import sanitizeHtml from 'sanitize-html';

import jwt from 'jsonwebtoken';

import { findUserById } from "../user/user.service.js";
import { createAboutInDB, deleteAboutFromDB, getAllAboutFromDB, updateAboutInDB } from "./aboute.service.js";



const sanitizeOptions = {
  allowedTags: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'img'
  ],
  allowedAttributes: {
    a: ['href', 'target'],
    img: ['src', 'alt'],
  },
  allowedIframeHostnames: ['www.youtube.com'],
};



export const createAbout = catchAsync(async (req, res) => {
    const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'No token provided or invalid format.',
    });
  }

  const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const userId = decoded.id; // Assuming the token contains the userId

  // Find the user by userId
  const user = await findUserById(userId);
  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'User not found.',
    });
  }

    // Check if the user is an admin
    if (user.role !== 'admin') {
      return sendError(res, httpStatus.FORBIDDEN, {
        message: 'Only admins can create terms.',
      });
    }
  
    const { description } = req.body;
    
   const sanitizedContent = sanitizeHtml(description, sanitizeOptions);
    if (!description) {
      return sendError(res, httpStatus.BAD_REQUEST, {
        message: 'Description is required!',
      });
    }
  
    const result = await createAboutInDB({ sanitizedContent  });
  
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'about us created successfully.',
      data: result,
    });
  });
  
  export const getAllAbout = catchAsync(async (req, res) => {
    const result = await getAllAboutFromDB();
  
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'about us retrieved successfully.',
      data: result,
    });
  });



  export const updateAbout = catchAsync(async (req, res) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, httpStatus.UNAUTHORIZED, {
        message: 'No token provided or invalid format.',
      });
    }
  
    const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decoded.id; // Assuming the token contains the userId
  
    // Find the user by userId
    const user = await findUserById(userId);
    if (!user) {
      return sendError(res, httpStatus.NOT_FOUND, {
        message: 'User not found.',
      });
    }
  
    // Check if the user is an admin
    if (user.role !== 'admin') {
      return sendError(res, httpStatus.FORBIDDEN, {
        message: 'Only admins can update terms.',
      });
    }
  
    // Sanitize the description field
    const { description } = req.body;
    if (!description) {
      return sendError(res, httpStatus.BAD_REQUEST, {
        message: 'Description is required.',
      });
    }
  
    const sanitizedDescription = sanitizeHtml(description, sanitizeOptions);

    // Update terms with the sanitized description
    const updateData = { description: sanitizedDescription };
  
    // Assume you're updating the terms based on the sanitized description
    const result = await updateAboutInDB(updateData);
  
    if (!result) {
      return sendError(res, httpStatus.INTERNAL_SERVER_ERROR, {
        message: 'Failed to update about.',
      });
    }
  
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'about updated successfully.',
      data: result,
    });
  });
  
  
  
  export const deleteAbout = catchAsync(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, httpStatus.UNAUTHORIZED, {
        message: 'No token provided or invalid format.',
      });
    }
  
    const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decoded.id; // Assuming the token contains the userId
  
    // Find the user by userId
    const user = await findUserById(userId);
    if (!user) {
      return sendError(res, httpStatus.NOT_FOUND, {
        message: 'User not found.',
      });
    }
  
      // Check if the user is an admin
      if (user.role !== 'admin') {
        return sendError(res, httpStatus.FORBIDDEN, {
          message: 'Only admins can create terms.',
        });
      }
  
    const { id } = req.query;
  
    if (!id) {
      return sendError(res, httpStatus.BAD_REQUEST, {
        message: 'about ID is required in query parameters.',
      });
    }
  
    const result = await deleteAboutFromDB(id);
  
    if (!result) {
      return sendError(res, httpStatus.NOT_FOUND, {
        message: 'about not found.',
      });
    }
  
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'about deleted successfully.',
      data: result,
    });
  });

  


  






