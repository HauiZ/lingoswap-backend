import matchSessionService from './matchSession.service.js';
import { completeMatchSessionService } from './match.service.js';

const getMatchHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit, page } = req.query;
        
        const history = await matchSessionService.getMatchHistory(userId, limit, page);
        res.status(200).json(history);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi lấy lịch sử cuộc gọi" });
    }
};

const getMatchSessionDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        const details = await matchSessionService.getMatchSessionDetails(sessionId, userId);
        res.status(200).json(details);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi lấy chi tiết phiên gọi" });
    }
};

const endMatchSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        const { session } = await completeMatchSessionService(sessionId, userId);
        res.status(200).json({ message: "Kết thúc phiên gọi thành công", session });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi kết thúc phiên gọi" });
    }
};

const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        const review = await matchSessionService.createReview(userId, sessionId, req.body);
        res.status(201).json({ message: "Đánh giá phiên gọi thành công", review });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi gửi đánh giá" });
    }
};

export {
    getMatchHistory,
    getMatchSessionDetails,
    endMatchSession,
    createReview
};
