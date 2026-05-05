import prisma from "../utils/prisma.js";
import { notificationEvents } from "./notification.service.js";

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
    category,
    location,
    latitude,
    longitude,
    budget,
    preferredAt,
    helperId,
  } = data;

  return prisma.task.create({
    data: {
      title,
      description,
      category,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      budget: Number(budget),
      preferredAt: preferredAt ? new Date(preferredAt) : null,
      createdById: user.id,
      assignedToId: helperId || null,
      status: helperId ? "ASSIGNED" : "OPEN",
      paymentStatus: "PENDING",
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      assignedTo: { select: { id: true, name: true, image: true } },
    },
  });
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
      status = "OPEN",
      sortBy = "createdAt",
      limit = 20,
      offset = 0,
    } = filters;

    const where = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (city) where.city = city;

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

  if (task.status !== "OPEN" || task.assignedToId) {
    throw new Error("Task is not available for acceptance");
  }

  if (task.createdById === user.id) {
    throw new Error("You cannot accept your own task");
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      assignedToId: user.id,
      status: "ASSIGNED",
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      assignedTo: { select: { id: true, name: true, image: true } },
    },
  });

  // Send notification
  await notificationEvents.taskAccepted(taskId, user.id, task.createdById);

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
          image: true,
          averageRating: true,
          totalReviews: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
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
    if (newStatus === "IN_PROGRESS") {
      await notificationEvents.taskStarted(taskId, task.assignedToId, task.createdById);
    } else if (newStatus === "COMPLETED") {
      await notificationEvents.taskCompleted(taskId, task.assignedToId, task.createdById);
    } else if (newStatus === "CANCELLED") {
      const otherUserId = userId === task.createdById ? task.assignedToId : task.createdById;
      if (otherUserId) {
        await notificationEvents.taskCancelled(taskId, userId, otherUserId);
      }
    }

    return updatedTask;
  } catch (error) {
    console.error("Failed to update task status:", error);
    throw error;
  }
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
