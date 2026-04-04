import mongoose from 'mongoose';

const matchSessionSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    language: {
      type: String,
      required: true
    },
    suggestedTopic: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['finding', 'matched', 'ongoing', 'completed', 'cancelled'],
      default: 'matched'
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

// Thêm Middleware để tự động tính durationSeconds khi kết thúc
matchSessionSchema.pre('save', function (next) {
  if (this.status === 'completed' && this.startedAt && this.endedAt) {
    this.durationSeconds = Math.round((this.endedAt - this.startedAt) / 1000);
  }
  next();
});

const MatchSession = mongoose.model('MatchSession', matchSessionSchema);
export default MatchSession;