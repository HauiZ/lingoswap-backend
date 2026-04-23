import Report from '../models/Report.js';

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
    return report;
};

export default {
    createReport
};
