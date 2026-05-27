import nodemailer from 'nodemailer';
import axios from 'axios';
import { env } from '../config/env.js';


const getAccessToken = async () => {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: env.OAUTH_CLIENT_ID,
    client_secret: env.OAUTH_CLIENT_SECRET,
    refresh_token: env.OAUTH_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  return response.data.access_token;
};

const makeMimeBody = (to, from, subject, message, html) => {
  const boundary = 'foo_bar_baz';

  const parts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    message || '',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(html || message || '').toString('base64'),
    '',
    `--${boundary}--`
  ];

  return Buffer.from(parts.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const sendEmail = async (options) => {

  // Gửi qua Gmail OAuth2 (SMTP)
  // const transporter = nodemailer.createTransport({
  //   host: 'smtp.gmail.com',
  //   port: 465,
  //   secure: true,
  //   auth: {
  //     type: 'OAuth2',
  //     user: env.MY_EMAIL_ACCOUNT,
  //     clientId: env.OAUTH_CLIENT_ID,
  //     clientSecret: env.OAUTH_CLIENT_SECRET,
  //     refreshToken: env.OAUTH_REFRESH_TOKEN,
  //   },
  // });

  // Gửi qua Mailtrap Sandbox (SMTP)
  // const transporter = nodemailer.createTransport({
  //   host: "sandbox.smtp.mailtrap.io",
  //   port: 2525,
  //   auth: {
  //     user: env.MAILTRAP_USER,
  //     pass: env.MAILTRAP_PASS,
  //   }
  // })

  // Gửi qua Gmail App Password (SMTP)
  // const transporter = nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: {
  //     user: env.MY_EMAIL_ACCOUNT,
  //     pass: env.MY_EMAIL_APP_PASSWORD,
  //   },
  // });

  try {
    const accessToken = await getAccessToken();
    const rawMessage = makeMimeBody(
      options.email,
      `LingoSwap <${env.MY_EMAIL_ACCOUNT}>`,
      options.subject,
      options.message,
      options.html
    );

    const response = await axios.post(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      { raw: rawMessage },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("Mail sent successfully via Gmail REST API:", response.data.id);
  } catch (err) {
    console.error("Failed to send email via Gmail REST API:");
    console.error(err.response?.data || err.message);
    throw err;
  }
};

export default sendEmail;
