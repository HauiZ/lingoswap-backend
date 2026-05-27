import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: env.MY_EMAIL_ACCOUNT,
      clientId: env.OAUTH_CLIENT_ID,
      clientSecret: env.OAUTH_CLIENT_SECRET,
      refreshToken: env.OAUTH_REFRESH_TOKEN,
    },
  });

  const mailOptions = {
    from: `LingoSwap <${env.MY_EMAIL_ACCOUNT}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
