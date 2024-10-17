import bcrypt from 'bcrypt';


import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer";
import catchAsync from '../../utils/catchAsync.js';
import sendError from '../../utils/sendError.js';
import sendResponse from '../../utils/sendResponse.js';
import {
  createUser,

  findUserByEmail,
  findUserById,
  getDashboardStats,

  getUserList,
  getYearlyEarnings,
  updateUserById,

} from './user.service.js';
import { generateOTP, generateToken, getStoredOTP, getUserRegistrationDetails, hashPassword, saveOTP, sendOTPEmail } from './user.utils.js';
import { validateUserInput } from './user.validation.js';
import { OTPModel, PendingUserModel, UserModel } from './user.model.js';
import { NotificationModel } from '../notification/notification.model.js';
import { emitNotification, emitNotificationForChangeUserRole } from '../../utils/socket.js';




export const registerUser = catchAsync(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Validate user input
  const validationError = validateUserInput(name, email, password);
  if (validationError) {
    return sendError(res, httpStatus.BAD_REQUEST, validationError);
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Passwords do not match',
    });
  }

  // Check if the user is already registered
  const isUserRegistered = await findUserByEmail(email);
  if (isUserRegistered) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'You already have an account.',
    });
  }

  // Save user registration details temporarily
  await PendingUserModel.findOneAndUpdate(
    { email },
    { name, email, password, confirmPassword },
    { upsert: true }
  );

  // Generate OTP and save it
  const otp = generateOTP();
  await saveOTP(email, otp);

  // Send OTP to the user's email
  await sendOTPEmail(email, otp);

  // Generate a token with the email for future steps
  const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, {
    expiresIn: '7d', 
  });

 

  

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP sent to your email. Please verify to continue registration.',
    data:  { token: token } , // Send the token back
  });
});

export const resendOTP = catchAsync(async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'No token provided or invalid format.',
    });
  }

  const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const email = decoded.email;

  // Validate email
  if (!email) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Please provide a valid email address.',
    });
  }

  // Check if the user exists in PendingUserModel
  const pendingUser = await PendingUserModel.findOne({ email });
  if (!pendingUser) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'No pending registration found for this email.',
    });
  }

  // Generate new OTP
  const newOTP = generateOTP();

  // Save the new OTP
  await saveOTP(email, newOTP);

  // Send the new OTP to the user's email
  await sendOTPEmail(email, newOTP);



  // Send response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'A new OTP has been sent to your email.',
    data: { token },
  });
});

export const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;
//console.log(email)
  const user = await findUserByEmail(email);
//console.log(user)
  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'This account does not exist.',
    });
  }
  
  
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
//console.log(isPasswordValid,"password")

  if (!isPasswordValid) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'wrong password!.',
    });
  }

  const token = generateToken({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user?.image
  });

  

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Login complete!',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user?.image
      },
      token,
    },
  });
});


export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Please provide an email.',
    });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'This account does not exist.',
    });
  }

  // Generate OTP
  const otp = generateOTP(); // You might already have a function for this

  // Save the OTP (overwrite if it already exists)
  await saveOTP(email, otp);

  // Generate JWT Token
  const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, {
    expiresIn: '7d',
  });

  // Send OTP to the user's email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
      user: process.env.Nodemailer_GMAIL,
      pass: process.env.Nodemailer_GMAIL_PASSWORD,
    },
  });

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0f0f0; padding: 20px;">
      <h1 style="text-align: center; color: #d3b06c; font-family: 'Times New Roman', Times, serif;">
        P<span style="color:#231f20; font-size: 0.9em;">moji</span>
      </h1>
      <div style="background-color: white; padding: 20px; border-radius: 5px;">
        <h2 style="color:#d3b06c">Hello!</h2>
        <p>You are receiving this email because we received a password reset request for your account.</p>
        <div style="text-align: center; margin: 20px 0;">
          <h3>Your OTP is: <strong>${otp}</strong></h3>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request a password reset, no further action is required.</p>
        <p>Regards,<br>Pmoji</p>
      </div>
      <p style="font-size: 12px; color: #666; margin-top: 10px;">If you're having trouble copying the OTP, please try again.</p>
    </div>
  `;

  const receiver = {
    from: "khansourav58@gmail.com",
    to: email,
    subject: "Reset Password OTP",
    html: emailContent,
  };

  await transporter.sendMail(receiver);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent to your email. Please check!",
    data: {
      token:token, // Include the token in the response
    },
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'No token provided or invalid format.',
    });
  }
  
  const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
  const { password, confirmPassword } = req.body;
//console.log(password, confirmPassword)
  // Check if both password and confirmPassword are provided
  if (!password || !confirmPassword) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Please provide both password and confirmPassword.',
    });
  }

  // Check if password and confirmPassword match
  if (password !== confirmPassword) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Passwords do not match.',
    });
  }

  // Verify the token and decode the email
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const user = await findUserByEmail(decoded.email);
//console.log(user)
  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'User not found.',
    });
  }

  // Hash the new password and update the user's password
  const newPassword = await hashPassword(password);
  user.password = newPassword;
  await user.save();

  // Send success response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset successfully.',
    data: null,
  });
});


// verify otp for create user account
export const verifyOTP = catchAsync(async (req, res) => {
  const { otp } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'No token provided or invalid format.',
    });
  }

  const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const email = decoded.email;

  // Retrieve the OTP from where you stored it
  const storedOTP = await getStoredOTP(email);

  if (!storedOTP || storedOTP !== otp) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Invalid or expired OTP',
    });
  }

  // OTP is valid, now retrieve user registration details
  const { name, password } = await getUserRegistrationDetails(email);

  // Hash the password and create the user
  const hashedPassword = await hashPassword(password);

  const { createdUser } = await createUser({
    name,
    email,
    hashedPassword,
  });

  // Define the messages
  const userMsg = 'Welcome to Pmojis App.';
  const adminMsg = `${name} has successfully registered.`;

  // Call emitNotification to send notifications
  await emitNotification({
    userId: createdUser._id,
    userMsg,
    adminMsg
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Registration successful.',
    data: null,
  });
});


//verify otp for forget password & change password
export const verifyForgotPasswordOTP = catchAsync(async (req, res) => {
  const { otp } = req.body;
 // console.log(otp,"otp")
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'No token provided or invalid format.',
    });
  }

  const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const email = decoded.email;

  // Retrieve the OTP record for the provided email
  const otpRecord =  await OTPModel.findOne({ email });
  //console.log(otpRecord,"otp record")
  

  // Check if OTP record exists
  if (!otpRecord) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'user not found!',
    });
  }

  // Check if the OTP has expired
  const currentTime = new Date();
  if (otpRecord.expiresAt < currentTime) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'OTP has expired',
    });
  }

  // Check if the provided OTP matches the stored one
  if (otpRecord.otp !== otp) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'wrong OTP',
    });
  }

  // OTP is valid and not expired
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP verified successfully.',
    data: null,
  });
});


export const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
//console.log(req.body)
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'No token provided or invalid format.',
    });
  }
  
  const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
//console.log(token,"token")
  // Validate input fields
  if (!oldPassword || !newPassword || !confirmPassword) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Please provide old password, new password, and confirm password.',
    });
  }

  // Decode the token to get the email
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const email = decoded.email;
//console.log(email,"email")
  // Find the user by email
  const user = await findUserByEmail(email);
  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'User not found.',
    });
  }

  // Check if the old password is correct
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'Old password is incorrect.',
    });
  }
//console.log(isMatch,"isMatch")
  // Check if new password and confirm password match
  if (newPassword !== confirmPassword) {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'New password and confirm password do not match.',
    });
  }

  // Hash the new password and update the user's password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedNewPassword;
  await user.save();

  // Send success response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'You have successfully changed the password.',
    data: null,
  });
});


//profile  update
export const updateUser = catchAsync(async (req, res) => {
  const { name, phone, address } = req.body;
          
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

  // Prepare the update data
  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;

  // Handle the image file (multer stores the file in req.file)
  if (req.file) {
    const imagePath = `public\\images\\${req.file.filename}`; // Assuming multer stores the file in public/images folder
    const publicFileURL = `/images/${req.file.filename}`; // Public URL for accessing the image

    updateData.image = {
      path: imagePath,
      publicFileURL: publicFileURL
    };
 
  }

  // Update the user
  const updatedUser = await updateUserById(userId, updateData);
 
  if (updatedUser) {
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Profile updated.',
      data: null,
    });
  }
});


export const getUserInfo = catchAsync(async (req, res) => {
  if (req.user.role !== "admin") {
    return sendError(res, httpStatus.FORBIDDEN, {
      message: "Only admin can access all user list.",
    });
  }

  let page = parseInt(req?.query?.page) || 1;
  const limit = parseInt(req?.query?.limit) || 10;
  const skip = (page - 1) * limit;
  const date = req?.query?.date;
  const name = req?.query?.name;
  const email = req?.query?.email;

  // Handle nextPage and previousPage parameters
  if (req.query.nextPage) {
    page += 1; // Go to the next page
  } else if (req.query.previousPage) {
    page = Math.max(1, page - 1); // Go to the previous page, but not below page 1
  }

  // Calculate skip based on the updated page
  const updatedSkip = (page - 1) * limit;

  const { users, totalUsers, totalPages } = await getUserList(
    req.user.id,
    updatedSkip,
    limit,
    date,
    name,
    email,
  
  );

  if (users.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "No data available for the requested page",
      data: {
        users,
        currentPage: page,
        totalPages,
        totalUsers,
        currentPageUsers: users.length,
      },
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User information retrieved successfully",
    data: {
      users,
      currentPage: page,
      totalPages,
      totalUsers,
      currentPageUsers: users.length,
    },
  });
});





export const getSelfInfo = catchAsync(async (req, res) => {
  
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

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User information retrieved successfully",
    data: { information: user },
  });
});



// Change user role controller
export const changeUserRole = catchAsync(async (req, res) => {
  const { userId, newRole } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'No token provided or invalid format.',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const adminId = decoded.id;

  // Check if the requesting user is an admin
  const requestingUser = await UserModel.findById(adminId);

  if (!requestingUser || requestingUser.role !== 'admin') {
    return sendError(res, httpStatus.FORBIDDEN, {
      message: 'Unauthorized: Only admins can change user roles.',
    });
  }

  // Find the user whose role is being changed
  const user = await UserModel.findById(userId);
  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'User not found.',
    });
  }

  // Handle demotion of admin to user
  if (user.role === 'admin' && newRole === 'user') {
    user.role = 'user';
    await user.save();

    const userMsg = 'Your role has been changed from admin to user.';
    await emitNotificationForChangeUserRole({
      userId,
      userMsg,
    });

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admin demoted to user successfully.',
      data: null,
    });
  }

  // Handle promotion of user to admin
  if (user.role === 'user' && newRole === 'admin') {
    user.role = 'admin';
    await user.save();

    const userMsg = 'Your role has been changed to admin.';
    await emitNotificationForChangeUserRole({
      userId,
      userMsg,
    });

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User promoted to admin successfully.',
      data: null,
    });
  }

  // Handle case where user is already an admin
  if (user.role === 'admin' && newRole === 'admin') {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'User is already an admin.',
    });
  }

  // Handle case where user is already a regular user
  if (user.role === 'user' && newRole === 'user') {
    return sendError(res, httpStatus.BAD_REQUEST, {
      message: 'The account owner is already a user.',
    });
  }

  // This point should not be reached under normal circumstances
  return sendError(res, httpStatus.BAD_REQUEST, {
    message: 'Invalid role change request.',
  });
});


//get dashboard stats
export const getDashboardInfo = catchAsync(async (req, res) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'No token provided or invalid format.',
    });
  }

  const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
  
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (error) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'Invalid token.',
    });
  }
  
  const userId = decoded.id; // Assuming the token contains the userId

  // Find the user by userId
  const user = await findUserById(userId);
  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'User not found.',
    });
  }

  // Check if the user is an admin
  if (user.role !== "admin") {
    return sendError(res, httpStatus.FORBIDDEN, {
      message: "Only admin can access dashboard information.",
    });
  }

  const stats = await getDashboardStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard information retrieved successfully",
    data: stats,
  });
});

export const getEarningsInfo = catchAsync(async (req, res) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'No token provided or invalid format.',
    });
  }

  const token = authHeader.split(' ')[1]; // Get the token part from the 'Bearer <token>'
  
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (error) {
    return sendError(res, httpStatus.UNAUTHORIZED, {
      message: 'Invalid token.',
    });
  }

  const userId = decoded.id; // Assuming the token contains the userId

  // Find the user by userId (you can implement findUserById in your user.service.js)
  const user = await findUserById(userId);
  if (!user) {
    return sendError(res, httpStatus.NOT_FOUND, {
      message: 'User not found.',
    });
  }

  // Check if the user is an admin
  if (user.role !== "admin") {
    return sendError(res, httpStatus.FORBIDDEN, {
      message: "Only admin can access dashboard information.",
    });
  }

  // Get the year from query parameters or default to the current year
  const year = req.query.year || new Date().getFullYear();

  // Retrieve the earnings for the specified year
  const earnings = await getYearlyEarnings(year);

  // Send response back with earnings
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard information retrieved successfully",
    data: {
      year,
      earnings,
    },
  });
});
