import * as taskService from "../services/task.service.js";

export const createTask = async (req, res) => {
  const task = await taskService.createTask(req.user, req.body);
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
