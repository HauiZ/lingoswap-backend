import nodemailer from 'nodemailer';
import axios from 'axios';

const getAccessToken = async () => {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id:     process.env.OAUTH_CLIENT_ID,
    client_secret: process.env.OAUTH_CLIENT_SECRET,
    refresh_token: process.env.OAUTH_REFRESH_TOKEN,
    grant_type:    'refresh_token',
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

/**
 * Gửi email qua Gmail REST API (OAuth2)
 * @param {object} options
 * @param {string} options.email   - Địa chỉ email người nhận
 * @param {string} options.subject - Tiêu đề email
 * @param {string} options.message - Nội dung text thuần
 * @param {string} [options.html]  - Nội dung HTML (optional)
 */
const sendEmail = async (options) => {
  try {
    const accessToken = await getAccessToken();
    const rawMessage = makeMimeBody(
      options.email,
      `LingoSwap <${process.env.MY_EMAIL_ACCOUNT}>`,
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
