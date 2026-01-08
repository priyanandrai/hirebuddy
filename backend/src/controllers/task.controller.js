import * as taskService from "../services/task.service.js";

export const createTask = async (req, res) => {
    console.log("res=q user", req.user);
    
  const task = await taskService.createTask(req.body,req.user);
  res.status(201).json(task);
};

export const getMyTasks = async (req, res) => {
  const tasks = await taskService.getUserTasks(req.user.id);
  res.json(tasks);
};

export const acceptTask = async (req, res) => {
  const task = await taskService.assignHelper(req.user, req.params.id);
  res.json(task);
};

export const getCategories = async (req, res) => {
  res.json([
    "Cleaning",
    "Delivery",
    "Electrician",
    "Plumbing",
    "Grocery",
    "Moving",
  ]);
};

export const getTaskById = async (req, res) => {
    console.log("req.params ", req.params.id);
    
    const task = await taskService.getTaskById(req.user, req.params.id);
    console.log("task ", task);
    
    res.json(task);
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
