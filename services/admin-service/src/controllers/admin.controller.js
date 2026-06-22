import adminService from '../services/admin.service.js';

export const getDashboard = async (req, res) => {
    try {
        const stats = await adminService.getDashboardStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi lấy dashboard stats" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await adminService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi lấy danh sách users" });
    }
};

export const banUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await adminService.banUser(id);
        res.status(200).json(user);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi khóa user" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await adminService.deleteUser(id);
        res.status(200).json({ message: "Xóa user thành công", user });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi xóa user" });
    }
};

export const getReports = async (req, res) => {
    try {
        const { status, limit, page } = req.query;
        const reports = await adminService.getAllReports(status, limit, page);
        res.status(200).json(reports);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi lấy danh sách báo cáo" });
    }
};

export const resolveReport = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        const report = await adminService.resolveReport(id, adminId, req.body);
        res.status(200).json(report);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi giải quyết báo cáo" });
    }
};

export const getAppeals = async (req, res) => {
    try {
        const { status, limit, page } = req.query;
        const appeals = await adminService.getAllAppeals(status, limit, page);
        res.status(200).json(appeals);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi lấy danh sách kháng cáo" });
    }
};

export const resolveAppeal = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        const appeal = await adminService.resolveAppeal(id, adminId, req.body);
        res.status(200).json({ message: "Giải quyết kháng cáo thành công", appeal });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi giải quyết kháng cáo" });
    }
};

export const addBlacklistKeyword = async (req, res) => {
    try {
        const { keyword } = req.body;
        const adminId = req.user.id;
        const newKeyword = await adminService.addBlacklistKeyword(keyword, adminId);
        res.status(201).json({ message: "Thêm từ khóa cấm thành công", keyword: newKeyword });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi thêm từ khóa cấm" });
    }
};

export const getBlacklistKeywords = async (req, res) => {
    try {
        const { search, page, limit } = req.query;
        const result = await adminService.getBlacklistKeywords({ search, page, limit });
        res.status(200).json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi lấy danh sách từ khóa cấm" });
    }
};

export const deleteBlacklistKeyword = async (req, res) => {
    try {
        const { id } = req.params;
        await adminService.deleteBlacklistKeyword(id);
        res.status(200).json({ message: "Xóa từ khóa cấm thành công" });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Lỗi khi xóa từ khóa cấm" });
    }
};
