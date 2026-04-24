import reportService from '../services/report.service.js';
import notificationService from '../services/notification.service.js';
import User from '../models/User.js';

const createReport = async (req, res) => {
    try {
        const reporterId = req.user.id;
        const report = await reportService.createReport(reporterId, req.body);

        // Thông báo tới tất cả Admin khi có report mới
        try {
            const reporter = await User.findById(reporterId).select('profile.fullName').lean();
            const io = req.app.get('io');
            await notificationService.notifyAllAdmins(io, {
                senderId: reporterId,
                type: 'report_new',
                content: `${reporter.profile.fullName} đã gửi một báo cáo vi phạm mới.`,
                metadata: { reportId: report._id }
            });
        } catch (e) {
            console.error('Lỗi gửi notification cho admin:', e.message);
        }

        res.status(201).json({ message: 'Gửi báo cáo vi phạm thành công', report });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi hệ thống khi gửi báo cáo' });
    }
};

export { createReport };
