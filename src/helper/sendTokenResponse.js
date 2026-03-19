import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';


// Helper function để cấp token và trả về response
const sendTokenResponse = (user, statusCode, res, message = null) => {
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const responseData = {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role,
        token: accessToken,
    };

    if (message) responseData.message = message;

    res.status(statusCode).json(responseData);
};

export default sendTokenResponse;