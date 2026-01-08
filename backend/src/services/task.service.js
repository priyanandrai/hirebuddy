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

// task.service.js
export const getTaskById = ( userId,taskId) => {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        createdById: userId.id, // 🔒 security
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  };

  import prisma from "../utils/prisma.js";

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
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  };

  
  
