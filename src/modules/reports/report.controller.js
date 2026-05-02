import reportService from './report.service.js';

const createReport = async (req, res) => {
    try {
        const reporterId = req.user.id;
        const io = req.app.get('io');
        const report = await reportService.createReport(reporterId, req.body, io);

        res.status(201).json({ message: 'Gửi báo cáo vi phạm thành công', report });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi hệ thống khi gửi báo cáo' });
    }
};

export { createReport };
