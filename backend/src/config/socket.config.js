import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './utils/prisma.js';

// Store active users and their socket connections
const userSockets = new Map();

/**
 * Initialize Socket.IO events
 */
export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware to verify JWT token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  /**
   * Handle user connection
   */
  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected with socket ${socket.id}`);

    // Store user's socket connection
    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, []);
    }
    userSockets.get(socket.userId).push(socket.id);

    // Emit that user is online
    socket.broadcast.emit('user_online', { userId: socket.userId });

    /**
     * JOIN TASK ROOM - User joins a task conversation room
     */
    socket.on('join_task', ({ taskId }) => {
      const room = `task_${taskId}`;
      socket.join(room);
      console.log(`User ${socket.userId} joined task room ${taskId}`);

      // Notify others in the room that user is in the conversation
      io.to(room).emit('user_joined', { userId: socket.userId });
    });

    /**
     * SEND MESSAGE - Real-time message broadcasting
     */
    socket.on('send_message', async (data) => {
      try {
        const { taskId, receiverId, message, messageType = 'TEXT', mediaUrl } = data;
        const room = `task_${taskId}`;

        // Save message to DB
        const newMessage = await prisma.message.create({
          data: {
            taskId,
            senderId: socket.userId,
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

        // Broadcast message to task room
        io.to(room).emit('new_message', {
          message: newMessage,
          timestamp: new Date(),
        });

        // Send notification to receiver if offline
        if (!userSockets.has(receiverId) || userSockets.get(receiverId).length === 0) {
          await prisma.notification.create({
            data: {
              taskId,
              senderId: socket.userId,
              receiverId,
              type: 'new_message',
              title: `New message about task "${taskId}"`,
              message: message.substring(0, 100),
            },
          });
        } else {
          // Send push notification even if online
          const receiverSockets = userSockets.get(receiverId);
          receiverSockets.forEach((socketId) => {
            io.to(socketId).emit('message_notification', {
              senderId: socket.userId,
              taskId,
              message: message.substring(0, 100),
            });
          });
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { error: error.message });
      }
    });

    /**
     * MARK MESSAGE AS READ
     */
    socket.on('message_read', async ({ taskId, messageId }) => {
      try {
        await prisma.message.update({
          where: { id: messageId },
          data: { isRead: true, readAt: new Date() },
        });

        const room = `task_${taskId}`;
        io.to(room).emit('message_read_notification', { messageId });
      } catch (error) {
        console.error('Mark message as read error:', error);
      }
    });

    /**
     * TYPING INDICATOR
     */
    socket.on('user_typing', ({ taskId }) => {
      const room = `task_${taskId}`;
      socket.broadcast.to(room).emit('user_typing', { userId: socket.userId });
    });

    socket.on('user_stop_typing', ({ taskId }) => {
      const room = `task_${taskId}`;
      socket.broadcast.to(room).emit('user_stop_typing', { userId: socket.userId });
    });

    /**
     * SEND NOTIFICATION (real-time)
     */
    socket.on('send_notification', async (data) => {
      try {
        const { taskId, receiverId, type, title, message } = data;

        // Save notification to DB
        const notification = await prisma.notification.create({
          data: {
            taskId,
            senderId: socket.userId,
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

        // Send to receiver's sockets
        if (userSockets.has(receiverId)) {
          const receiverSockets = userSockets.get(receiverId);
          receiverSockets.forEach((socketId) => {
            io.to(socketId).emit('receive_notification', notification);
          });
        }
      } catch (error) {
        console.error('Send notification error:', error);
      }
    });

    /**
     * TASK STATUS UPDATE (real-time)
     */
    socket.on('task_status_update', ({ taskId, newStatus }) => {
      const room = `task_${taskId}`;
      io.to(room).emit('task_status_changed', { taskId, newStatus });
    });

    /**
     * TASK ACCEPTED (real-time)
     */
    socket.on('task_accepted', async (data) => {
      try {
        const { taskId } = data;

        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: { createdBy: true, assignedTo: true },
        });

        // Notify task creator
        if (userSockets.has(task.createdById)) {
          const creatorSockets = userSockets.get(task.createdById);
          creatorSockets.forEach((socketId) => {
            io.to(socketId).emit('task_accepted_notification', {
              taskId,
              helperId: socket.userId,
              message: `${task.assignedTo.name} has accepted your task`,
            });
          });
        }
      } catch (error) {
        console.error('Task accepted notification error:', error);
      }
    });

    /**
     * PAYMENT SUCCESS (real-time)
     */
    socket.on('payment_completed', async (data) => {
      try {
        const { taskId, amount, payeeId } = data;

        // Notify payee
        if (userSockets.has(payeeId)) {
          const payeeSockets = userSockets.get(payeeId);
          payeeSockets.forEach((socketId) => {
            io.to(socketId).emit('payment_notification', {
              taskId,
              amount,
              message: `Payment of ₹${(amount / 100).toFixed(2)} received!`,
            });
          });
        }
      } catch (error) {
        console.error('Payment notification error:', error);
      }
    });

    /**
     * LEAVE TASK ROOM
     */
    socket.on('leave_task', ({ taskId }) => {
      const room = `task_${taskId}`;
      socket.leave(room);
      console.log(`User ${socket.userId} left task room ${taskId}`);

      io.to(room).emit('user_left', { userId: socket.userId });
    });

    /**
     * DISCONNECT
     */
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);

      // Remove socket from user's list
      if (userSockets.has(socket.userId)) {
        const userSocketList = userSockets.get(socket.userId);
        const index = userSocketList.indexOf(socket.id);
        if (index > -1) {
          userSocketList.splice(index, 1);
        }

        // Remove user from active if no more sockets
        if (userSocketList.length === 0) {
          userSockets.delete(socket.userId);
          io.emit('user_offline', { userId: socket.userId });
        }
      }
    });
  });

  return io;
};

export default { initializeSocket };
