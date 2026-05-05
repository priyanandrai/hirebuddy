import express from 'express';
import * as messageController from '../controllers/message.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/messages - Send a message
 */
router.post('/', messageController.sendMessage);

/**
 * GET /api/messages/task/:taskId - Get messages for a task
 */
router.get('/task/:taskId', messageController.getTaskMessages);

/**
 * GET /api/messages/conversations - Get user conversations
 */
router.get('/conversations', messageController.getConversations);

/**
 * PUT /api/messages/task/:taskId/read - Mark messages as read
 */
router.put('/task/:taskId/read', messageController.markAsRead);

/**
 * GET /api/messages/unread-count - Get unread message count
 */
router.get('/unread-count', messageController.getUnreadCount);

/**
 * DELETE /api/messages/:messageId - Delete a message
 */
router.delete('/:messageId', messageController.deleteMessage);

export default router;
