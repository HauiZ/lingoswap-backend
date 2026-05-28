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
        'friend_rejected',       // Lời mời kết bạn bị từ chối
        'report_new',            // Admin: có report mới
        'account_banned',        // User bị khóa tài khoản
        'account_unbanned',      // User được mở khóa tài khoản
        'system',                // Thông báo hệ thống chung
        'report_handled',        // Admin: báo cáo đã được xử lý
        'friendship_ended',      // Bạn bè hủy kết bạn
        'responsed_friend_request', // Đã trả lời yêu cầu kết bạn
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
