// src/models/Report.js - Schema báo cáo vi phạm
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporterId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    reportedUserId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    matchSessionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'MatchSession' 
    }, 
    conversationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Conversation' 
    },
    
    reason: { 
      type: String, 
      required: true,
      trim: true
    },
    
    // Các tin nhắn vi phạm làm bằng chứng
    evidenceMessageIds: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Message' 
    }], 
    
    status: { 
      type: String, 
      enum: ['pending', 'investigating', 'resolved', 'dismissed'], 
      default: 'pending' 
    },
    adminNotes: { 
      type: String 
    }, // Ghi chú lưu lại của mod giải quyết
    resolvedByAdminId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }
  },
  {
    timestamps: true,
  }
);

// Để admin dễ lấy danh sách theo tình trạng
reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
