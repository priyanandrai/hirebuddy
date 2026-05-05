import { prisma } from '../utils/prisma.js';

/**
 * Send a notification to a user
 */
export const sendNotification = async (taskId, senderId, receiverId, type, title, message = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        taskId,
        senderId,
        receiverId,
        type,
        title,
        message,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        task: { select: { id: true, title: true } },
      },
    });

    return notification;
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (userId, limit = 20, offset = 0, isRead = null) => {
  try {
    const where = { receiverId: userId };
    if (isRead !== null) {
      where.isRead = isRead;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, image: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.notification.count({ where });

    return { notifications, total, limit, offset };
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.receiverId !== userId) {
      throw new Error('You cannot mark others notifications as read');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        task: { select: { id: true, title: true } },
      },
    });

    return updated;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    await prisma.notification.updateMany({
      where: { receiverId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true, message: 'All notifications marked as read' };
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const count = await prisma.notification.count({
      where: { receiverId: userId, isRead: false },
    });

    return count;
  } catch (error) {
    console.error('Failed to fetch unread notification count:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.receiverId !== userId) {
      throw new Error('You can only delete your own notifications');
    }

    await prisma.notification.delete({ where: { id: notificationId } });

    return { success: true, message: 'Notification deleted' };
  } catch (error) {
    console.error('Failed to delete notification:', error);
    throw error;
  }
};

/**
 * Notification event emitters (helper functions for different events)
 */
export const notificationEvents = {
  /**
   * Task accepted by helper
   */
  taskAccepted: async (taskId, helperId, posterUserId) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    return sendNotification(
      taskId,
      helperId,
      posterUserId,
      'task_accepted',
      'Task Accepted!',
      `A helper has accepted your task: "${task.title}"`
    );
  },

  /**
   * Task started by helper
   */
  taskStarted: async (taskId, helperId, posterUserId) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    return sendNotification(
      taskId,
      helperId,
      posterUserId,
      'task_started',
      'Task In Progress',
      `Your task "${task.title}" has been started`
    );
  },

  /**
   * Task completed by helper
   */
  taskCompleted: async (taskId, helperId, posterUserId) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    return sendNotification(
      taskId,
      helperId,
      posterUserId,
      'task_completed',
      'Task Completed',
      `Your task "${task.title}" has been completed`
    );
  },

  /**
   * Payment received
   */
  paymentReceived: async (taskId, payeeId, payerId, amount) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    return sendNotification(
      taskId,
      payerId,
      payeeId,
      'payment_received',
      'Payment Received!',
      `You received ₹${(amount / 100).toFixed(2)} for task: "${task.title}"`
    );
  },

  /**
   * New message in task
   */
  newMessage: async (taskId, senderId, receiverId, senderName) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    return sendNotification(
      taskId,
      senderId,
      receiverId,
      'new_message',
      `New message from ${senderName}`,
      `You have a new message about: "${task.title}"`
    );
  },

  /**
   * Review received
   */
  reviewReceived: async (taskId, reviewerId, revieweeName, rating) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    return sendNotification(
      taskId,
      reviewerId,
      task.assignedToId,
      'review_received',
      `${rating}⭐ Review from ${revieweeName}`,
      `You received a ${rating}-star review for: "${task.title}"`
    );
  },

  /**
   * Task cancelled
   */
  taskCancelled: async (taskId, cancelledById, otherUserId, reason = 'Task cancelled') => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    return sendNotification(
      taskId,
      cancelledById,
      otherUserId,
      'task_cancelled',
      'Task Cancelled',
      `The task "${task.title}" has been cancelled. Reason: ${reason}`
    );
  },
};

export default {
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
  notificationEvents,
};
