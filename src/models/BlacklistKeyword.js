// src/models/BlacklistKeyword.js - Schema danh sách từ cấm/lọc
import mongoose from 'mongoose';

const blacklistKeywordSchema = new mongoose.Schema(
  {
    keyword: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }, // ID Admin thêm từ này
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  {
    timestamps: true,
  }
);

const BlacklistKeyword = mongoose.model('BlacklistKeyword', blacklistKeywordSchema);

export default BlacklistKeyword;
