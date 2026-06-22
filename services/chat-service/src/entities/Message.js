import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Loại tin nhắn rất quan trọng để build giao diện
    type: {
      type: String,
      enum: ['text', 'image', 'system', 'game_taboo', 'game_canvas_draw'],
      default: 'text'
    },

    // Có thể lưu text hoặc URL Image/Data Canvas
    content: {
      type: String,
      required: true
    },

    // Trạng thái hiển thị (Real-time tracking)
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },

    // Tính năng sửa chính tả & gợi ý AI
    grammarCorrection: {
      isCorrected: { type: Boolean, default: false },
      correctedText: { type: String },
      explanation: { type: String }
    }
  },
  {
    timestamps: true,
  }
);

// Index để load tin nhắn theo thời gian (cũ nhất / mới nhất) trong 1 phòng
messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
