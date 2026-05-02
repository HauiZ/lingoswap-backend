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
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
  }
);

friendshipSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

const Friendship = mongoose.model('Friendship', friendshipSchema);

export default Friendship;
