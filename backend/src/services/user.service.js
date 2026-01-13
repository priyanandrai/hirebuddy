import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const setRoleService = (userId, role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
};

export const updateHelperProfileService = (userId, data) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      role: "HELPER",
    },
  });
};

export const getHelper = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });
};
export const getHelpersListService = async (req, res) => {
  try {
    const helpers = await prisma.user.findMany({
      where: {
        role: "HELPER",
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        skills: true,
        // rating: true,
        city: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: helpers,
    });
  } catch (error) {
    console.log("fetch all helpere error",error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch helpers",
    });
  }
};

// export const getHelperTaskCountsForUser = async (userId) => {
//   return prisma.task.groupBy({
//     by: ["assignedToId"],
//     where: {
//       createdById: userId,
//       assignedToId: {
//         not: null, // only assigned tasks
//       },
//     },
//     count: {
//      all: true, // total tasks per helper
//     },
//   });
// };

