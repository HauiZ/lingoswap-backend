// src/models/Friendship.js - Schema trạng thái mối quan hệ, kết bạn
import mongoose from 'mongoose';

const friendshipSchema = new mongoose.Schema(
  {
    requesterId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    recipientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'accepted', 'blocked', 'rejected'], 
      default: 'pending' 
    }
  },
  {
    timestamps: true,
  }
);

// Đảm bảo mỗi cặp người dùng chỉ có 1 bản ghi friendship (không phân biệt chiều)
// Lưu ý: Cần xử lý logic cẩn thận ở controller để giữ tính toàn vẹn này
friendshipSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

const Friendship = mongoose.model('Friendship', friendshipSchema);

export default Friendship;
