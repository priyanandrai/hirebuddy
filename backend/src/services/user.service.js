import prisma from "../utils/prisma.js";
import bcrypt from "bcrypt";
import { indexHelper, deleteHelper } from "./es.client.js";

export const setRoleService = (userId, role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
};

export const updateHelperProfileService = (userId, rawData) => {
  const data = {};
  if (rawData.name !== undefined) {
    data.name = rawData.name;
  } else if (rawData.firstName || rawData.lastName) {
    data.name = `${rawData.firstName || ""} ${rawData.lastName || ""}`.trim();
  }
  if (rawData.phone !== undefined) data.phone = rawData.phone;
  if (rawData.city !== undefined) data.city = rawData.city;
  if (rawData.address !== undefined) data.address = rawData.address;
  if (rawData.image !== undefined) data.image = rawData.image;
  if (rawData.skills !== undefined) {
    data.skills = Array.isArray(rawData.skills) ? rawData.skills.join(", ") : rawData.skills;
  } else if (rawData.services !== undefined) {
    data.skills = Array.isArray(rawData.services) ? rawData.services.join(", ") : rawData.services;
  }
  if (rawData.experience !== undefined) data.experience = Number(rawData.experience) || 0;
  if (rawData.hourlyRate !== undefined) data.hourlyRate = Number(rawData.hourlyRate) || 0;
  if (rawData.isAvailable !== undefined) data.isAvailable = Boolean(rawData.isAvailable);
  if (rawData.latitude !== undefined && rawData.latitude !== null) data.latitude = Number(rawData.latitude);
  if (rawData.longitude !== undefined && rawData.longitude !== null) data.longitude = Number(rawData.longitude);

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

export const submitIdDocumentService = async (userId, payload = {}) => {
  const data = typeof payload === "string" ? { idDocumentUrl: payload } : payload;
  const { idDocumentUrl, addressProofUrl, image, selfieUrl, idDocumentType, addressProofType } = data;

  const updateData = {
    idVerificationStatus: "PENDING",
  };
  if (idDocumentUrl) updateData.idDocumentUrl = idDocumentUrl;
  if (addressProofUrl) updateData.addressProofUrl = addressProofUrl;
  if (image || selfieUrl) updateData.image = image || selfieUrl;
  if (idDocumentType) updateData.idDocumentType = idDocumentType;
  if (addressProofType) updateData.addressProofType = addressProofType;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  try { await indexHelper(user); } catch (e) { console.error("Index after ID submit failed", e); }
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

export const getMyProfileService = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      city: true,
      address: true,
      skills: true,
      experience: true,
      hourlyRate: true,
      isAvailable: true,
      averageRating: true,
      totalReviews: true,
      walletBalance: true,
      idVerificationStatus: true,
      idDocumentUrl: true,
      addressProofUrl: true,
      idDocumentType: true,
      addressProofType: true,
      idVerifiedAt: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const tasksCompleted = await prisma.task.count({
    where: {
      assignedToId: userId,
      status: "COMPLETED",
    },
  });

  return {
    ...user,
    tasksCompleted,
  };
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
      email: true,
      phone: true,
      image: true,
      city: true,
      skills: true,
      idDocumentUrl: true,
      idDocumentType: true,
      addressProofUrl: true,
      addressProofType: true,
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

export const getAllUsersService = async ({ role, search, limit = 50, offset = 0 } = {}) => {
  const where = {};
  if (role) {
    where.role = role;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit) || 50,
      skip: Number(offset) || 0,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        city: true,
        address: true,
        skills: true,
        experience: true,
        hourlyRate: true,
        averageRating: true,
        totalReviews: true,
        walletBalance: true,
        isAvailable: true,
        idVerificationStatus: true,
        idDocumentUrl: true,
        createdAt: true,
        _count: {
          select: {
            tasksCreated: true,
            tasksAssigned: true,
          },
        },
      },
    }),
  ]);

  return { total, users };
};

export const updateUserRoleService = async (userId, role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
};

export const deleteUserService = async (userId) => {
  return prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    });
    await tx.message.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    });
    await tx.review.deleteMany({
      where: { OR: [{ givenById: userId }, { givenToId: userId }] },
    });
    await tx.payment.deleteMany({
      where: { OR: [{ payerId: userId }, { payeeId: userId }] },
    });
    await tx.task.updateMany({
      where: { assignedToId: userId },
      data: { assignedToId: null, status: "OPEN" },
    });
    await tx.task.deleteMany({
      where: { createdById: userId },
    });
    return tx.user.delete({
      where: { id: userId },
    });
  });
};

export const createHelperService = async ({
  name,
  phone,
  password,
  email,
  city,
  skills,
  hourlyRate,
  isVerified = true,
}) => {
  const digitsOnly = String(phone || "").replace(/\D/g, "");
  const cleanPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

  if (!cleanPhone || cleanPhone.length !== 10) {
    throw new Error("A valid 10-digit mobile number is required");
  }

  if (!password || password.trim().length < 4) {
    throw new Error("Password must be at least 4 characters long");
  }

  // Check if user already exists
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: cleanPhone },
        ...(email ? [{ email: email.trim().toLowerCase() }] : []),
      ],
    },
  });

  if (existing) {
    throw new Error(
      `A user with this ${existing.phone === cleanPhone ? 'mobile number' : 'email'} already exists (${existing.role || 'USER'})`
    );
  }

  const hashedPassword = await bcrypt.hash(password.trim(), 10);
  const helperEmail = email?.trim()?.toLowerCase() || `${cleanPhone}@hirebuddy.local`;

  const user = await prisma.user.create({
    data: {
      name: name?.trim() || "Helper Partner",
      phone: cleanPhone,
      email: helperEmail,
      password: hashedPassword,
      role: "HELPER",
      city: city?.trim() || "Meerut, UP",
      skills: skills?.trim() || "General Helper",
      hourlyRate: hourlyRate ? Number(hourlyRate) * 100 : null,
      isAvailable: true,
      idVerificationStatus: isVerified ? "VERIFIED" : "PENDING",
      idVerifiedAt: isVerified ? new Date() : null,
      idVerificationNotes: isVerified ? "Account created and verified directly by Administrator" : null,
    },
  });

  try {
    await indexHelper(user);
  } catch (err) {
    console.warn("Index helper failed:", err.message);
  }

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    city: user.city,
    skills: user.skills,
    idVerificationStatus: user.idVerificationStatus,
    createdAt: user.createdAt,
  };
};


