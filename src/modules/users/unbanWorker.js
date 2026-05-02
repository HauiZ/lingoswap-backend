import User from './User.js';
import sendEmail from '../../core/utils/sendEmail.js';
import renderEmailTemplate from '../../core/utils/emailTemplate.js';
import env from '../../core/config/env.js';

export const startUnbanWorker = () => {
    setInterval(async () => {
        try {
            const now = new Date();

            const expiredBans = await User.find({
                statusAccount: 'banned',
                bannedUntil: { $lte: now, $ne: null }
            });

            if (expiredBans.length === 0) return;

            for (const user of expiredBans) {
                user.statusAccount = 'active';
                user.bannedUntil = null;
                await user.save();
                try {
                    const html = renderEmailTemplate('unbanned', {
                        fullName: user.profile.fullName,
                        frontendUrl: env.FRONTEND_URL || 'https://lingoswap.com'
                    });
                    await sendEmail({
                        email: user.email,
                        subject: 'Thông báo: Khôi phục tài khoản LingoSwap',
                        message: `Tài khoản của bạn đã được mở khóa. Chào mừng bạn quay lại!`,
                        html
                    });
                } catch (e) {
                    console.error(`Không thể gửi email auto unban tới ${user.email}:`, e.message);
                }
            }

            console.log(`[Worker] Đã mở khóa và gửi mail thông báo cho ${expiredBans.length} tài khoản hết hạn ban.`);
        } catch (error) {
            console.error("[Worker] Lỗi Unban Worker:", error.message);
        }
    }, 3600000);
};
