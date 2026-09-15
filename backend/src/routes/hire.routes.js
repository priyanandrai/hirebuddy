import express from 'express';
import { createHireRequest } from '../controllers/hire.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/hire - create a hire buddy request (creates a Task)
router.post('/', authMiddleware, createHireRequest);

export default router;
