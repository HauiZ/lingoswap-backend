import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lingoswap/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  }
});

const uploadImage = multer({ storage: storage });

export { uploadImage };
