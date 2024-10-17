
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { Sticker } from '../stickers/stickers.model.js';
import sendResponse from '../../utils/sendResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import sendError from '../../utils/sendError.js';
import { downloadModel } from './download.model.js';

// Add a sticker to the cart
export const addToDownload = catchAsync(async (req, res) => {
    const { stickerId } = req.body;  // Expect a single stickerId
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, httpStatus.UNAUTHORIZED, {
        message: 'No token provided or invalid format.',
      });
    }
  
    const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decoded.id; // Assuming the token contains the userId
  
    // Check if the user has a cart
    let download = await downloadModel.findOne({ userId });
    if (!download) {
      // Create a cart if none exists
      download = await downloadModel.create({ userId, stickers: [] });
    }
  
    // Find the sticker by stickerId
    const sticker = await Sticker.findById(stickerId);
    if (!sticker) {
      return sendError(res, httpStatus.NOT_FOUND, {
        message: `Sticker is  not found.`,
      });
    }
  
   
  
    // Add the sticker to the download
    download.stickers.push(stickerId);
    await download.save();
  
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Sticker download successfully.',
      data: download,
    });
  });
  
  
  

// Get all stickers in the user's cart
export const getCart = catchAsync(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, httpStatus.UNAUTHORIZED, {
        message: 'No token provided or invalid format.',
      });
    }
  
    const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decoded.id; // Assuming the token contains the userId

  const cart = await Cart.findOne({ userId }).populate('stickers');
  if (!cart) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Your cart is empty.',
      data: [],
    });
  }

  const reversedStickers = cart.stickers.reverse();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart fetched successfully.',
    data: reversedStickers, // Return the reversed array
  });
});

// Remove a sticker from the cart
export const deleteCartItem = catchAsync(async (req, res) => {
    const { stickerId } = req.body;
 
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, httpStatus.UNAUTHORIZED, {
        message: 'No token provided or invalid format.',
      });
    }
  
    const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decoded.id; // Assuming the token contains the userId

  const cart = await Cart.findOne({ userId });
  if (!cart || !cart.stickers.includes(stickerId)) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'Sticker not found in your cart.',
    });
  }

  // Remove the sticker from the cart
  cart.stickers = cart.stickers.filter(sticker => sticker.toString() !== stickerId);
  await cart.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sticker removed from cart successfully.',
    data: cart.stickers,
  });
});
