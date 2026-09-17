import prisma from "../utils/prisma.js";
import { indexHelper, deleteHelper } from "./es.client.js";

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
  }).then(async (user) => {
    try {
      await indexHelper(user);
    } catch (e) {
      console.error('Failed to index helper after update', e);
    }
    return user;
  });
};

export const submitIdDocumentService = async (userId, idDocumentUrl) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      idDocumentUrl,
      idVerificationStatus: 'PENDING',
    },
  });

  try { await indexHelper(user); } catch (e) { console.error('Index after ID submit failed', e); }
  return user;
};

export const verifyUserIdService = async (userId, status, notes = null) => {
  const data = {
    idVerificationStatus: status,
    idVerificationNotes: notes,
    idVerifiedAt: status === 'VERIFIED' ? new Date() : null,
  };

  const user = await prisma.user.update({ where: { id: userId }, data });
  try { await indexHelper(user); } catch (e) { console.error('Index after ID verify failed', e); }
  return user;
};

export const getHelper = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      role: true,
      idVerificationStatus: true,
    },
  });
};
export const getHelpersListService = async () => {
  const rows = await prisma.user.findMany({
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
      city: true,
      experience: true,
      idVerificationStatus: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // normalize skills to array for frontend
  return rows.map((r) => ({
    ...r,
    skills: Array.isArray(r.skills) ? r.skills : (r.skills ? String(r.skills).split(',').map(s => s.trim()).filter(Boolean) : []),
  }));
};

export const getPendingIdSubmissionsService = async () => {
  return prisma.user.findMany({
    where: { idVerificationStatus: 'PENDING' },
    select: {
      id: true,
      name: true,
      phone: true,
      image: true,
      city: true,
      idDocumentUrl: true,
      idVerificationStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
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

