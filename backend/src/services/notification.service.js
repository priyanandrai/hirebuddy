import  prisma  from '../utils/prisma.js';
import { emitToUser } from '../config/socket.config.js';

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

    // Real-time socket emission to receiver
    try {
      emitToUser(receiverId, 'receive_notification', notification);
    } catch (socketErr) {
      console.warn('Real-time notification emission failed:', socketErr?.message);
    }

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
    const [task, helper] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskId } }),
      prisma.user.findUnique({ where: { id: helperId }, select: { name: true } }),
    ]);
    const helperName = helper?.name || 'A helper';
    const taskTitle = task?.title || 'your task';
    return sendNotification(
      taskId,
      helperId,
      posterUserId,
      'task_accepted',
      'Task Accepted!',
      `${helperName} has accepted your task: "${taskTitle}"`
    );
  },

  /**
   * Task started by helper (IN_PROGRESS)
   */
  taskStarted: async (taskId, senderId, receiverId) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    const taskTitle = task?.title || 'Task';
    return sendNotification(
      taskId,
      senderId,
      receiverId,
      'task_started',
      'Task In Progress',
      `Your task "${taskTitle}" is now in progress.`
    );
  },

  /**
   * Task completed by helper (COMPLETED)
   */
  taskCompleted: async (taskId, senderId, receiverId) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    const taskTitle = task?.title || 'Task';
    return sendNotification(
      taskId,
      senderId,
      receiverId,
      'task_completed',
      'Task Completed!',
      `Your task "${taskTitle}" has been completed.`
    );
  },

  /**
   * Payment received
   */
  paymentReceived: async (taskId, payeeId, payerId, amount) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    const taskTitle = task?.title || 'Task';
    const formattedAmount = (amount / 100).toFixed(2);
    return sendNotification(
      taskId,
      payerId,
      payeeId,
      'payment_received',
      'Payment Received!',
      `You received ₹${formattedAmount} for task: "${taskTitle}"`
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
      `The task "${task?.title || 'Task'}" has been cancelled. Reason: ${reason}`
    );
  },

  /**
   * Task requested directly to helper
   */
  taskRequested: async (taskId, customerId, helperId) => {
    const [task, customer] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskId } }),
      prisma.user.findUnique({ where: { id: customerId }, select: { name: true } }),
    ]);
    const customerName = customer?.name || 'A customer';
    const taskTitle = task?.title || 'a new task';
    return sendNotification(
      taskId,
      customerId,
      helperId,
      'task_requested',
      'New Booking Request!',
      `${customerName} has requested you for: "${taskTitle}". Please accept or decline.`
    );
  },

  /**
   * Task declined by helper
   */
  taskDeclined: async (taskId, helperId, customerId, reason = 'Helper unavailable') => {
    const [task, helper] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskId } }),
      prisma.user.findUnique({ where: { id: helperId }, select: { name: true } }),
    ]);
    const helperName = helper?.name || 'The helper';
    const taskTitle = task?.title || 'your task';
    return sendNotification(
      taskId,
      helperId,
      customerId,
      'task_declined',
      'Booking Request Declined',
      `${helperName} was unable to accept your request for "${taskTitle}". Reason: ${reason}`
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
