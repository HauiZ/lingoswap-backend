// src/utils/sendEmail.js - Tiện ích gửi email
import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1) Tạo một transporter (sử dụng tài khoản gmail hoặc dịch vụ khác để gửi)
  // Lưu ý: Cần thêm EMAIL_USERNAME và EMAIL_PASSWORD vào .env
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Hoặc sử dụng host/port của SMTP server khác
    auth: {
      user: process.env.EMAIL_USERNAME || 'test@example.com',
      pass: process.env.EMAIL_PASSWORD || 'password',
    },
  });

  // 2) Định nghĩa cấu hình email
  const mailOptions = {
    from: 'LingoSwap <noreply@lingoswap.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Hỗ trợ gửi template HTML
  };

  // 3) Thực hiện gửi email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
