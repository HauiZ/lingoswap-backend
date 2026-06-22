import reportService from '../services/report.service.js';

const createReport = async (req, res) => {
    try {
        const reporterId = req.user.id;
        const io = req.app.get('io');
        
        const payload = { ...req.body };
        if (req.file) {
            payload.evidenceImageUrl = req.file.path;
        }

        // Đảm bảo evidenceMessageIds được parse đúng khi gửi qua multipart/form-data
        if (payload.evidenceMessageIds && typeof payload.evidenceMessageIds === 'string') {
            try {
                payload.evidenceMessageIds = JSON.parse(payload.evidenceMessageIds);
            } catch (e) {
                payload.evidenceMessageIds = payload.evidenceMessageIds.split(',').map(id => id.trim()).filter(Boolean);
            }
        }

        const report = await reportService.createReport(reporterId, payload, io);

        res.status(201).json({ message: 'Gửi báo cáo vi phạm thành công', report });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi hệ thống khi gửi báo cáo' });
    }
};

export { createReport };
