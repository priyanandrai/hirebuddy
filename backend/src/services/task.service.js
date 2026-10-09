import prisma from "../utils/prisma.js";
import { notificationEvents } from "./notification.service.js";
import { indexTask, deleteTask } from "./es.client.js";
import { emitToTaskRoom, emitToUser } from "../config/socket.config.js";

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Create a new task
 */
export const createTask = async (data, user) => {
  const {
    title,
    description,
    category = "General",
    location = "To be coordinated",
    latitude,
    longitude,
    budget,
    preferredAt,
    helperId,
  } = data;

  const isDirectRequest = Boolean(helperId);

  const task = await prisma.task.create({
    data: {
      title,
      description,
      category: category || "General",
      location: location || "To be coordinated",
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      budget: Number(budget || 0),
      preferredAt: preferredAt ? new Date(preferredAt) : null,
      createdById: user.id,
      assignedToId: helperId || null,
      status: isDirectRequest ? "REQUESTED" : "OPEN",
      paymentStatus: "PENDING",
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true, phone: true } },
      assignedTo: { select: { id: true, name: true, image: true, phone: true } },
    },
  });

  if (isDirectRequest && helperId) {
    try {
      await notificationEvents.taskRequested(task.id, user.id, helperId);
      emitToUser(helperId, 'task_requested', {
        taskId: task.id,
        task,
        customerName: user.name || 'A customer',
        message: `${user.name || 'A customer'} requested you for "${task.title}"`,
      });
    } catch (notifErr) {
      console.warn('Failed to send task requested alert:', notifErr?.message);
    }
  }

  return task;
};

// Hook: index after create
const _originalCreateTask = createTask;
export const createTaskAndIndex = async (data, user) => {
  const task = await _originalCreateTask(data, user);
  try {
    await indexTask(task);
  } catch (e) {
    console.error('Failed to index task after create', e);
  }
  return task;
};

/**
 * Get tasks created by user
 */
export const getUserTasks = (userId) => {
  return prisma.task.findMany({
    where: { createdById: userId },
    include: {
      assignedTo: { select: { id: true, name: true, image: true } },
      createdBy: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Find nearby tasks for a helper (location-based discovery)
 */
export const findNearbyTasks = async (helperId, radiusKm = 5, limit = 20, offset = 0) => {
  try {
    // Get helper's location
    const helper = await prisma.user.findUnique({
      where: { id: helperId },
      select: { latitude: true, longitude: true, skills: true },
    });

    if (!helper || !helper.latitude || !helper.longitude) {
      throw new Error("Helper location not set");
    }

    // Get open tasks
    const allTasks = await prisma.task.findMany({
      where: { status: "OPEN", assignedToId: null },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000, // Fetch many to filter by distance
    });

    // Filter by distance
    const nearbyTasks = allTasks
      .filter((task) => {
        if (!task.latitude || !task.longitude) return false;
        const distance = calculateDistance(
          helper.latitude,
          helper.longitude,
          task.latitude,
          task.longitude
        );
        return distance <= radiusKm;
      })
      .slice(offset, offset + limit);

    return {
      tasks: nearbyTasks,
      total: allTasks.filter((task) => {
        if (!task.latitude || !task.longitude) return false;
        const distance = calculateDistance(
          helper.latitude,
          helper.longitude,
          task.latitude,
          task.longitude
        );
        return distance <= radiusKm;
      }).length,
      radiusKm,
      limit,
      offset,
    };
  } catch (error) {
    console.error("Failed to find nearby tasks:", error);
    throw error;
  }
};

/**
 * Search tasks by category and location
 */
export const searchTasks = async (filters = {}) => {
  try {
    const {
      category,
      city,
      latitude,
      longitude,
      radiusKm = 5,
      status,
      sortBy = "createdAt",
      limit = 20,
      offset = 0,
    } = filters;

    const where = {};

    if (status && status !== "ALL") where.status = status;
    if (category && category !== "ALL") where.category = category;
    if (city && city !== "ALL") where.city = city;

    let tasks = await prisma.task.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        assignedTo: { select: { id: true, name: true, image: true } },
      },
      orderBy: { [sortBy]: "desc" },
      take: 1000,
    });

    // Filter by distance if coordinates provided
    if (latitude && longitude) {
      tasks = tasks.filter((task) => {
        if (!task.latitude || !task.longitude) return false;
        const distance = calculateDistance(latitude, longitude, task.latitude, task.longitude);
        return distance <= radiusKm;
      });
    }

    return {
      tasks: tasks.slice(offset, offset + limit),
      total: tasks.length,
      limit,
      offset,
    };
  } catch (error) {
    console.error("Failed to search tasks:", error);
    throw error;
  }
};

/**
 * Accept a task as a helper
 */
export const assignHelper = async (user, taskId) => {
  if (user.role !== "HELPER") {
    throw new Error("Only helpers can accept tasks");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      status: true,
      createdById: true,
      assignedToId: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.createdById === user.id) {
    throw new Error("You cannot accept your own task");
  }

  // Two valid cases for helper acceptance:
  // 1. OPEN task on public marketplace with no assigned helper
  // 2. REQUESTED direct booking where this user is the designated helper (assignedToId === user.id)
  const isMarketplaceOpen = task.status === "OPEN" && !task.assignedToId;
  const isDirectRequestForUser = task.status === "REQUESTED" && task.assignedToId === user.id;

  if (!isMarketplaceOpen && !isDirectRequestForUser) {
    throw new Error("Task is not available for acceptance");
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      assignedToId: user.id,
      status: "ASSIGNED",
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true, phone: true } },
      assignedTo: { select: { id: true, name: true, image: true, phone: true } },
    },
  });

  // Send notification to customer
  await notificationEvents.taskAccepted(taskId, user.id, task.createdById);
  try {
    emitToTaskRoom(taskId, 'task_status_changed', { taskId, newStatus: 'ASSIGNED' });
    emitToUser(task.createdById, 'task_status_changed', { taskId, newStatus: 'ASSIGNED' });
  } catch (e) {
    console.warn('Socket emit error:', e?.message);
  }

  return updatedTask;
};

/**
 * Decline a direct booking request as helper
 */
export const declineHelperRequest = async (user, taskId, reason = "Helper is unavailable") => {
  if (user.role !== "HELPER") {
    throw new Error("Only helpers can decline tasks");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      status: true,
      createdById: true,
      assignedToId: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.assignedToId !== user.id) {
    throw new Error("You are not the designated helper for this task");
  }

  if (task.status !== "REQUESTED" && task.status !== "ASSIGNED") {
    throw new Error("Task cannot be declined at this stage");
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "CANCELLED",
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true, phone: true } },
      assignedTo: { select: { id: true, name: true, image: true, phone: true } },
    },
  });

  try {
    await notificationEvents.taskDeclined(taskId, user.id, task.createdById, reason);
    emitToTaskRoom(taskId, 'task_status_changed', { taskId, newStatus: 'CANCELLED' });
    emitToUser(task.createdById, 'task_status_changed', { taskId, newStatus: 'CANCELLED' });
  } catch (e) {
    console.warn('Decline notification error:', e?.message);
  }

  return updatedTask;
};

/**
 * Get task by ID
 */
export const getTaskById = async (userId, taskId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          phone: true,
          image: true,
          averageRating: true,
          totalReviews: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          phone: true,
          image: true,
        },
      },
      messages: { select: { id: true } },
      reviews: { select: { id: true } },
      payments: { select: { id: true, status: true } },
    },
  });

  if (!task) {
    return null;
  }

  const isOwner = task.createdById === userId;
  const isAssignee = task.assignedToId === userId;

  if (!isOwner && !isAssignee) {
    return null;
  }

  return task;
};

/**
 * Get tasks assigned to a helper
 */
export const getTasksAssignedToHelper = (helperId) => {
  return prisma.task.findMany({
    where: {
      assignedToId: helperId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          image: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Get tasks created by user
 */
export const getTasksCreatedByUser = (userId) => {
  return prisma.task.findMany({
    where: {
      createdById: userId,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Update task status
 */
export const updateTaskStatus = async (taskId, userId, newStatus) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { createdBy: true, assignedTo: true },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const isOwner = task.createdById === userId;
    const isAssignee = task.assignedToId === userId;

    if (!isOwner && !isAssignee) {
      throw new Error("You are not authorized to update this task");
    }

    // Validate status transitions
    const validTransitions = {
      OPEN: ["ASSIGNED", "CANCELLED"],
      REQUESTED: ["ASSIGNED", "CANCELLED"],
      ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[task.status]?.includes(newStatus)) {
      throw new Error(`Cannot transition from ${task.status} to ${newStatus}`);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completedAt: newStatus === "COMPLETED" ? new Date() : null,
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        assignedTo: { select: { id: true, name: true, image: true } },
      },
    });

    // Send notifications based on status change
    const otherUserId = userId === task.createdById ? task.assignedToId : task.createdById;
    if (newStatus === "IN_PROGRESS" && otherUserId) {
      await notificationEvents.taskStarted(taskId, userId, otherUserId);
    } else if (newStatus === "COMPLETED" && otherUserId) {
      await notificationEvents.taskCompleted(taskId, userId, otherUserId);
    } else if (newStatus === "CANCELLED" && otherUserId) {
      await notificationEvents.taskCancelled(taskId, userId, otherUserId);
    }

    try {
      emitToTaskRoom(taskId, 'task_status_changed', { taskId, newStatus });
    } catch (e) {
      console.warn('Socket emitToTaskRoom error:', e?.message);
    }

    return updatedTask;
  } catch (error) {
    console.error("Failed to update task status:", error);
    throw error;
  }
};

// Index task after status update
export const updateTaskStatusAndIndex = async (taskId, userId, newStatus) => {
  const updated = await updateTaskStatus(taskId, userId, newStatus);
  try {
    await indexTask(updated);
  } catch (e) {
    console.error('Failed to index task after status update', e);
  }
  return updated;
};

/**
 * Cancel a task
 */
export const cancelTask = async (taskId, userId, reason = "Task cancelled by user") => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.createdById !== userId) {
      throw new Error("Only task creator can cancel");
    }

    if (task.status === "COMPLETED") {
      throw new Error("Cannot cancel completed tasks");
    }

    return updateTaskStatus(taskId, userId, "CANCELLED");
  } catch (error) {
    console.error("Failed to cancel task:", error);
    throw error;
  }
};

export const deleteTaskAndRemoveIndex = async (taskId) => {
  // delete from DB
  const deleted = await prisma.task.delete({ where: { id: taskId } });
  try {
    await deleteTask(taskId);
  } catch (e) {
    console.error('Failed to remove task from index', e);
  }
  return deleted;
};

/**
 * Get task statistics
 */
export const getTaskStats = async (userId) => {
  try {
    const tasksCreated = await prisma.task.count({
      where: { createdById: userId },
    });

    const tasksAssigned = await prisma.task.count({
      where: { assignedToId: userId },
    });

    const tasksCompleted = await prisma.task.count({
      where: { assignedToId: userId, status: "COMPLETED" },
    });

    const tasksInProgress = await prisma.task.count({
      where: { assignedToId: userId, status: "IN_PROGRESS" },
    });

    return {
      tasksCreated,
      tasksAssigned,
      tasksCompleted,
      tasksInProgress,
      completionRate: tasksAssigned > 0 ? ((tasksCompleted / tasksAssigned) * 100).toFixed(2) : 0,
    };
  } catch (error) {
    console.error("Failed to fetch task stats:", error);
    throw error;
  }
};

export default {
  createTask,
  getUserTasks,
  findNearbyTasks,
  searchTasks,
  assignHelper,
  getTaskById,
  getTasksAssignedToHelper,
  getTasksCreatedByUser,
  updateTaskStatus,
  cancelTask,
  getTaskStats,
  calculateDistance,
};
