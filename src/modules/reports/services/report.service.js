import Report from '../entities/Report.js';
import User from '../../users/entities/User.js';
import notificationService from '../../notifications/services/notification.service.js';

const createReport = async (reporterId, payload, io) => {
    const { reportedUserId, matchSessionId, conversationId, reason, evidenceMessageIds, evidenceImageUrl } = payload;
    
    if (!reportedUserId || !reason) {
        let error = new Error('Thiếu thông tin bắt buộc để báo cáo');
        error.statusCode = 400;
        throw error;
    }

    const report = new Report({
        reporterId,
        reportedUserId,
        matchSessionId: matchSessionId || null,
        conversationId: conversationId || null,
        reason,
        evidenceMessageIds: evidenceMessageIds || [],
        evidenceImageUrl: evidenceImageUrl || null,
        status: 'pending'
    });

    await report.save();

    if (io) {
        try {
            const reporter = await User.findById(reporterId).select('profile.fullName').lean();
            if (reporter) {
                await notificationService.notifyAllAdmins(io, {
                    senderId: reporterId,
                    type: 'report_new',
                    content: `${reporter.profile.fullName} đã gửi một báo cáo vi phạm mới.`,
                    metadata: { reportId: report._id }
                });
            }
        } catch (e) {
            console.error('Lỗi gửi notification cho admin:', e.message);
        }
    }

    return report;
};

export default {
    createReport
};
