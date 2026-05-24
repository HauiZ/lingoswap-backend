// tests/unit/auth.service.test.js
import * as dbHandler from '../dbHandler.js';
import authService from '../../src/modules/auth/auth.service.js';
import User from '../../src/modules/users/User.js';
import OTP from '../../src/modules/auth/OTP.js';
import jwt from 'jsonwebtoken';
import env from '../../src/core/config/env.js';

// Mock các dịch vụ ngoài
jest.mock('ioredis');
jest.mock('../../src/core/utils/sendEmail.js', () => {
  return jest.fn().mockResolvedValue(true);
});

describe('Unit Test: Auth Service', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clear());
  afterAll(async () => await dbHandler.close());

  const mockUserPayload = {
    email: 'testauth@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    fullName: 'Test Auth User',
    country: 'Vietnam'
  };

  describe('register()', () => {
    test('Nên đăng ký tài khoản mới thành công', async () => {
      const user = await authService.register(mockUserPayload);
      expect(user).toBeDefined();
      expect(user.email).toBe(mockUserPayload.email.toLowerCase());
      expect(user.profile.fullName).toBe(mockUserPayload.fullName);
      expect(user.password).not.toBe(mockUserPayload.password); // Mật khẩu đã được băm
    });

    test('Nên báo lỗi khi thiếu thông tin đăng ký', async () => {
      await expect(
        authService.register({
          email: 'missing@example.com',
          password: 'Password123!'
        })
      ).rejects.toThrow('Vui lòng cung cấp đầy đủ thông tin bắt buộc');
    });

    test('Nên báo lỗi khi email sai định dạng', async () => {
      await expect(
        authService.register({
          ...mockUserPayload,
          email: 'invalid-email'
        })
      ).rejects.toThrow('Email không hợp lệ');
    });

    test('Nên báo lỗi khi mật khẩu yếu', async () => {
      await expect(
        authService.register({
          ...mockUserPayload,
          password: '123'
        })
      ).rejects.toThrow('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
    });

    test('Nên báo lỗi khi mật khẩu không khớp', async () => {
      await expect(
        authService.register({
          ...mockUserPayload,
          confirmPassword: 'MismatchPassword1!'
        })
      ).rejects.toThrow('Mật khẩu không khớp');
    });

    test('Nên báo lỗi khi email đã tồn tại', async () => {
      await authService.register(mockUserPayload);
      await expect(authService.register(mockUserPayload)).rejects.toThrow('Email đã được sử dụng');
    });
  });

  describe('login()', () => {
    beforeEach(async () => {
      await authService.register(mockUserPayload);
    });

    test('Nên đăng nhập thành công với mật khẩu đúng', async () => {
      const user = await authService.login({
        email: mockUserPayload.email,
        password: mockUserPayload.password
      });
      expect(user).toBeDefined();
      expect(user.email).toBe(mockUserPayload.email.toLowerCase());
    });

    test('Nên báo lỗi khi đăng nhập với mật khẩu sai', async () => {
      await expect(
        authService.login({
          email: mockUserPayload.email,
          password: 'WrongPassword123!'
        })
      ).rejects.toThrow('Email hoặc mật khẩu không chính xác');
    });

    test('Nên báo lỗi khi đăng nhập với email chưa đăng ký', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        })
      ).rejects.toThrow('Email hoặc mật khẩu không chính xác');
    });

    test('Nên báo lỗi khi tài khoản đã bị khóa (banned)', async () => {
      const registeredUser = await User.findOne({ email: mockUserPayload.email.toLowerCase() });
      registeredUser.statusAccount = 'banned';
      await registeredUser.save();

      await expect(
        authService.login({
          email: mockUserPayload.email,
          password: mockUserPayload.password
        })
      ).rejects.toThrow('Tài khoản đã bị khóa');
    });

    test('BE04: Nên báo lỗi khi tài khoản mạng xã hội không có mật khẩu cố đăng nhập thường', async () => {
      // Tạo một user không có mật khẩu (giả lập đăng ký qua Google)
      await User.create({
        email: 'googleuser@example.com',
        authProvider: 'google',
        profile: { fullName: 'Google User', country: 'vi' }
      });

      await expect(
        authService.login({
          email: 'googleuser@example.com',
          password: 'Password123!'
        })
      ).rejects.toThrow('Email hoặc mật khẩu không chính xác');
    });
  });

  describe('changePassword()', () => {
    let user;
    beforeEach(async () => {
      user = await authService.register(mockUserPayload);
    });

    test('Nên đổi mật khẩu thành công', async () => {
      const updatedUser = await authService.changePassword(user._id, {
        currentPassword: mockUserPayload.password,
        newPassword: 'NewPassword123!'
      });
      expect(updatedUser).toBeDefined();

      // Kiểm tra mật khẩu mới bằng cách đăng nhập lại
      const loggedIn = await authService.login({
        email: mockUserPayload.email,
        password: 'NewPassword123!'
      });
      expect(loggedIn).toBeDefined();
    });

    test('Nên báo lỗi khi mật khẩu hiện tại không chính xác', async () => {
      await expect(
        authService.changePassword(user._id, {
          currentPassword: 'WrongPassword1!',
          newPassword: 'NewPassword123!'
        })
      ).rejects.toThrow('Mật khẩu hiện tại không chính xác');
    });
  });

  describe('refreshAccessTokenService()', () => {
    let user;
    beforeEach(async () => {
      user = await authService.register(mockUserPayload);
    });

    test('Nên refresh access token thành công với refresh token hợp lệ', async () => {
      const validRefreshToken = jwt.sign(
        { id: user._id, role: user.role },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      const newAccessToken = await authService.refreshAccessTokenService(validRefreshToken);
      expect(newAccessToken).toBeDefined();

      const decoded = jwt.verify(newAccessToken, env.JWT_SECRET);
      expect(decoded.id.toString()).toBe(user._id.toString());
    });

    test('Nên báo lỗi khi thiếu refresh token', async () => {
      await expect(
        authService.refreshAccessTokenService(null)
      ).rejects.toThrow('Không tìm thấy refresh token, vui lòng đăng nhập lại');
    });

    test('Nên báo lỗi khi refresh token không hợp lệ hoặc hết hạn', async () => {
      const invalidToken = 'invalid.refresh.token';
      await expect(
        authService.refreshAccessTokenService(invalidToken)
      ).rejects.toThrow('Refresh token không hợp lệ hoặc đã hết hạn');
    });
  });

  describe('forgotPassword() và resetPassword()', () => {
    beforeEach(async () => {
      await authService.register(mockUserPayload);
    });

    test('Nên gửi yêu cầu quên mật khẩu và đặt lại mật khẩu bằng OTP thành công', async () => {
      // 1. Quên mật khẩu
      await authService.forgotPassword({ email: mockUserPayload.email });

      // Lấy OTP code từ database mock
      const otpRecord = await OTP.findOne({ email: mockUserPayload.email.toLowerCase() });
      expect(otpRecord).toBeDefined();
      expect(otpRecord.otpCode).toHaveLength(6);

      // 2. Đặt lại mật khẩu
      const updatedUser = await authService.resetPassword({
        email: mockUserPayload.email,
        otp: otpRecord.otpCode,
        newPassword: 'ResetPassword123!'
      });

      expect(updatedUser).toBeDefined();

      // 3. Đăng nhập thử với mật khẩu mới
      const loggedIn = await authService.login({
        email: mockUserPayload.email,
        password: 'ResetPassword123!'
      });
      expect(loggedIn).toBeDefined();
    });

    test('Nên báo lỗi khi reset mật khẩu bằng OTP sai hoặc hết hạn', async () => {
      await authService.forgotPassword({ email: mockUserPayload.email });
      await expect(
        authService.resetPassword({
          email: mockUserPayload.email,
          otp: '000000',
          newPassword: 'ResetPassword123!'
        })
      ).rejects.toThrow('Mã OTP không hợp lệ hoặc đã hết hạn');
    });

    test('BE15/BE97: Nên báo lỗi khi cố sử dụng lại OTP đã sử dụng trước đó', async () => {
      await authService.forgotPassword({ email: mockUserPayload.email });
      const otpRecord = await OTP.findOne({ email: mockUserPayload.email.toLowerCase() });

      // Đặt mật khẩu lần 1 thành công
      await authService.resetPassword({
        email: mockUserPayload.email,
        otp: otpRecord.otpCode,
        newPassword: 'ResetPassword123!'
      });

      // Thử dùng lại lần 2
      await expect(
        authService.resetPassword({
          email: mockUserPayload.email,
          otp: otpRecord.otpCode,
          newPassword: 'AnotherPassword123!'
        })
      ).rejects.toThrow('Mã OTP không hợp lệ hoặc đã hết hạn');
    });
  });
});
