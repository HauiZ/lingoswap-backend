import reportService from '../services/report.service.js';

const getReportsInternal = async (req, res) => {
  try {
    const { status, limit, page, reportedUserId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (reportedUserId) query.reportedUserId = reportedUserId;
    const reports = await reportService.getReportsInternal(query, limit, page);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resolveReportInternal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, resolvedByAdminId } = req.body;
    const report = await reportService.resolveReportInternal(id, { status, adminNotes, resolvedByAdminId });
    res.json(report);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

const getReportsStatsInternal = async (req, res) => {
  try {
    const stats = await reportService.getReportsStatsInternal();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export {
  getReportsInternal,
  resolveReportInternal,
  getReportsStatsInternal
};
