import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.MY_EMAIL_ACCOUNT,
      pass: env.MY_EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: 'LingoSwap <noreply@lingoswap.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
