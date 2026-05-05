import { prisma } from '../utils/prisma.js';

/**
 * Send a message between task creator and helper
 */
export const sendMessage = async (taskId, senderId, receiverId, message, messageType = 'TEXT', mediaUrl = null) => {
  try {
    // Verify users are part of the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { createdBy: true, assignedTo: true },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const isValidParticipant =
      (task.createdById === senderId || task.assignedToId === senderId) &&
      (task.createdById === receiverId || task.assignedToId === receiverId);

    if (!isValidParticipant) {
      throw new Error('User is not part of this task');
    }

    const newMessage = await prisma.message.create({
      data: {
        taskId,
        senderId,
        receiverId,
        message,
        type: messageType,
        mediaUrl,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
    });

    return newMessage;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

/**
 * Get messages for a task
 */
export const getTaskMessages = async (taskId, limit = 50, offset = 0) => {
  try {
    const messages = await prisma.message.findMany({
      where: { taskId },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.message.count({ where: { taskId } });

    return { messages, total, limit, offset };
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    throw error;
  }
};

/**
 * Get conversation list for a user
 */
export const getUserConversations = async (userId, limit = 20, offset = 0) => {
  try {
    // Get unique conversations (tasks with messages involving the user)
    const conversations = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      distinct: ['taskId'],
      include: {
        task: {
          include: {
            createdBy: { select: { id: true, name: true, image: true } },
            assignedTo: { select: { id: true, name: true, image: true } },
          },
        },
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            taskId: conv.taskId,
            receiverId: userId,
            isRead: false,
          },
        });

        const otherUser = conv.task.createdById === userId ? conv.task.assignedTo : conv.task.createdBy;

        return {
          taskId: conv.taskId,
          task: conv.task,
          otherUser,
          lastMessage: conv,
          unreadCount,
        };
      })
    );

    return conversationsWithUnread;
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (taskId, userId) => {
  try {
    await prisma.message.updateMany({
      where: {
        taskId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    throw error;
  }
};

/**
 * Get unread message count for a user
 */
export const getUnreadMessageCount = async (userId) => {
  try {
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    throw error;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId, userId) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('You can only delete your own messages');
    }

    await prisma.message.delete({ where: { id: messageId } });

    return { success: true, message: 'Message deleted' };
  } catch (error) {
    console.error('Failed to delete message:', error);
    throw error;
  }
};

export default {
  sendMessage,
  getTaskMessages,
  getUserConversations,
  markMessagesAsRead,
  getUnreadMessageCount,
  deleteMessage,
};
