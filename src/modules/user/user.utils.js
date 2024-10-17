import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { OTPModel, PendingUserModel } from './user.model.js';

import { parse, formatISO, startOfDay, endOfDay, isValid } from 'date-fns';


export const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

export const generateToken = (payload) => {
  const expiresIn = '7d'; // 7 days expire
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn });
};



export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.Nodemailer_GMAIL,
      pass: process.env.Nodemailer_GMAIL_PASSWORD,
    },
  });

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0f0f0; padding: 20px;">
      <h1 style="text-align: center; color: #d3b06c; font-family: 'Times New Roman', Times, serif;">
        P <span style="color:#231f20; font-size: 0.9em;">moji</span>
      </h1>
      <div style="background-color: white; padding: 20px; border-radius: 5px;">
        <h2 style="color:#d3b06c">Hello!</h2>
        <p>You are receiving this email because we received a login verification request for your account.</p>
        <div style="text-align: center; margin: 20px 0;">
          <p style="font-size: 24px; font-weight: bold; color: #d3b06c;">Your OTP: <span style="color: #231f20;">${otp}</span></p>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
        <p>Regards,<br>Pmoji</p>
      </div>
      <p style="font-size: 12px; color: #666; margin-top: 10px;">This is an automated message, please do not reply.</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.Nodemailer_GMAIL,
    to: email,
    subject: 'Verify your email',
    html: emailContent
  };

  await transporter.sendMail(mailOptions);
};


export const saveOTP = async (email, otp) => {
  await OTPModel.findOneAndUpdate(
    { email },
    { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    { upsert: true }
  );
};

export const getStoredOTP = async (email) => {
  const otpEntry = await OTPModel.findOne({ email });
  return otpEntry ? otpEntry.otp : null;
};


export const getUserRegistrationDetails = async (email) => {
  const pendingUser = await PendingUserModel.findOne({ email });

  if (!pendingUser) {
    throw new Error('No pending registration found for this email');
  }

  return {
    name: pendingUser.name,
    password: pendingUser.password,
  };
};
export const formatDate = (date) => {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(date).toLocaleDateString('en-GB', options);
};




export const convertDateToISO = (dateString) => {
  // Define the format of the input date string
  const dateFormat = 'd MMMM yyyy'; // '5 September 2024'

  // Parse the date string to a Date object
  const date = parse(dateString, dateFormat, new Date());

  // Convert the Date object to ISO format
  return formatISO(date, { representation: 'date' });
};

export const convertDateToISODB = (dateString) => {
  // Try parsing with multiple date formats (or ensure your input matches the format)
  const formats = ['d MMMM yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy']; // Add as needed
  let parsedDate;

  for (const format of formats) {
    parsedDate = parse(dateString, format, new Date());
    if (isValid(parsedDate)) break; // Stop when valid date is found
  }

  if (!isValid(parsedDate)) throw new Error('Invalid date format');

  // Convert the parsed date to ISO
  return formatISO(parsedDate, { representation: 'date' });
};
