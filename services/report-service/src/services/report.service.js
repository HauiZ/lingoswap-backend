import Report from '../entities/Report.js';
import eventBus from '../config/eventBus.js';
import { EventTypes } from '../events/eventTypes.js';
import { createServiceClient } from '../http/serviceClient.js';

const createReport = async (reporterId, payload) => {
    const { reportedUserId, matchSessionId, conversationId, reason, evidenceMessageIds } = payload;
    
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
        status: 'pending'
    });

    await report.save();

    // Lấy thông tin reporter và bắn event sang Notification/Admin Service
    try {
        let reporterName = 'Người dùng';
        try {
            const userClient = createServiceClient('user');
            const { data } = await userClient.get(`/internal/users/${reporterId}/basic`);
            reporterName = data?.profile?.fullName || 'Người dùng';
        } catch (err) {
            console.error('[Report Service] Failed to get reporter name:', err.message);
        }

        // Bắn event REPORT_CREATED sang EventBus
        await eventBus.publish(EventTypes.REPORT_CREATED, {
            reportId: report._id.toString(),
            reporterId: reporterId.toString(),
            reporterName,
            targetUserId: reportedUserId.toString(),
            reason
        });
    } catch (e) {
        console.error('[Report Service] Lỗi bắn event REPORT_CREATED:', e.message);
    }

    return report;
};

// Các helper methods cho Admin (sẽ được Admin Service gọi)
const getReportsInternal = async (query = {}, limit = 20, page = 1) => {
    return await Report.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
};

const resolveReportInternal = async (reportId, { status, adminNotes, resolvedByAdminId }) => {
    const report = await Report.findByIdAndUpdate(
        reportId,
        { status, adminNotes, resolvedByAdminId },
        { new: true }
    );
    if (!report) {
        let error = new Error('Không tìm thấy báo cáo');
        error.statusCode = 404;
        throw error;
    }

    // Bắn event REPORT_RESOLVED để thông báo cho reporter
    try {
        await eventBus.publish(EventTypes.REPORT_RESOLVED, {
            reportId: report._id.toString(),
            reporterId: report.reporterId.toString(),
            adminNotes
        });
    } catch (err) {
        console.error('[Report Service] Failed to publish REPORT_RESOLVED event:', err.message);
    }

    return report;
};

const getReportsStatsInternal = async () => {
    const total = await Report.countDocuments();
    const pending = await Report.countDocuments({ status: 'pending' });
    const resolved = await Report.countDocuments({ status: 'resolved' });
    return { total, pending, resolved };
};

export default {
    createReport,
    getReportsInternal,
    resolveReportInternal,
    getReportsStatsInternal
};
