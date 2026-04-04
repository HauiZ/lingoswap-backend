// src/models/User.js - Schema User cho MongoDB
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      minlength: 6,
    }, // Nullable nếu đăng nhập qua MXH
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local'
    },
    providerId: { type: String }, // Lưu ID của Google/Facebook

    // Hồ sơ cá nhân
    profile: {
      fullName: { type: String, required: true, trim: true },
      avatar: { type: String, default: 'default_avatar.png' },
      bio: { type: String, maxLength: 500, default: '' },
      language: { type: String, required: true }, // VD: 'vi', 'en'
      proficiencyLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        required: true
      }
    },

    status: {
      type: String,
      enum: ['offline', 'online', 'waiting', 'in-call'],
      default: 'offline'
    },

    // Cấu hình cá nhân
    settings: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      uiLanguage: { type: String, default: 'en' }
    },

    // Thống kê & Gamification
    stats: {
      streak: { type: Number, default: 0 }, // Chuỗi ngày online
      totalHours: { type: Number, default: 0 }, // Tổng giờ chat/video
      totalSessions: { type: Number, default: 0 } // Số phiên matching
    },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'warned', 'banned'], default: 'active' },

    lastOnlineAt: { type: Date }
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Index để tìm kiếm nhanh
userSchema.index({ email: 1 });
userSchema.index({ 'profile.nativeLanguage': 1, 'profile.targetLanguage': 1 }); // Phục vụ matching
userSchema.index({ status: 1 });

// Tránh trả về password và provider dữ liệu nội bộ khi query
userSchema.methods.toJSON = function () {
  const { password, providerId, ...userWithoutPrivateData } = this.toObject();
  return userWithoutPrivateData;
};

const User = mongoose.model('User', userSchema);

export default User;
