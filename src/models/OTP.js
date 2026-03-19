// src/models/OTP.js - Schema quản lý mã xác thực
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true,
      lowercase: true,
      trim: true
    },
    otpCode: { 
      type: String, 
      required: true 
    },
    type: { 
      type: String, 
      enum: ['register', 'forgot_password'], 
      required: true 
    },
    expiresAt: { 
      type: Date, 
      required: true 
    },
    isUsed: { 
      type: Boolean, 
      default: false 
    }
  },
  {
    timestamps: true,
  }
);

// Tự động xóa document sau khi hết hạn (TTL Index) 
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Document sẽ bị xóa khi current time >= expiresAt

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
