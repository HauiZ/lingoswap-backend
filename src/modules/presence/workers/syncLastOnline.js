import User from '../../users/entities/User.js';
import redis from '../../../core/config/redis.js';

export const startLastOnlineWorker = () => {
    // Chạy mỗi 1 phút (60000ms)
    setInterval(async () => {
        try {
            // 1. Lấy tất cả ID đang chờ đồng bộ và xóa chúng khỏi Set ngay lập tức
            // SPOP với count lớn giúp lấy ra hàng loạt
            const userIds = await redis.spop('sync:lastOnline:users', 500);

            if (!userIds || userIds.length === 0) return;

            const now = new Date();

            // 2. Chuẩn bị mảng các thao tác Bulk Write
            const bulkOps = userIds.map(id => ({
                updateOne: {
                    filter: { _id: id },
                    update: {
                        $set: {
                            lastOnlineAt: now,
                            status: 'idle' // Reset trạng thái nghiệp vụ về rảnh rỗi khi user mất kết nối
                        }
                    }
                }
            }));

            // 3. Thực hiện ghi hàng loạt vào MongoDB (Cực nhanh)
            const result = await User.bulkWrite(bulkOps);

            console.log(` Worker: Đã đồng bộ ${result.modifiedCount} người dùng về MongoDB.`);
        } catch (error) {
            console.error(" Worker Sync Error:", error);
        }
    }, 60000);
};
