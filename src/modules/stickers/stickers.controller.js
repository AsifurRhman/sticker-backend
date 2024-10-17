import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { createStickerIntoDB, deleteStickerFromDB, findStickerById, getAllStickerFromDB, updateStickerIntoDB } from "./stickers.service.js";
import sendError from "../../utils/sendError.js";
import { emitNotificationForCreateStickers } from "../../utils/socket.js";
import { PaymentModel } from "../payment/payment.model.js";
import { findUserById } from "../user/user.service.js";
import jwt from 'jsonwebtoken';
import { downloadModel } from "../download/download.model.js";
import sharp from "sharp";
import fs from 'fs'



export const createSticker = catchAsync(async (req, res) => {
  // Destructure the fields from the request body
  const { name, price, description } = req.body;
  if (!req.file) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Image file is required!',
    });
  }
  const filePath = `public/images/${req.file.filename}`;

  // Validate the dimensions of the uploaded image
  const metadata = await sharp(filePath).metadata();
  if (metadata.width > 156 || metadata.height > 164) {
    // Delete the uploaded file
    fs.unlinkSync(filePath);
     return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Image dimensions should be 156px by 164px maximum',
    });
  }

  // Handle the uploaded image (req.file)
  const imagePath = `public\\images\\${req.file.filename}`; // Path where the image is stored on the server
  const publicFileURL = `/images/${req.file.filename}`; // URL to access the image

  try {
    // Create the sticker with the valid data (including the image object)
    const result = await createStickerIntoDB({
      name,
      price,
      description,
      image: {
        path: imagePath, // Path where the image is stored in the file system
        publicFileURL: publicFileURL, // Public URL to access the image
      },
    });

    // Emit a notification to all users about the new sticker
    await emitNotificationForCreateStickers({
      userMsg: `Pmoji launched a new sticker: "${name}".you can check!`,
    });

    // Send success response
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Sticker added successfully.',
      data: result,
    });
  } catch (error) {
 
    sendError(res, httpStatus.BAD_REQUEST, {
      message: error.message || 'Error adding sticker!',
    });
  }
});



  
export const getAllSticker = catchAsync(async (req, res) => {
  // Get the name, page, and limit query parameters from the request
  const { name, page = 1, limit = 10 } = req.query;

  // Convert page and limit to numbers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  // Call the database function with pagination and optional filter based on name
  const result = await getAllStickerFromDB(name, pageNumber, limitNumber);

  // If no stickers are found, return a not found response
  if (!result || result.stickers.length === 0) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'Sticker does not exist.',
    });
  }

  // Send the response with the filtered or full list of stickers and pagination info
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Stickers retrieved successfully.',
    data: {
      stickers: result.stickers,
      currentPage: pageNumber,
        totalPages: Math.ceil(result.totalCount / limitNumber),
      totalStickers: result.totalCount,
     
    }
  });
  
});


  

  export const updateSticker = catchAsync(async (req, res) => {
    const StickerId = req.query?.id;
  
    // Find the sticker by ID
    const sticker = await findStickerById(StickerId);
    if (!sticker) {
      return sendError(res, httpStatus.NOT_FOUND, {
        message: 'Sticker not found.',
      });
    }
  
    // Destructure properties from req.body
    const { name, price, description } = req.body;
  
    // If a file is uploaded, store its filename
    let updatedData = { name, price, description };
  
    if (req.file) {
      const filePath = `public/images/${req.file.filename}`;

    // Validate the dimensions of the uploaded image
    const metadata = await sharp(filePath).metadata();
    if (metadata.width > 156 || metadata.height > 164) {
      // Delete the uploaded file
      fs.unlinkSync(filePath);
       return sendError(res, httpStatus.BAD_REQUEST, {
        message: 'Image dimensions should be 156px by 164px maximum',
      });
    }
    const imagePath = `public\\images\\${req.file.filename}`; // Assuming multer stores the file in public/images folder
    const publicFileURL = `/images/${req.file.filename}`; // Public URL for accessing the image
  
    updatedData.image = {
      path: imagePath,
      publicFileURL: publicFileURL
    };
 
  }
  
    // Update the sticker in the DB
    const result = await updateStickerIntoDB(StickerId, updatedData);
  
    // Send the response back
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Sticker is updated successfully.',
      data: result,
    });
  });
  


  export const deleteSticker = catchAsync(async (req, res) => {
      const stickerId = req.query?.id;
      const Sticker = await findStickerById(stickerId );
    if (!Sticker) {
        return sendError(res, httpStatus.NOT_FOUND, {
          message: 'Sticker not found or may be deleted.',
        });
      }
    const result = await deleteStickerFromDB(stickerId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Sticker is deleted successfully.',
      data: null,
    });
  });

  export const getSingleSticker = catchAsync(async (req, res) => {
    const StickerId = req.query?.id;
    const Sticker = await findStickerById(StickerId );
if (!Sticker) {
  return sendError(res, httpStatus.NOT_FOUND, {
    message: 'Sticker not found.',
  });
}
  
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Sticker retrieved successfully.',
      data: Sticker ,
    });
  });



  
  export const getMyStickers = catchAsync(async (req, res) => {
    // Extract the token from the Authorization header
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
  
    // Find all completed payments for the user
    const payments = await PaymentModel.find({
      userId,
      status: 'completed',
      isCompleted: true,
    }).populate('stickerId'); // Populate the array of stickerIds to get sticker details
  
    // Find all downloads for the user from downloadModel
    const downloads = await downloadModel.find({
      userId,
    }).populate('stickers'); // Populate the array of sticker ObjectIds
  
    // Collect stickers from both payments and downloads
    const paymentStickers = payments.reduce((acc, payment) => {
      if (Array.isArray(payment.stickerId)) {
        acc.push(...payment.stickerId); // Add all stickers if stickerId is an array
      }
      return acc;
    }, []);
  
    const downloadStickers = downloads.reduce((acc, download) => {
      if (Array.isArray(download.stickers)) {
        acc.push(...download.stickers); // Add all stickers from downloads if present
      }
      return acc;
    }, []);
  
    // Combine stickers from both sources and remove duplicates
    const allStickers = [...paymentStickers, ...downloadStickers];
    const uniqueStickers = [...new Set(allStickers.map(sticker => sticker._id.toString()))]
      .map(id => allStickers.find(sticker => sticker._id.toString() === id));
  
    if (uniqueStickers.length === 0) {
      return sendError(res, httpStatus.NOT_FOUND, {
        message: 'No stickers found. Please purchase or download.',
      });
    }
  
    // Return the unique stickers from both models
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Here is your stickers.',
      data: uniqueStickers,
    });
  });