// src/models/UserReview.js - Schema đánh giá sau phiên học
import mongoose from 'mongoose';

const userReviewSchema = new mongoose.Schema(
  {
    reviewerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    targetUserId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    matchSessionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'MatchSession', 
      required: true 
    },
    rating: { 
      type: Number, 
      min: 1, 
      max: 5, 
      required: true 
    }, // Số sao (1-5)
    comment: { 
      type: String, 
      maxLength: 1000,
      trim: true
    }
  },
  {
    timestamps: true,
  }
);

// Một user chỉ được review mapping 1 session với 1 người 1 lần
userReviewSchema.index({ reviewerId: 1, targetUserId: 1, matchSessionId: 1 }, { unique: true });
// Dễ dàng tính sao trung bình của 1 user
userReviewSchema.index({ targetUserId: 1, rating: 1 });

const UserReview = mongoose.model('UserReview', userReviewSchema);

export default UserReview;
