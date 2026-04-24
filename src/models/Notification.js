import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    type: {
      type: String,
      enum: [
        'friend_request',        // Nhận lời mời kết bạn
        'friend_accepted',       // Lời mời kết bạn được chấp nhận
        'report_new',            // Admin: có report mới
        'account_banned',        // User bị khóa tài khoản
        'account_unbanned',      // User được mở khóa tài khoản
        'system'                 // Thông báo hệ thống chung
      ],
      required: true
    },

    content: {
      type: String,
      required: true
    },

    // Dữ liệu đính kèm để Frontend navigate đến đúng chỗ
    metadata: {
      friendshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Friendship' },
      reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' }
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
