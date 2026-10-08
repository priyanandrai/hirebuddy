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

export const getHelper = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      city: true,
      address: true,
      latitude: true,
      longitude: true,
      skills: true,
      experience: true,
      hourlyRate: true,
      isAvailable: true,
      averageRating: true,
      totalReviews: true,
      idVerificationStatus: true,
      idDocumentUrl: true,
      idVerifiedAt: true,
      createdAt: true,
    },
  });
  if (!user) return null;
  return {
    ...user,
    isVerified: user.idVerificationStatus === 'VERIFIED',
    skills: Array.isArray(user.skills) ? user.skills : (user.skills ? String(user.skills).split(',').map(s => s.trim()).filter(Boolean) : []),
  };
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

export const searchHelpersDbService = async (params = {}) => {
  const {
    q,
    city,
    isAvailable,
    isVerified,
    minRating,
    maxPrice,
    sort = 'relevance',
    limit = 20,
    offset = 0,
  } = params;

  const where = {
    role: "HELPER",
  };

  const andConditions = [];

  if (q && q.trim()) {
    const term = q.trim();
    andConditions.push({
      OR: [
        { name: { contains: term } },
        { skills: { contains: term } },
        { city: { contains: term } },
      ],
    });
  }

  if (city && city.trim()) {
    andConditions.push({
      city: { contains: city.trim() },
    });
  }

  if (isAvailable === 'true' || isAvailable === true) {
    where.isAvailable = true;
  }

  if (isVerified === 'true' || isVerified === true) {
    where.idVerificationStatus = 'VERIFIED';
  }

  if (minRating && !isNaN(Number(minRating))) {
    where.averageRating = { gte: Number(minRating) };
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    const paise = Number(maxPrice) > 1000 ? Number(maxPrice) : Number(maxPrice) * 100;
    where.hourlyRate = { lte: paise };
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  let orderBy = [{ averageRating: "desc" }, { totalReviews: "desc" }];
  if (sort === 'price_low') {
    orderBy = [{ hourlyRate: "asc" }];
  } else if (sort === 'price_high') {
    orderBy = [{ hourlyRate: "desc" }];
  } else if (sort === 'rating_high') {
    orderBy = [{ averageRating: "desc" }];
  } else if (sort === 'reviews_high') {
    orderBy = [{ totalReviews: "desc" }];
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        city: true,
        latitude: true,
        longitude: true,
        skills: true,
        experience: true,
        hourlyRate: true,
        averageRating: true,
        totalReviews: true,
        isAvailable: true,
        idVerificationStatus: true,
      },
    }),
  ]);

  return {
    total,
    helpers: rows.map((r) => ({
      ...r,
      isVerified: r.idVerificationStatus === 'VERIFIED',
      skills: Array.isArray(r.skills)
        ? r.skills
        : (r.skills ? String(r.skills).split(',').map((s) => s.trim()).filter(Boolean) : []),
    })),
  };
};


