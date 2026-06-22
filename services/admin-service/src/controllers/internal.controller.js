import adminService from '../services/admin.service.js';

export const checkBlacklistKeyword = async (req, res) => {
  try {
    const { text } = req.body;
    const result = await adminService.checkContainsBlacklistKeyword(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
