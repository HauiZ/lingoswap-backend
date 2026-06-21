import { Router } from "express";
import { createReport } from '../controllers/report.controller.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticateToken, createReport);

export default router;
