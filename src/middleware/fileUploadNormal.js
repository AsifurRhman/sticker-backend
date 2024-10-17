import multer from 'multer';
import path from 'path';

import createHttpError from 'http-errors';
import sharp from 'sharp';
import fs from 'fs';


const UPLOAD_PATH = process.env.UPLOAD_FOLDER|| 'public/images';
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 5242880) || 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
];

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(UPLOAD_PATH,"uploading")
    cb(null, UPLOAD_PATH);
  },
  filename: function (req, file, cb) {
    const extName = path.extname(file.originalname);
    console.log('extName: ', extName);
    
    const fileName = `${Date.now()}-${file.originalname.replace(extName, '')}${extName}`;
    req.body.image = fileName;
    cb(null, fileName);
  },
});

export const fileFilter = function (req, file, cb) {
  let extName = path.extname(file.originalname).toLowerCase();
  const isAllowedFileType = ALLOWED_FILE_TYPES.includes(extName);
  if (!isAllowedFileType) {
    return cb(createHttpError(400, 'File type not allowed'));
  }

  cb(null, true);
};



// Multer upload configuration
export const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
  });

