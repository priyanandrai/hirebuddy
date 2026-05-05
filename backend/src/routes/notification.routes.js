import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/notifications - Get user notifications
 */
router.get('/', notificationController.getNotifications);

/**
 * GET /api/notifications/unread-count - Get unread notification count
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * PUT /api/notifications/:notificationId/read - Mark as read
 */
router.put('/:notificationId/read', notificationController.markAsRead);

/**
 * PUT /api/notifications/read-all - Mark all as read
 */
router.put('/mark/read-all', notificationController.markAllAsRead);

/**
 * DELETE /api/notifications/:notificationId - Delete notification
 */
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;
