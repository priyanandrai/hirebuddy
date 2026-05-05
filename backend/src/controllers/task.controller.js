import * as taskService from "../services/task.service.js";

export const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.body, req.user);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to create task" });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const tasks = await taskService.getUserTasks(req.user.id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

export const acceptTask = async (req, res) => {
  try {
    const task = await taskService.assignHelper(req.user, req.params.id);
    res.json(task);
  } catch (error) {
    const statusCode =
      error.message === "Task not found"
        ? 404
        : error.message === "Only helpers can accept tasks"
          ? 403
          : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  res.json([
    "Cleaning",
    "Delivery",
    "Electrician",
    "Plumbing",
    "Grocery",
    "Moving",
    "Laundry",
    "Tutoring",
    "Fitness",
    "Other",
  ]);
};

export const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.user.id, req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task" });
  }
};

export const getAssignedTasks = async (req, res) => {
  try {
    // 🔒 Only helpers allowed
    if (req.user.role !== "HELPER") {
      return res.status(403).json({ message: "Only helpers can access this" });
    }

    const tasks = await taskService.getTasksAssignedToHelper(req.user.id);
    res.json(tasks);
  } catch (error) {
    console.error("Get assigned tasks error:", error);
    res.status(500).json({ message: "Failed to fetch assigned tasks" });
  }
};

export const getCreatedTasks = async (req, res) => {
  try {
    const tasks = await taskService.getTasksCreatedByUser(req.user.id);
    res.json(tasks);
  } catch (error) {
    console.error("Get created tasks error:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

/**
 * Find nearby tasks for a helper (location-based discovery)
 */
export const getNearbyTasks = async (req, res) => {
  try {
    if (req.user.role !== "HELPER") {
      return res.status(403).json({ message: "Only helpers can view nearby tasks" });
    }

    const { radiusKm = 5, limit = 20, offset = 0 } = req.query;

    const result = await taskService.findNearbyTasks(
      req.user.id,
      parseInt(radiusKm),
      parseInt(limit),
      parseInt(offset)
    );

    res.json(result);
  } catch (error) {
    console.error("Get nearby tasks error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch nearby tasks" });
  }
};

/**
 * Search tasks with filters
 */
export const searchTasks = async (req, res) => {
  try {
    const { category, city, latitude, longitude, radiusKm = 5, status = "OPEN", limit = 20, offset = 0 } = req.query;

    const result = await taskService.searchTasks({
      category,
      city,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      radiusKm: parseInt(radiusKm),
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json(result);
  } catch (error) {
    console.error("Search tasks error:", error);
    res.status(500).json({ message: "Failed to search tasks" });
  }
};

/**
 * Update task status
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const task = await taskService.updateTaskStatus(id, req.user.id, status);

    res.json(task);
  } catch (error) {
    console.error("Update task status error:", error);
    const statusCode = error.message === "Task not found" ? 404 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Cancel a task
 */
export const cancelTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const task = await taskService.cancelTask(id, req.user.id, reason);

    res.json(task);
  } catch (error) {
    console.error("Cancel task error:", error);
    const statusCode = error.message === "Task not found" ? 404 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Get task statistics for a user
 */
export const getTaskStats = async (req, res) => {
  try {
    const stats = await taskService.getTaskStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error("Get task stats error:", error);
    res.status(500).json({ message: "Failed to fetch task statistics" });
  }
};
