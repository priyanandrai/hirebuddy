import * as messageService from '../services/message.service.js';

/**
 * Send a message
 */
export const sendMessage = async (req, res) => {
  try {
    const { taskId, receiverId, message, messageType = 'TEXT', mediaUrl } = req.body;
    const senderId = req.user.id;

    if (!taskId || !receiverId || !message) {
      return res.status(400).json({ error: 'taskId, receiverId, and message are required' });
    }

    const newMessage = await messageService.sendMessage(
      taskId,
      senderId,
      receiverId,
      message,
      messageType,
      mediaUrl
    );

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get messages for a task
 */
export const getTaskMessages = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await messageService.getTaskMessages(taskId, parseInt(limit), parseInt(offset));

    res.json(result);
  } catch (error) {
    console.error('Get task messages error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get conversations for a user
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const conversations = await messageService.getUserConversations(userId, parseInt(limit), parseInt(offset));

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const result = await messageService.markMessagesAsRead(taskId, userId);

    res.json(result);
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await messageService.getUnreadMessageCount(userId);

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const result = await messageService.deleteMessage(messageId, userId);

    res.json(result);
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  sendMessage,
  getTaskMessages,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage,
};
