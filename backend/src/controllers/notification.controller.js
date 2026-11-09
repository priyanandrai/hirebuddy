import * as notificationService from '../services/notification.service.js';

/**
 * Get notifications for user
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, isRead } = req.query;

    const result = await notificationService.getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(offset),
      isRead ? isRead === 'true' : null
    );

    res.json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.markNotificationAsRead(notificationId, userId);

    res.json(notification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllNotificationsAsRead(userId);

    res.json(result);
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadNotificationCount(userId);

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await notificationService.deleteNotification(notificationId, userId);

    res.json(result);
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Register Firebase Cloud Messaging (FCM) token for the authenticated user
 */
export const registerFcmToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ error: 'fcmToken is required' });
    }
    const result = await notificationService.registerFcmToken(userId, fcmToken);
    res.json(result);
  } catch (error) {
    console.error('Register FCM token error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Remove Firebase Cloud Messaging (FCM) token for the authenticated user
 */
export const removeFcmToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.removeFcmToken(userId);
    res.json(result);
  } catch (error) {
    console.error('Remove FCM token error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send a test push notification to the authenticated user
 */
export const sendTestPush = async (req, res) => {
  try {
    const userId = req.user.id;
    const title = req.body?.title || '🔔 HireBuddy Push Notification Active!';
    const message =
      req.body?.message ||
      'Your Firebase & Web Push notifications are connected and ready for real-time task updates.';

    const notification = await notificationService.sendNotification(
      null,
      userId,
      userId,
      'push_test',
      title,
      message
    );

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Send test push error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  registerFcmToken,
  removeFcmToken,
  sendTestPush,
};
