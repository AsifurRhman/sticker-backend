import stripe from 'stripe';
import jwt from 'jsonwebtoken';
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import sendError from "../../utils/sendError.js";

import httpStatus from 'http-status';
import { UserModel } from '../user/user.model.js';
import { Sticker } from '../stickers/stickers.model.js';
import { PaymentModel } from './payment.model.js';
import { emitNotification } from '../../utils/socket.js';
import { findTransactionById, getAllPaymentFromDB, getPaymentFromDB } from './payment.service.js';
import { findStickerById } from '../stickers/stickers.service.js';
import { findUserById } from '../user/user.service.js';
import { formatDate } from './paymnet.utils.js';


const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);




export const paymentCreate = catchAsync(async (req, res) => {
    try {
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

        // const { stickerIds, stripeToken, amount,transactionId } = req.body; // Accept amount from body
        const { stickerIds, amount, transactionId } = req.body; // Accept amount from body
        console.log(req.body,"payment create")
        if (!transactionId) {
            return sendError(res, httpStatus.UNAUTHORIZED, {
                message: 'Failed to purchase!',
            });
}
        // Fetch the user by ID
        const user = await UserModel.findById(userId);
        if (!user) {
            return sendError(res, httpStatus.NOT_FOUND, {
                message: 'User not found.',
            });
        }

        // Check if the user already has a promo code
        if (user.promoCode) {
            return sendResponse(res, {
                success: true,
                statusCode: httpStatus.OK,
                message: 'All stickers are free for you because you used a promo code!',
            });
        }

        // Validate stickerIds (it should be an array)
        if (!Array.isArray(stickerIds) || stickerIds.length === 0) {
            return sendError(res, httpStatus.BAD_REQUEST, {
                message: 'Sticker IDs are required and should be an array.',
            });
        }

        // Fetch stickers by IDs (only to validate they exist, not to calculate the price)
        const stickers = await Sticker.find({ _id: { $in: stickerIds } });
        if (stickers.length !== stickerIds.length) {
            return sendError(res, httpStatus.NOT_FOUND, {
                message: 'One or more stickers not found.',
            });
        }

        // Proceed with payment if no promo code is found
        // const customer = await stripeInstance.customers.create({
        //     source: stripeToken,
        // });

        // Use the amount from the request body for the Stripe charge
        // const charge = await stripeInstance.charges.create({
        //     amount: amount * 100, // Assuming the amount is in USD dollars, multiply by 100 for cents
        //     currency: 'usd',
        //     customer: customer.id,
        //     description: 'Payment for sticker purchase',
        // });

        // if (charge.status !== 'succeeded') {
        //     return sendError(res, httpStatus.BAD_REQUEST, {
        //         message: 'Payment failed.',
        //     });
        // }

        // Create a new payment record
        const paymentData = {
            transactionId,
            userId: user._id,
            stickerId: stickerIds, // Store the array of sticker IDs
            amount, // Converting back to dollars
            date: new Date().toISOString().split('T')[0],
            status: 'completed',
            isCompleted: true,
        };

        const newPayment = await PaymentModel.create(paymentData);

        // Emit notifications after successful payment
        const stickersNames = stickers.map(sticker => sticker.name).join(', ');
        await emitNotification({
            userId: user._id,
            userMsg: `You successfully purchased the stickers: "${stickersNames}"!`,
            adminMsg: `${user.name} purchased the stickers: "${stickersNames}" and the transaction ID is : "${transactionId}".`,
        });

        return sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Payment completed successfully!',
            data: newPayment,
        });

    } catch (error) {
        console.error('Error during payment processing:', error);
        return sendError(res, httpStatus.INTERNAL_SERVER_ERROR, {
            message: `Internal server error: ${error.message}`,
        });
    }
});



export const getAllPayment = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1
    const limit = parseInt(req.query.limit, 10) || 5; // Default to limit of 5
    const { name, date } = req.query; // Destructure name and date from query parameters

    // Get the result from the database
    const result = await getAllPaymentFromDB(page, limit, name, date); // Pass date instead of startDate and endDate
    //console.log(result, "result");

    if (result.data.length === 0) {
        return sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'No data available for the requested filters.',
            data: {
                payments: [],
                currentPage: page,
                totalPages: Math.ceil(result.total / limit),
                totalPayments: result.total
            }
        });
    }

    // Send successful response
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Payments retrieved successfully.',
        data: {
            payments: result.data.map(payment => ({
                ...payment, // Already a plain object from aggregation
                userName: payment.userDetails.name, // The name from the populated user details
                date: formatDate(payment.date) // Format the date
            })),
            currentPage: page,
            totalPages: Math.ceil(result.total / limit),
            totalPayments: result.total,
            currentPagePayments: result.data.length // Number of items on the current page
        }
    });
});



export const getPayment = catchAsync(async (req, res) => {
    // Fetch all payment data from the database without any filtering or pagination
    const result = await getPaymentFromDB(); // Fetch all records from the database

    if (!result.data || result.data.length === 0) {
        return sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'No payment data available.',
            data: {
                payments: [],
                totalPayments: 0
            }
        });
    }

    // Send successful response with all payment data
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'All payments retrieved successfully.',
        data: {
            payments: result.data.map(payment => ({
                ...payment, // Already a plain object from aggregation
                userName: payment.userDetails.name, // The name from the populated user details
                date: formatDate(payment.date) // Format the date
            })),
            totalPayments: result.total, // Total number of payments
        }
    });
});





export const getSingleTransaction = catchAsync(async (req, res) => {
    const transactionId = req.query?.id;
    const transaction = await findTransactionById(transactionId);
  
    if (!transaction) {
      return sendError(res, httpStatus.NOT_FOUND, {
        message: 'Transaction not found.',
      });
    }
  
    // Fetch user details
    const user = await findUserById(transaction.userId);
    const name = user.name 
    const email = user.email
    const address = user?.address
    const phone = user?.phone
    // Fetch sticker details
    const sticker = await findStickerById(transaction.stickerId);
    const stickerName = sticker.name 
  
    // Prepare response data
    const responseData = {
        name,
        email,
        address,
        phone,
        stickerName,
        date: transaction.date,
        transactionId: transaction.transactionId,
        amount: transaction.amount
      };
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Transaction retrieved successfully.',
      data: responseData,
    });
  });