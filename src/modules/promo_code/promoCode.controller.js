

import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import sendError from '../../utils/sendError.js';
import sendResponse from '../../utils/sendResponse.js';

import catchAsync from '../../utils/catchAsync.js';
import { findPromoCodeByCode, findPromoCodeById, promoCodeCreate, promoCodeDelete, promoCodes, promoCodeUpdate } from './promoCode.service.js';
import { UserModel } from '../user/user.model.js';
import { PromoCodeModel } from './promoCode.model.js';
import { findUserById } from '../user/user.service.js';


export const createPromoCode = catchAsync(async (req, res) => {
  const { code } = req.body;
  console.log(code,"code")
  console.log(req.body)
    const existingPromoCode = await findPromoCodeByCode(code);
  
    if (existingPromoCode) {
      return sendError(res,httpStatus.BAD_REQUEST, {
        message: 'Promo code already exists',
      });
    }
    const promoCode = await promoCodeCreate({ code});
  
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'promoCode created successfully',
      data: promoCode,
    });
});
  

export const getPromoCode = catchAsync(async (req, res) => {
    const promoCode = await promoCodes();
  
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'promo code retrieved successfully',
      data: promoCode ,
    });
  });


export const updatePromoCode = catchAsync(async (req, res) => {
    const promoId = req.query?.id;
 
    const { code,expiry_date,} = req.body;
 
    const promoCode = await findPromoCodeById(promoId);
    if (!promoCode) {
      return sendError(res, httpStatus.NOT_FOUND, {
        message: 'promo code not found.',
      });
    }
  
    const updateData = {};
    if (code) updateData.code = code;
 
  
  
    const updatedPromoCode= await promoCodeUpdate(promoId, updateData);
    if (updatedPromoCode) {
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Promo code  updated successfully',
        data: null,
      });
    }
  
  });


  export const deletePromoCode = catchAsync(async (req, res) => {
    const promoId = req.query?.id;
  
    const promoCode = await findPromoCodeById(promoId);
    if (!promoCode) {
      return sendError(res, httpStatus.NOT_FOUND, {
        message: 'promo code  not found or maybe deleted.',
      });
    }
  
    await promoCodeDelete(promoId);
  
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'promo deleted successfully',
      data: null,
    });
  });



  export const usePromoCode = catchAsync(async (req, res) => {
    // Extract the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, httpStatus.UNAUTHORIZED, {
        message: 'No token provided or invalid format.',
      });
    }
  
    const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
  
    // Decode the token to get the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decoded.id; // Assuming the token contains the userId
  
    // Find the user by userId
    const user = await findUserById(userId);
    if (!user) {
      return sendError(res, httpStatus.NOT_FOUND, {
        message: 'User not found.',
      });
    }
  
    const { promoCode } = req.body;
  
    // Check if the promo code exists in the database
    const existingPromoCode = await PromoCodeModel.findOne({ code: promoCode });
  
    if (!existingPromoCode) {
      return sendError(res, httpStatus.BAD_REQUEST, {
        message: 'Promo code does not exist',
      });
    }
  
    // Check if the promo code has already been used
    if (existingPromoCode.status === 'used') {
      return sendError(res, httpStatus.BAD_REQUEST, {
        message: 'This promo code has already been used by another user.',
      });
    }
  
    // Add promo code to the user's document

    const addUserPromo = await UserModel.findByIdAndUpdate(
      userId,
      { promoCode: existingPromoCode.code },
      { new: true } // Returns the updated user
    );
  
    // Update promo code status to 'used'
    await PromoCodeModel.findByIdAndUpdate(
      existingPromoCode._id,
      { status: 'used', userId: userId }, // Assigning userId to the promo code as well
      { new: true }
    );
  
    // Send success response
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Congratulations! You have successfully used the promo code.',
      data: addUserPromo,
    });
  });
  











































