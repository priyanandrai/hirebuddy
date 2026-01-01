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
