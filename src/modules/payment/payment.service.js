import { PaymentModel } from "./payment.model.js";


export const getAllPaymentFromDB = async (page, limit, name, date) => {
    const skip = (page - 1) * limit;

    // Create query filter object for a specific date range
    const dateFilter = {};
    if (date) {
        // Create start and end of the day
        const startOfDay = new Date(date);
        const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999));

        dateFilter.date = {
            $gte: startOfDay,
            $lt: endOfDay
        }; // Filter by date range
    }
  

    // Create aggregation pipeline
    const pipeline = [
        {
            $match: dateFilter // Apply the date filter
        },
        {
            $lookup: {
                from: 'users', // Name of the user collection
                localField: 'userId', // Field from PaymentModel
                foreignField: '_id', // Field from User model
                as: 'userDetails' // Output the user details
            }
        },
        {
            $unwind: '$userDetails' // Unwind the array of user details
        }
    ];

    // If name is provided, add a match stage to filter by name
    if (name) {
        pipeline.push({
            $match: { 'userDetails.name': new RegExp(name, 'i') } // Filter by name, case-insensitive
        });
    }

    // Add sorting, skipping, and limiting
    pipeline.push(
        { $sort: { 
            createdAt: -1 } }, // Sort by date in descending order (newest first)
        { $skip: skip }, // Pagination: skip to the correct page
        { $limit: limit } // Pagination: limit the number of results
    );

    // Perform the aggregation
    const payments = await PaymentModel.aggregate(pipeline).exec();

    // Get the total count of matching documents
    const total = await PaymentModel.aggregate([
        {
            $match: dateFilter // Apply the date filter
        },
        {
            $lookup: {
                from: 'users', // Lookup from users
                localField: 'userId',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        {
            $unwind: '$userDetails'
        },
        ...(name ? [{ $match: { 'userDetails.name': new RegExp(name, 'i') } }] : []),
        {
            $count: 'total' // Count total matching documents
        }
    ]).exec();

    return {
        data: payments,
        total: total[0]?.total || 0 // Return the count or 0 if none
    };
};


export const getPaymentFromDB = async () => {
    // Create aggregation pipeline to fetch all payment data
    const pipeline = [
        {
            $lookup: {
                from: 'users', // Name of the user collection
                localField: 'userId', // Field from PaymentModel
                foreignField: '_id', // Field from User model
                as: 'userDetails' // Output the user details
            }
        },
        {
            $unwind: '$userDetails' // Unwind the array of user details
        },
        {
            $sort: { createdAt: -1 } // Sort by createdAt in descending order (newest first)
        }
    ];

    // Perform the aggregation to get all results without filtering
    const payments = await PaymentModel.aggregate(pipeline).exec();

    // Get the total count of all documents
    const total = await PaymentModel.countDocuments().exec();

    return {
        data: payments,
        total // Return the total number of documents
    };
};



export const findTransactionById = async (id) => {

    return PaymentModel.findById(id);
  };