import prisma from "../utils/prisma.js";
import bcrypt from "bcrypt";
import { indexHelper, deleteHelper } from "./es.client.js";

export const setRoleService = (userId, role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
};

export const updateMyProfileService = async (userId, rawData = {}) => {
  const data = {};

  if (rawData.name !== undefined) {
    data.name = String(rawData.name).trim();
  } else if (rawData.firstName || rawData.lastName) {
    data.name = `${rawData.firstName || ""} ${rawData.lastName || ""}`.trim();
  }

  if (rawData.email !== undefined) {
    const cleanEmail = String(rawData.email || "").trim().toLowerCase();
    if (cleanEmail) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          NOT: { id: userId },
        },
      });
      if (existingEmail) {
        throw new Error("This email address is already linked to another account.");
      }
      data.email = cleanEmail;
    }
  }

  if (rawData.phone !== undefined) {
    const digitsOnly = String(rawData.phone || "").replace(/\D/g, "");
    const cleanPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
    if (cleanPhone) {
      if (cleanPhone.length !== 10) {
        throw new Error("Please enter a valid 10-digit mobile number.");
      }
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: cleanPhone,
          NOT: { id: userId },
        },
      });
      if (existingPhone) {
        throw new Error("This mobile number is already linked to another account.");
      }
      data.phone = cleanPhone;
    }
  }

  if (rawData.city !== undefined) {
    data.city = rawData.city ? String(rawData.city).trim() : null;
  }
  if (rawData.address !== undefined) {
    data.address = rawData.address ? String(rawData.address).trim() : null;
  }
  if (rawData.image !== undefined) {
    data.image = rawData.image || null;
  }
  if (rawData.latitude !== undefined && rawData.latitude !== null && rawData.latitude !== "") {
    data.latitude = Number(rawData.latitude);
  }
  if (rawData.longitude !== undefined && rawData.longitude !== null && rawData.longitude !== "") {
    data.longitude = Number(rawData.longitude);
  }
  if (rawData.skills !== undefined) {
    data.skills = Array.isArray(rawData.skills) ? rawData.skills.join(", ") : rawData.skills;
  }
  if (rawData.experience !== undefined && rawData.experience !== "") {
    data.experience = Number(rawData.experience) || 0;
  }
  if (rawData.hourlyRate !== undefined && rawData.hourlyRate !== "") {
    data.hourlyRate = Number(rawData.hourlyRate) || 0;
  }
  if (rawData.isAvailable !== undefined) {
    data.isAvailable = Boolean(rawData.isAvailable);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
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
      walletBalance: true,
      idVerificationStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (user.role === "HELPER") {
    try {
      await indexHelper(user);
    } catch (e) {
      console.error("Failed to index helper after profile update", e);
    }
  }

  return user;
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
  if (userId === "admin") {
    return {
      id: "admin",
      name: "System Admin",
      email: "admin@hirebuddy.com",
      role: "ADMIN",
      city: "Meerut",
      isAvailable: true,
      idVerificationStatus: "VERIFIED",
      tasksCompleted: 0,
    };
  }

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
      latitude: true,
      longitude: true,
      skills: true,
      experience: true,
      hourlyRate: true,
      isAvailable: true,
      averageRating: true,
      totalReviews: true,
      walletBalance: true,
      partnerPlanType: true,
      subscriptionActiveUntil: true,
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
  const selectFields = {
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
  };

  let user = await prisma.user.findUnique({
    where: { id },
    select: selectFields,
  });

  if (!user && id) {
    const slugLower = String(id).toLowerCase();
    const helpers = await prisma.user.findMany({
      where: { role: "HELPER" },
      select: selectFields,
      orderBy: [{ idVerificationStatus: "desc" }, { createdAt: "desc" }],
    });
    user =
      helpers.find((h) => {
        const nameLow = String(h.name || "").toLowerCase();
        const skillLow = String(h.skills || "").toLowerCase();
        if (slugLower.includes("priya") || slugLower.includes("clean"))
          return skillLow.includes("clean") || nameLow.includes("prreto");
        if (slugLower.includes("driver") || slugLower.includes("ravinder"))
          return skillLow.includes("driver") || nameLow.includes("ravinder");
        if (slugLower.includes("deliver") || slugLower.includes("rahul"))
          return skillLow.includes("courier") || skillLow.includes("deliver") || nameLow.includes("aman");
        if (slugLower.includes("plumb")) return skillLow.includes("plumb") || skillLow.includes("repair");
        if (slugLower.includes("electr")) return skillLow.includes("electr") || skillLow.includes("appliance");
        if (slugLower.includes("cook") || slugLower.includes("meena"))
          return skillLow.includes("cook") || nameLow.includes("shanti");
        if (slugLower.includes("furniture") || slugLower.includes("moving"))
          return skillLow.includes("furniture") || skillLow.includes("assembly");
        return false;
      }) || helpers[0] || null;
  }

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
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      skills: true,
      city: true,
      address: true,
      experience: true,
      hourlyRate: true,
      isAvailable: true,
      averageRating: true,
      totalReviews: true,
      walletBalance: true,
      partnerPlanType: true,
      subscriptionActiveUntil: true,
      idVerificationStatus: true,
      idDocumentUrl: true,
      addressProofUrl: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // normalize skills to array for frontend
  return rows.map((r) => ({
    ...r,
    isVerified: r.idVerificationStatus === "VERIFIED",
    skills: Array.isArray(r.skills)
      ? r.skills
      : r.skills
      ? String(r.skills)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
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
    where.role = role === "CUSTOMER" ? "USER" : role;
  }
  if (search) {
    const term = String(search).trim();
    if (term) {
      where.OR = [
        { name: { contains: term } },
        { phone: { contains: term } },
        { email: { contains: term } },
        { city: { contains: term } },
      ];
    }
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
    await tx.partnerSubscription.deleteMany({
      where: { userId },
    });
    await tx.supportTicket.deleteMany({
      where: { userId },
    });

    const seller = await tx.sellerProfile.findUnique({ where: { userId } });
    if (seller) {
      const sellerOrders = await tx.marketplaceOrder.findMany({
        where: { sellerId: seller.id },
        select: { id: true },
      });
      if (sellerOrders.length > 0) {
        await tx.marketplaceOrderItem.deleteMany({
          where: { orderId: { in: sellerOrders.map((o) => o.id) } },
        });
        await tx.marketplaceOrder.deleteMany({
          where: { sellerId: seller.id },
        });
      }
      await tx.settlementBatch.deleteMany({ where: { sellerId: seller.id } });
      await tx.product.deleteMany({ where: { sellerId: seller.id } });
      await tx.sellerProfile.delete({ where: { id: seller.id } });
    }

    const custOrders = await tx.marketplaceOrder.findMany({
      where: { customerId: userId },
      select: { id: true },
    });
    if (custOrders.length > 0) {
      await tx.marketplaceOrderItem.deleteMany({
        where: { orderId: { in: custOrders.map((o) => o.id) } },
      });
      await tx.marketplaceOrder.deleteMany({
        where: { customerId: userId },
      });
    }

    await tx.task.updateMany({
      where: { assignedToId: userId },
      data: { assignedToId: null, status: "OPEN" },
    });

    const userCreatedTasks = await tx.task.findMany({
      where: { createdById: userId },
      select: { id: true },
    });
    if (userCreatedTasks.length > 0) {
      const taskIds = userCreatedTasks.map((t) => t.id);
      await tx.notification.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.message.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.review.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.payment.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.marketplaceOrder.updateMany({
        where: { deliveryTaskId: { in: taskIds } },
        data: { deliveryTaskId: null },
      });
      await tx.task.deleteMany({ where: { id: { in: taskIds } } });
    }

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
  const normalizedSkills = Array.isArray(skills)
    ? skills.map((s) => String(s).trim()).filter(Boolean).join(", ") || "General Helper"
    : String(skills || "").trim() || "General Helper";

  const user = await prisma.user.create({
    data: {
      name: name?.trim() || "Helper Partner",
      phone: cleanPhone,
      email: helperEmail,
      password: hashedPassword,
      role: "HELPER",
      city: city?.trim() || "Meerut, UP",
      skills: normalizedSkills,
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


