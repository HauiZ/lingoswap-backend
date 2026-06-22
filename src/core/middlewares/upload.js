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

const evidenceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lingoswap/Evidence',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  }
});

const uploadEvidenceImage = multer({
  storage: evidenceStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for evidence
});

export { uploadImage, uploadChatImage, uploadEvidenceImage };
