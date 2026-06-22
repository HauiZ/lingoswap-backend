import express from 'express';
import MatchSession from '../entities/MatchSession.js';
import { requireInternalService } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả internal routes đều yêu cầu header X-Internal-Service
router.use(requireInternalService);

router.get('/internal/matches/stats', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const [totalSessions, sessionsToday, sessionsWeek, avgDurationResult] = await Promise.all([
      MatchSession.countDocuments({ status: { $in: ['completed', 'cancelled'] }, durationSeconds: { $gt: 0 } }),
      MatchSession.countDocuments({ createdAt: { $gte: today }, status: { $in: ['completed', 'cancelled'] }, durationSeconds: { $gt: 0 } }),
      MatchSession.countDocuments({ createdAt: { $gte: thisWeek }, status: { $in: ['completed', 'cancelled'] }, durationSeconds: { $gt: 0 } }),
      MatchSession.aggregate([
        { $match: { status: { $in: ['completed', 'cancelled'] }, durationSeconds: { $gt: 0 } } },
        { $group: { _id: null, avgDuration: { $avg: '$durationSeconds' }, totalDuration: { $sum: '$durationSeconds' } } }
      ])
    ]);

    const avgDuration = avgDurationResult[0] ? Math.round(avgDurationResult[0].avgDuration) : 0;
    const totalDuration = avgDurationResult[0] ? avgDurationResult[0].totalDuration : 0;

    // Biểu đồ phiên gọi 7 ngày gần nhất
    const sessionsChart = await MatchSession.aggregate([
      { $match: { createdAt: { $gte: thisWeek }, status: { $in: ['completed', 'cancelled'] }, durationSeconds: { $gt: 0 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      total: totalSessions,
      today: sessionsToday,
      thisWeek: sessionsWeek,
      avgDurationSeconds: avgDuration,
      totalDurationSeconds: totalDuration,
      chart: sessionsChart
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
