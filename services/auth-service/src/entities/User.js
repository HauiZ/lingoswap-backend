import mongoose from 'mongoose';

/**
 * User schema cho Auth Service.
 * Chỉ chứa các fields liên quan đến authentication.
 * Profile đầy đủ (stats, settings, bio...) được quản lý bởi User Service.
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
    }, // Nullable nếu đăng nhập qua OAuth

    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local',
    },
    providerId: { type: String }, // ID của Google/Facebook

    // Thông tin profile tối thiểu (cần cho token response và email)
    profile: {
      fullName: { type: String, required: true, trim: true },
      avatar:   { type: String, default: 'default_avatar.png' },
      country:  { type: String },
    },

    role:          { type: String, enum: ['user', 'admin'], default: 'user' },
    statusAccount: { type: String, enum: ['active', 'warned', 'banned'], default: 'active' },
    bannedUntil:   { type: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });

// Tránh trả về password khi query
userSchema.methods.toJSON = function () {
  const { password, providerId, ...userWithoutPrivateData } = this.toObject();
  return userWithoutPrivateData;
};

const User = mongoose.model('User', userSchema);

export default User;
