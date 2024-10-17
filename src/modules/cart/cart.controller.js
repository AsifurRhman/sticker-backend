
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { Sticker } from '../stickers/stickers.model.js';
import { Cart } from './cart.model.js';
import sendResponse from '../../utils/sendResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import sendError from '../../utils/sendError.js';

// Add a sticker to the cart
export const addToCart = catchAsync(async (req, res) => {
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
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      // Create a cart if none exists
      cart = await Cart.create({ userId, stickers: [] });
    }
  
    // Find the sticker by stickerId
    const sticker = await Sticker.findById(stickerId);
    if (!sticker) {
      return sendError(res, httpStatus.NOT_FOUND, {
        message: `Sticker is  not found.`,
      });
    }
  
    // Check if the sticker is already in the cart
    if (cart.stickers.includes(stickerId)) {
      return sendError(res, httpStatus.BAD_REQUEST, {
        message: 'This sticker is already in your cart.',
      });
    }
  
    // Add the sticker to the cart
    cart.stickers.push(stickerId);
    await cart.save();
  
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Sticker added to cart successfully.',
      data: cart,
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
  const { stickerId } = req.query;
  //console.log(stickerId, "sticker deleted");

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

  // Check if there is no cart for the user
  if (!cart || cart.stickers.length === 0) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'Your cart is empty.',
    });
  }

  // Check if the sticker is not in the cart
  if (!cart.stickers.includes(stickerId)) {
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

