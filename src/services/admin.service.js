import User from '../models/User.js';
import Report from '../models/Report.js';
import ApiError from '../utils/ApiError.js';
import sendEmail from '../utils/sendEmail.js';
import renderEmailTemplate from '../utils/emailTemplate.js';

const getAllUsers = async () => {
    return await User.find().select('-password -__v').sort({ createdAt: -1 });
};

const banUser = async (id) => {
    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, 'Người dùng không tồn tại');
    }
    user.statusAccount = 'banned';
    user.bannedUntil = null;
    await user.save();

    try {
        const html = renderEmailTemplate('banned', {
            fullName: user.profile.fullName,
            banDuration: 'Khóa vĩnh viễn',
            reason: 'Vi phạm Tiêu chuẩn Cộng đồng LingoSwap.',
            bannedUntil: 'Không có ngày mở khóa'
        });
        await sendEmail({
            email: user.email,
            subject: 'Thông báo: Khóa tài khoản LingoSwap',
            message: `Tài khoản của bạn đã bị khóa vĩnh viễn.`,
            html
        });
    } catch (e) {
        console.error("Không thể gửi email thông báo ban:", e.message);
    }

    return await User.findById(id).select('-password -__v');
};

const deleteUser = async (id) => {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
        throw new ApiError(404, 'Người dùng không tồn tại');
    }
    return deletedUser;
};

const getAllReports = async (statusFilter, limit = 20, page = 1) => {
    let query = {};
    if (statusFilter) query.status = statusFilter;

    return await Report.find(query)
        .populate('reporterId', 'profile.fullName email username')
        .populate('reportedUserId', 'profile.fullName email username statusAccount bannedUntil')
        .populate('resolvedByAdminId', 'profile.fullName email username')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
};

const resolveReport = async (reportId, adminId, payload) => {
    const { status, adminNotes, banDuration } = payload;
    
    const report = await Report.findById(reportId);
    if (!report) throw new ApiError(404, 'Báo cáo không tồn tại');

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    
    if (status === 'resolved' || status === 'dismissed') {
        report.resolvedByAdminId = adminId;
    }

    if (banDuration && status === 'resolved') {
        const reportedUser = await User.findById(report.reportedUserId);
        if (reportedUser) {
            reportedUser.statusAccount = 'banned';
            const now = new Date();
            if (banDuration === '3_days') {
                reportedUser.bannedUntil = new Date(now.setDate(now.getDate() + 3));
            } else if (banDuration === '7_days') {
                reportedUser.bannedUntil = new Date(now.setDate(now.getDate() + 7));
            } else if (banDuration === '30_days') {
                reportedUser.bannedUntil = new Date(now.setDate(now.getDate() + 30));
            } else if (banDuration === 'permanent') {
                reportedUser.bannedUntil = null; // vĩnh viễn (kết hợp statusAccount = banned)
            }
            await reportedUser.save();

            // Gửi email thông báo
            try {
                const isPermanent = banDuration === 'permanent';
                const durationMap = { '3_days': '3 ngày', '7_days': '7 ngày', '30_days': '30 ngày', 'permanent': 'Vĩnh viễn' };
                const durationText = durationMap[banDuration] || banDuration;
                const bannedUntilText = isPermanent
                    ? 'Không có ngày mở khóa'
                    : reportedUser.bannedUntil.toLocaleString('vi-VN');
                const reasonText = adminNotes || 'Vi phạm quy tắc cộng đồng.';

                const html = renderEmailTemplate('banned', {
                    fullName: reportedUser.profile.fullName,
                    banDuration: `Tạm khóa ${durationText}`,
                    reason: reasonText,
                    bannedUntil: bannedUntilText
                });

                await sendEmail({
                    email: reportedUser.email,
                    subject: 'Thông báo: Khóa tài khoản LingoSwap do vi phạm',
                    message: `Tài khoản của bạn đã bị khóa ${durationText} do: ${reasonText}`,
                    html
                });
            } catch (e) {
                console.error("Lỗi khi gửi email report ban:", e.message);
            }
        }
    }

    await report.save();
    return report;
};

export default {
    getAllUsers,
    banUser,
    deleteUser,
    getAllReports,
    resolveReport
};
