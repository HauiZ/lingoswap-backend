// src/models/MatchSession.js - Schema phiên ghép cặp và gọi Video
import mongoose from 'mongoose';

const matchSessionSchema = new mongoose.Schema(
  {
    participants: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }], // Mảng 2 người dùng
    suggestedTopic: { 
      type: String,
      trim: true
    }, // Chủ đề gợi ý của phiên
    status: { 
      type: String, 
      enum: ['finding', 'matched', 'ongoing', 'completed', 'cancelled'],
      default: 'finding'
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

// Index tìm kiếm participant trong các phiên
matchSessionSchema.index({ participants: 1 });
matchSessionSchema.index({ status: 1 });

const MatchSession = mongoose.model('MatchSession', matchSessionSchema);

export default MatchSession;
