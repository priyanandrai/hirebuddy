import prisma from "../utils/prisma.js";

export const createTask = (data, user) => {
  const {
    title,
    description,
    category,
    location,
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
      budget: Number(budget),
      preferredAt: preferredAt ? new Date(preferredAt) : null,
      createdById: user.id,
      assignedToId: helperId || null,
      status: helperId ? "ASSIGNED" : "OPEN",
    },
  });
};

export const getUserTasks = (userId) => {
  return prisma.task.findMany({
    where: { createdById: userId },
    include: { assignedTo: true },
    orderBy: { createdAt: "desc" },
  });
};

export const assignHelper = async (user, taskId) => {
  if (user.role !== "HELPER") {
    throw new Error("Only helpers can accept tasks");
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      assignedToId: user.id,
      status: "ASSIGNED",
    },
  });
};
