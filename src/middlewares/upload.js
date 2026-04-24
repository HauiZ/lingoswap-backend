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

const uploadAvatar = multer({ storage: storage });

const chatImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lingoswap/chat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }]
  }
});

const uploadChatImage = multer({
  storage: chatImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

export { uploadAvatar, uploadChatImage };
