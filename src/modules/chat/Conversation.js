import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    matchSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MatchSession'
    }, // Sinh ra từ phiên call nào? (có thể null nếu chat bạn bè cũ)
    isPermanent: {
      type: Boolean,
      default: false
    }, // Chuyển thành True khi 2 users trở thành 'accepted' Friends
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

// Index tìm kiếm user's conversations
conversationSchema.index({ participants: 1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
