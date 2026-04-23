import User from '../models/User.js';
import Report from '../models/Report.js';
import ApiError from '../utils/ApiError.js';
import sendEmail from '../utils/sendEmail.js';

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
        await sendEmail({
            email: user.email,
            subject: 'Thông báo: Khóa tài khoản LingoSwap',
            message: `Chào ${user.profile.fullName},\n\nTài khoản của bạn đã bị khóa vĩnh viễn do vi phạm Tiêu chuẩn cộng đồng.\n\nTrân trọng,\nĐội ngũ LingoSwap`,
            html: `<h3>Chào ${user.profile.fullName},</h3><p>Tài khoản của bạn đã bị khóa <b>vĩnh viễn</b> do vi phạm Tiêu chuẩn cộng đồng.</p><p>Trân trọng,<br>Đội ngũ LingoSwap</p>`
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
                const durationText = isPermanent 
                    ? 'vĩnh viễn' 
                    : `tạm thời cho đến ${reportedUser.bannedUntil.toLocaleString('vi-VN')}`;
                
                const reasonText = adminNotes ? `Lý do cụ thể: ${adminNotes}` : 'Vi phạm quy tắc cộng đồng.';

                await sendEmail({
                    email: reportedUser.email,
                    subject: 'Thông báo: Khóa tài khoản LingoSwap do vi phạm',
                    message: `Chào ${reportedUser.profile.fullName},\n\nTài khoản của bạn đã bị khóa ${durationText} do có báo cáo vi phạm.\n\n${reasonText}\n\nTrân trọng,\nĐội ngũ LingoSwap`,
                    html: `<h3>Chào ${reportedUser.profile.fullName},</h3><p>Tài khoản của bạn đã bị khóa <b>${durationText}</b> do có báo cáo vi phạm được xác thực.</p><p><b>${reasonText}</b></p><p>Trân trọng,<br>Đội ngũ LingoSwap</p>`
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
