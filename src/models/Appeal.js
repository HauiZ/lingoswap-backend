import mongoose from 'mongoose';

const appealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    resolvedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Mỗi user chỉ được phép có 1 đơn pending cùng lúc
appealSchema.index({ userId: 1, status: 1 });

const Appeal = mongoose.model('Appeal', appealSchema);

export default Appeal;
