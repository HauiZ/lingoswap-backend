// src/models/Language.js - Schema quản lý danh mục ngôn ngữ
import mongoose from 'mongoose';

const languageSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      lowercase: true,
      maxLength: 10 // 'en', 'vi', 'ja', 'en-us'
    }, 
    name: { 
      type: String, 
      required: true, 
      trim: true 
    }, // 'English', 'Vietnamese'
    iconCode: { 
      type: String, // Cờ (Flag icon emoji/code) hoặc URL image
      trim: true 
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

const Language = mongoose.model('Language', languageSchema);

export default Language;
