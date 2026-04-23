import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

export const startUnbanWorker = () => {
    // Chạy mỗi 1 giờ (3600000ms)
    // Để server tự check db dọn rác
    setInterval(async () => {
        try {
            const now = new Date();
            
            // Tìm những account banned tạm thời đã hết hạn
            const expiredBans = await User.find({
                statusAccount: 'banned',
                bannedUntil: { $lte: now, $ne: null }
            });

            if (expiredBans.length === 0) return;

            for (const user of expiredBans) {
                user.statusAccount = 'active';
                user.bannedUntil = null;
                await user.save();

                // Gửi email chào mừng trở lại
                try {
                    await sendEmail({
                        email: user.email,
                        subject: 'Thông báo: Khôi phục tài khoản LingoSwap',
                        message: `Chào ${user.profile.fullName},\n\nTài khoản của bạn đã được hệ thống mở khóa tự động sau khi hết thời gian tạm đình chỉ.\n\nChào mừng bạn quay lại! Hy vọng bạn sẽ có những trải nghiệm kết nối tốt đẹp và tuân thủ các quy định chung.\n\nTrân trọng,\nĐội ngũ LingoSwap`,
                        html: `<h3>Chào ${user.profile.fullName},</h3><p>Tài khoản của bạn đã được <b>mở khóa tự động</b> sau khi kết thúc thời gian tạm đình chỉ.</p><p>Chào mừng bạn quay lại! Hy vọng bạn sẽ có những trải nghiệm kết nối thân thiện và tôn trọng các quy định cộng đồng.</p><p>Trân trọng,<br>Đội ngũ LingoSwap</p>`
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
