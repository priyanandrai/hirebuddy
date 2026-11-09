import prisma from "../utils/prisma.js";
import { notificationEvents } from "./notification.service.js";
import { releaseEscrowForTask } from "./payment.service.js";
import { processHelperPayoutForBooking } from "./payout.service.js";
import { indexTask, deleteTask } from "./es.client.js";
import { emitToTaskRoom, emitToUser, emitBroadcast } from "../config/socket.config.js";
import {
  getAllCategories,
  ensureCategoryInDb,
  inferIconType,
  inferEmojiIcon,
} from "./category.service.js";

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Resolve a helperId or preset slug to a real verified HELPER user in DB
 */
const resolveHelperIdForTask = async (helperId, categoryName = "", title = "", excludeUserId = null) => {
  if (helperId) {
    const existingHelper = await prisma.user.findUnique({
      where: { id: String(helperId) },
      select: { id: true },
    });
    if (existingHelper) {
      return existingHelper.id;
    }
  }

  const helpers = await prisma.user.findMany({
    where: {
      role: "HELPER",
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    select: {
      id: true,
      name: true,
      skills: true,
      idVerificationStatus: true,
    },
    orderBy: [{ idVerificationStatus: "desc" }, { createdAt: "desc" }],
  });

  const verifiedPool = helpers.filter((h) => h.idVerificationStatus === "VERIFIED");
  const pool = verifiedPool.length > 0 ? verifiedPool : helpers;
  const searchHint = `${helperId || ""} ${categoryName || ""} ${title || ""}`.toLowerCase();

  const matched = pool.find((h) => {
    const skillStr = String(h.skills || "").toLowerCase();
    const nameStr = String(h.name || "").toLowerCase();
    if (searchHint.includes("clean") || searchHint.includes("priya"))
      return skillStr.includes("clean") || nameStr.includes("prreto");
    if (searchHint.includes("driver") || searchHint.includes("ravinder"))
      return skillStr.includes("driver") || nameStr.includes("ravinder");
    if (searchHint.includes("deliver") || searchHint.includes("pickup") || searchHint.includes("rahul"))
      return skillStr.includes("courier") || skillStr.includes("deliver") || nameStr.includes("aman");
    if (searchHint.includes("plumb")) return skillStr.includes("plumb") || skillStr.includes("repair");
    if (searchHint.includes("electr")) return skillStr.includes("electr") || skillStr.includes("appliance");
    if (searchHint.includes("furniture")) return skillStr.includes("furniture") || skillStr.includes("assembly");
    if (searchHint.includes("cook")) return skillStr.includes("cook") || nameStr.includes("shanti");
    if (searchHint.includes("care") || searchHint.includes("elder"))
      return skillStr.includes("care") || skillStr.includes("physiotherapy") || skillStr.includes("elder");
    return skillStr.includes(String(categoryName || "").toLowerCase());
  });

  if (matched) return matched.id;
  return pool[0]?.id || null;
};

/**
 * Deterministic 4-digit OTP derived from task ID for completion & pickup verification
 */
export const deriveFourDigitOtp = (seed = "", salt = "complete") => {
  const str = `${seed || "hb"}-${salt}`;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const num = (Math.abs(hash) % 9000) + 1000;
  return String(num);
};

/**
 * Enrich a DB task with flattened review & payment fields for frontend consumption
 */
const enrichTaskWithRelations = (task) => {
  if (!task) return task;
  const latestReview = Array.isArray(task.reviews) && task.reviews.length > 0 ? task.reviews[0] : null;
  const latestPayment = Array.isArray(task.payments) && task.payments.length > 0 ? task.payments[0] : null;

  let paidAtLabel = null;
  if (latestPayment?.completedAt || latestPayment?.createdAt) {
    paidAtLabel = new Date(latestPayment.completedAt || latestPayment.createdAt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const effectivePaymentStatus =
    task.paymentStatus && task.paymentStatus !== "PENDING"
      ? task.paymentStatus
      : latestPayment?.status === "RELEASED" || latestPayment?.status === "COMPLETED"
        ? "COMPLETED"
        : latestPayment?.status || task.paymentStatus || "PENDING";

  const completionOtp = task.completionOtp || deriveFourDigitOtp(task.id, "complete");
  const pickupOtp = task.pickupOtp || deriveFourDigitOtp(task.id, "pickup");

  return {
    ...task,
    completionOtp,
    pickupOtp,
    paymentStatus: effectivePaymentStatus,
    paidMethod: latestPayment?.method || null,
    paidAtLabel,
    userRating: latestReview?.rating || null,
    userReview: latestReview?.comment || null,
  };
};

/**
 * Create a new task
 */
export const createTask = async (data, userParam) => {
  const user = userParam || (data?.createdById ? { id: data.createdById } : {});
  const {
    title,
    description,
    category = "General",
    location = "To be coordinated",
    latitude,
    longitude,
    budget,
    preferredAt,
    timeSlot,
    image,
    attachments,
    helperId: rawHelperId,
    preferredHelperId,
    assignedToId,
    bookNow,
  } = data;
  const helperId = rawHelperId || preferredHelperId || assignedToId;

  // Ensure the category exists in the Category DB table whenever a task is posted
  let resolvedCategoryName = String(category || "Others").trim() || "Others";
  try {
    const dbCat = await ensureCategoryInDb(resolvedCategoryName, {
      description: description
        ? `Verified local helpers for ${resolvedCategoryName} tasks.`
        : undefined,
    });
    if (dbCat?.name) {
      resolvedCategoryName = dbCat.name;
    }
  } catch (catErr) {
    console.warn("Could not ensure category in DB:", catErr?.message);
  }

  // Resolve specific Buddy if helperId or bookNow is provided
  let resolvedHelperId = null;
  if (helperId || bookNow) {
    resolvedHelperId = await resolveHelperIdForTask(
      helperId,
      resolvedCategoryName,
      title,
      user.id
    );
  }

  const isDirectAssignment = Boolean(resolvedHelperId);
  const normalizedAttachments = Array.isArray(attachments) && attachments.length > 0 ? attachments : null;
  const primaryImage =
    image ||
    (normalizedAttachments && normalizedAttachments[0]?.url ? normalizedAttachments[0].url : null);

  const task = await prisma.task.create({
    data: {
      title,
      description,
      category: resolvedCategoryName,
      location: location || "To be coordinated",
      latitude: latitude !== undefined && latitude !== null && latitude !== "" ? parseFloat(latitude) : null,
      longitude: longitude !== undefined && longitude !== null && longitude !== "" ? parseFloat(longitude) : null,
      budget: Number(budget || 0),
      preferredAt: preferredAt ? new Date(preferredAt) : null,
      timeSlot: timeSlot || "10:00 AM - 12:00 PM",
      image: primaryImage,
      attachments: normalizedAttachments,
      createdById: user.id,
      assignedToId: resolvedHelperId || null,
      status: isDirectAssignment ? "ASSIGNED" : "OPEN",
      paymentStatus: "PENDING",
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true, phone: true } },
      assignedTo: {
        select: {
          id: true,
          name: true,
          image: true,
          phone: true,
          city: true,
          skills: true,
          averageRating: true,
          totalReviews: true,
          idVerificationStatus: true,
        },
      },
      reviews: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (isDirectAssignment && resolvedHelperId) {
    try {
      await notificationEvents.taskRequested(task.id, user.id, resolvedHelperId);
      emitToUser(resolvedHelperId, 'task_requested', {
        taskId: task.id,
        task,
        customerName: user.name || 'A customer',
        message: `${user.name || 'A customer'} booked and assigned you for "${task.title}"`,
      });
      emitToUser(resolvedHelperId, 'task_status_changed', {
        taskId: task.id,
        newStatus: 'ASSIGNED',
        task,
      });
    } catch (notifErr) {
      console.warn('Failed to send direct assignment alert:', notifErr?.message);
    }
  } else {
    try {
      const formattedLiveTask = {
        ...task,
        image: task.image || getCategoryImageForTask(task.category, task.title),
        isNew: true,
        dateLabel: task.preferredAt
          ? new Date(task.preferredAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
        timeSlot: task.timeSlot || "10:00 AM - 12:00 PM",
      };
      emitBroadcast('new_task_available', {
        taskId: task.id,
        task: formattedLiveTask,
        category: task.category,
        customerName: user.name || 'A customer',
      });
      // Notify available helpers in background
      notificationEvents.newTaskPosted(task, user).catch(() => {});
    } catch (broadcastErr) {
      console.warn('Failed to broadcast new task:', broadcastErr?.message);
    }
  }

  return enrichTaskWithRelations(task);
};

// Hook: index after create
const _originalCreateTask = createTask;
export const createTaskAndIndex = async (data, user) => {
  const task = await _originalCreateTask(data, user);
  try {
    await indexTask(task);
  } catch (e) {
    console.error('Failed to index task after create', e);
  }
  return task;
};

/**
 * Get tasks created by user
 */
export const getUserTasks = async (userId) => {
  const tasks = await prisma.task.findMany({
    where: { createdById: userId },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          image: true,
          phone: true,
          city: true,
          address: true,
          skills: true,
          experience: true,
          hourlyRate: true,
          isAvailable: true,
          averageRating: true,
          totalReviews: true,
          idVerificationStatus: true,
        },
      },
      createdBy: { select: { id: true, name: true, image: true, phone: true } },
      reviews: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return tasks.map(enrichTaskWithRelations);
};

/**
 * Find nearby tasks for a helper (location-based discovery)
 */
export const findNearbyTasks = async (helperId, radiusKm = 5, limit = 20, offset = 0) => {
  try {
    // Get helper's location
    const helper = await prisma.user.findUnique({
      where: { id: helperId },
      select: { latitude: true, longitude: true, skills: true },
    });

    if (!helper || !helper.latitude || !helper.longitude) {
      throw new Error("Helper location not set");
    }

    // Get open tasks
    const allTasks = await prisma.task.findMany({
      where: { status: "OPEN", assignedToId: null },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000, // Fetch many to filter by distance
    });

    // Filter by distance
    const nearbyTasks = allTasks
      .filter((task) => {
        if (!task.latitude || !task.longitude) return false;
        const distance = calculateDistance(
          helper.latitude,
          helper.longitude,
          task.latitude,
          task.longitude
        );
        return distance <= radiusKm;
      })
      .slice(offset, offset + limit);

    return {
      tasks: nearbyTasks,
      total: allTasks.filter((task) => {
        if (!task.latitude || !task.longitude) return false;
        const distance = calculateDistance(
          helper.latitude,
          helper.longitude,
          task.latitude,
          task.longitude
        );
        return distance <= radiusKm;
      }).length,
      radiusKm,
      limit,
      offset,
    };
  } catch (error) {
    console.error("Failed to find nearby tasks:", error);
    throw error;
  }
};

export const HELPER_CATEGORIES_LIST = [
  { name: "Home Cleaning", slug: "home-cleaning", taskCategory: "Cleaning", tasksCount: 1, iconType: "cleaning" },
  { name: "Driver Services", slug: "driver-services", taskCategory: "Driver", tasksCount: 1, iconType: "driver" },
  { name: "Delivery & Pickup", slug: "delivery-pickup", taskCategory: "Delivery", tasksCount: 1, iconType: "delivery" },
  { name: "Plumbing", slug: "plumbing", taskCategory: "Plumbing", tasksCount: 1, iconType: "plumbing" },
  { name: "Electrical", slug: "electrical", taskCategory: "Electrical", tasksCount: 1, iconType: "electrical" },
  { name: "Furniture Assembly", slug: "furniture-assembly", taskCategory: "Furniture Assembly", tasksCount: 1, iconType: "furniture" },
  { name: "Cooking", slug: "cooking", taskCategory: "Cooking", tasksCount: 1, iconType: "cooking" },
  { name: "Others", slug: "others", taskCategory: "Others", tasksCount: 1, iconType: "others" },
];

export const HELPER_TASKS_CATALOG = [
  {
    id: "helper-task-1",
    title: "Home Cleaning",
    category: "Home Cleaning",
    categoryAliases: ["home cleaning", "cleaning", "deep cleaning"],
    budget: 300,
    location: "Modipuram, Meerut",
    city: "Meerut",
    dateLabel: "29 Oct 2026",
    preferredAt: "2026-10-29T10:00:00.000Z",
    timeSlot: "10:00 AM - 12:00 PM",
    description: "Need deep cleaning for 2 BHK. Bring your own cleaning products if possible.",
    image: "/images/helper_task_cleaning.png",
    isNew: true,
    status: "OPEN",
    isDefaultGrid: true,
    relevanceOrder: 1,
  },
  {
    id: "helper-task-2",
    title: "Medicine Pickup",
    category: "Delivery & Pickup",
    categoryAliases: ["delivery & pickup", "delivery", "pickup", "medicine pickup", "delivery-pickup"],
    budget: 150,
    location: "Meerut, UP",
    city: "Meerut",
    dateLabel: "29 Oct 2026",
    preferredAt: "2026-10-29T14:00:00.000Z",
    timeSlot: "02:00 PM - 04:00 PM",
    description: "Need someone to pickup medicines from Apollo Pharmacy and deliver at home.",
    image: "/images/helper_task_medicine.png",
    isNew: true,
    status: "OPEN",
    isDefaultGrid: true,
    relevanceOrder: 2,
  },
  {
    id: "helper-task-3",
    title: "Furniture Assembly",
    category: "Furniture Assembly",
    categoryAliases: ["furniture assembly", "furniture", "furniture-assembly"],
    budget: 500,
    location: "Modipuram, Meerut",
    city: "Meerut",
    dateLabel: "30 Oct 2026",
    preferredAt: "2026-10-30T11:00:00.000Z",
    timeSlot: "11:00 AM - 02:00 PM",
    description: "Need help to assemble a wardrobe and a study table. All parts available.",
    image: "/images/helper_task_furniture.png",
    isNew: true,
    status: "OPEN",
    isDefaultGrid: true,
    relevanceOrder: 3,
  },
  {
    id: "helper-task-4",
    title: "Driver Services",
    category: "Driver Services",
    categoryAliases: ["driver services", "driver", "driver-services"],
    budget: 400,
    location: "Meerut, UP",
    city: "Meerut",
    dateLabel: "28 Oct 2026",
    preferredAt: "2026-10-28T09:00:00.000Z",
    timeSlot: "09:00 AM - 05:00 PM",
    description: "Need a driver for airport drop and pickup.",
    image: "/images/helper_task_driver.png",
    isNew: true,
    status: "OPEN",
    isDefaultGrid: true,
    relevanceOrder: 4,
  },
  {
    id: "helper-task-5",
    title: "Plumbing",
    category: "Plumbing",
    categoryAliases: ["plumbing", "plumber"],
    budget: 350,
    location: "Modipuram, Meerut",
    city: "Meerut",
    dateLabel: "29 Oct 2026",
    preferredAt: "2026-10-29T13:00:00.000Z",
    timeSlot: "01:00 PM - 03:00 PM",
    description: "Fixing a leaking sink and bathroom tap.",
    image: "/images/helper_task_plumbing.png",
    isNew: true,
    status: "OPEN",
    isDefaultGrid: true,
    relevanceOrder: 5,
  },
  {
    id: "helper-task-6",
    title: "Cooking",
    category: "Cooking",
    categoryAliases: ["cooking", "cook", "meal"],
    budget: 250,
    location: "Meerut, UP",
    city: "Meerut",
    dateLabel: "28 Oct 2026",
    preferredAt: "2026-10-28T18:00:00.000Z",
    timeSlot: "06:00 PM - 08:00 PM",
    description: "Need home-cooked meal for 3 days.",
    image: "/images/helper_task_cooking.png",
    isNew: true,
    status: "OPEN",
    isDefaultGrid: true,
    relevanceOrder: 6,
  },
  {
    id: "helper-task-7",
    title: "Electrical Repair & Fan Fitting",
    category: "Electrical",
    categoryAliases: ["electrical", "electrician", "wiring"],
    budget: 300,
    location: "Modipuram, Meerut",
    city: "Meerut",
    dateLabel: "30 Oct 2026",
    preferredAt: "2026-10-30T11:00:00.000Z",
    timeSlot: "11:00 AM - 01:00 PM",
    description: "Need an electrician to install two ceiling fans and inspect bedroom switchboard wiring.",
    image: "/images/service_electrical.png",
    isNew: true,
    status: "OPEN",
    isDefaultGrid: false,
    relevanceOrder: 7,
  },
  {
    id: "helper-task-8",
    title: "Personal Care & Elder Assistance",
    category: "Personal Care",
    categoryAliases: ["personal care", "personal-care", "elder care", "care"],
    budget: 450,
    location: "Meerut, UP",
    city: "Meerut",
    dateLabel: "30 Oct 2026",
    preferredAt: "2026-10-30T10:00:00.000Z",
    timeSlot: "10:00 AM - 01:00 PM",
    description: "Compassionate personal care, doctor visit accompaniment, and daily wellness support.",
    image: "/images/helper_task_driver.png",
    isNew: true,
    status: "OPEN",
    isDefaultGrid: false,
    relevanceOrder: 8,
  },
  {
    id: "helper-task-9",
    title: "Balcony Garden & Errand Support",
    category: "Others",
    categoryAliases: ["others", "general", "home support", "errands", "gardening"],
    budget: 250,
    location: "Modipuram, Meerut",
    city: "Meerut",
    dateLabel: "31 Oct 2026",
    preferredAt: "2026-10-31T09:30:00.000Z",
    timeSlot: "09:30 AM - 11:30 AM",
    description: "Need help repotting balcony plants and organizing household storage items.",
    image: "/images/service_delivery.png",
    isNew: true,
    status: "OPEN",
    isDefaultGrid: false,
    relevanceOrder: 9,
  },
];

const getCategoryImageForTask = (category = "", title = "") => {
  const text = `${category} ${title}`.toLowerCase();
  if (text.includes("clean")) return "/images/helper_task_cleaning.png";
  if (text.includes("medicine") || text.includes("deliver") || text.includes("pickup"))
    return "/images/helper_task_medicine.png";
  if (text.includes("furniture") || text.includes("wardrobe") || text.includes("carpenter"))
    return "/images/helper_task_furniture.png";
  if (text.includes("driver") || text.includes("car") || text.includes("airport"))
    return "/images/helper_task_driver.png";
  if (text.includes("plumb") || text.includes("sink") || text.includes("pipe") || text.includes("leak"))
    return "/images/helper_task_plumbing.png";
  if (text.includes("cook") || text.includes("meal") || text.includes("food"))
    return "/images/helper_task_cooking.png";
  if (text.includes("electr")) return "/images/service_electrical.png";
  return "/images/helper_task_cleaning.png";
};

const matchesHelperCategory = (task, filterCat) => {
  if (!filterCat || filterCat === "all") return true;
  const target = filterCat.toLowerCase().trim();
  const taskCat = String(task.category || "").toLowerCase().trim();
  const taskTitle = String(task.title || "").toLowerCase().trim();
  const aliases = Array.isArray(task.categoryAliases) ? task.categoryAliases : [];

  if (taskCat === target || taskTitle === target || aliases.includes(target)) return true;

  if (target === "home cleaning" || target === "cleaning") {
    return taskCat.includes("clean") || taskTitle.includes("clean");
  }
  if (target === "driver services" || target === "driver") {
    return taskCat.includes("driver") || taskTitle.includes("driver");
  }
  if (target === "delivery & pickup" || target === "delivery" || target === "pickup") {
    return (
      taskCat.includes("deliver") ||
      taskCat.includes("pickup") ||
      taskTitle.includes("pickup") ||
      taskTitle.includes("deliver") ||
      taskTitle.includes("medicine")
    );
  }
  if (target === "plumbing") {
    return taskCat.includes("plumb") || taskTitle.includes("plumb");
  }
  if (target === "electrical") {
    return taskCat.includes("electr") || taskTitle.includes("electr");
  }
  if (target === "furniture assembly" || target === "furniture") {
    return taskCat.includes("furniture") || taskTitle.includes("furniture") || taskCat.includes("carpenter");
  }
  if (target === "cooking") {
    return taskCat.includes("cook") || taskTitle.includes("cook");
  }
  if (target === "others") {
    return (
      taskCat === "others" ||
      taskCat === "general" ||
      taskCat === "home support" ||
      taskCat.includes("other")
    );
  }
  return taskCat.includes(target) || taskTitle.includes(target);
};

/**
 * Search tasks by category, search query, budget, and location
 */
export const searchTasks = async (filters = {}) => {
  try {
    const {
      category,
      city,
      location,
      search,
      minBudget,
      maxBudget,
      includeCatalog,
      view,
      latitude,
      longitude,
      radiusKm = 5,
      status,
      sortBy = "createdAt",
      limit = 50,
      offset = 0,
    } = filters;

    const isAdminOrAllStatuses =
      view === "admin" ||
      status === "ALL" ||
      (status && status !== "OPEN");

    const where = isAdminOrAllStatuses
      ? status && status !== "ALL"
        ? { status }
        : {}
      : {
          assignedToId: null,
          status: "OPEN",
        };

    let dbTasks = await prisma.task.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, image: true, phone: true } },
        assignedTo: { select: { id: true, name: true, image: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // Strictly exclude any task that is directly assigned to a particular Buddy for helper discovery feeds
    if (!isAdminOrAllStatuses) {
      dbTasks = dbTasks.filter((t) => !t.assignedToId && t.status === "OPEN");
    }

    // Normalize DB tasks with presentation fields if not present
    // Give real DB tasks negative relevanceOrder so newly created tasks always appear FIRST at the top of the Buddy feed
    const formattedDbTasks = dbTasks.map((t, index) => ({
      ...t,
      image: t.image || getCategoryImageForTask(t.category, t.title),
      isNew: true,
      dateLabel: t.preferredAt
        ? new Date(t.preferredAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : new Date(t.createdAt || Date.now()).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      timeSlot: t.timeSlot || "10:00 AM - 01:00 PM",
      relevanceOrder: -1000 + index,
    }));

    // Fetch categories from DB (`prisma.category`)
    const dbCategories = await getAllCategories();

    const useHelperCatalog =
      includeCatalog === true ||
      includeCatalog === "true" ||
      view === "helper" ||
      view === "home";

    // Build dynamic catalog tasks so any newly added DB category also has a task entry if needed
    const dynamicCatalogTasks = [...HELPER_TASKS_CATALOG];
    for (const dbCat of dbCategories) {
      const hasMatchInCatalog = dynamicCatalogTasks.some((t) =>
        matchesHelperCategory(t, dbCat.name)
      );
      const hasMatchInDbTasks = formattedDbTasks.some((t) =>
        matchesHelperCategory(t, dbCat.name)
      );
      if (!hasMatchInCatalog && !hasMatchInDbTasks) {
        dynamicCatalogTasks.push({
          id: `helper-task-${dbCat.slug || dbCat.id}`,
          title: `${dbCat.name} Assistance`,
          category: dbCat.name,
          categoryAliases: [dbCat.name.toLowerCase(), (dbCat.slug || "").toLowerCase()],
          budget: 300,
          location: "Modipuram, Meerut",
          city: "Meerut",
          dateLabel: "30 Oct 2026",
          preferredAt: "2026-10-30T10:00:00.000Z",
          timeSlot: "10:00 AM - 01:00 PM",
          description:
            dbCat.description ||
            `Need a verified Buddy for ${dbCat.name} services.`,
          image: getCategoryImageForTask(dbCat.name, dbCat.name),
          isNew: true,
          status: "OPEN",
          isDefaultGrid: false,
          relevanceOrder: 20,
        });
      }
    }

    let combinedTasks =
      view === "admin"
        ? formattedDbTasks
        : useHelperCatalog
          ? [
              ...formattedDbTasks,
              ...dynamicCatalogTasks.filter(
                (catTask) =>
                  !formattedDbTasks.some(
                    (dbTask) =>
                      String(dbTask.title || "").toLowerCase() === catTask.title.toLowerCase() &&
                      Number(dbTask.budget) === Number(catTask.budget)
                  )
              ),
            ]
          : formattedDbTasks.length > 0
            ? formattedDbTasks
            : [...dynamicCatalogTasks];

    const normalizedCategory = String(category || "").trim().toLowerCase();
    const normalizedSearch = String(search || "").trim().toLowerCase();
    const normalizedLocation = String(location || city || "").trim().toLowerCase();

    // Apply non-category filters first so category counts reflect active search/location/budget filters
    if (normalizedSearch) {
      combinedTasks = combinedTasks.filter(
        (task) =>
          String(task.title || "").toLowerCase().includes(normalizedSearch) ||
          String(task.description || "").toLowerCase().includes(normalizedSearch) ||
          String(task.category || "").toLowerCase().includes(normalizedSearch) ||
          String(task.location || "").toLowerCase().includes(normalizedSearch) ||
          (Array.isArray(task.categoryAliases) &&
            task.categoryAliases.some((a) => a.toLowerCase().includes(normalizedSearch)))
      );
    }

    if (normalizedLocation && normalizedLocation !== "all" && normalizedLocation !== "all locations") {
      combinedTasks = combinedTasks.filter(
        (task) =>
          String(task.location || "").toLowerCase().includes(normalizedLocation) ||
          String(task.city || "").toLowerCase().includes(normalizedLocation)
      );
    }

    if (minBudget !== undefined && minBudget !== "" && !Number.isNaN(Number(minBudget))) {
      combinedTasks = combinedTasks.filter((task) => Number(task.budget || 0) >= Number(minBudget));
    }
    if (maxBudget !== undefined && maxBudget !== "" && !Number.isNaN(Number(maxBudget))) {
      combinedTasks = combinedTasks.filter((task) => Number(task.budget || 0) <= Number(maxBudget));
    }

    if (latitude && longitude) {
      combinedTasks = combinedTasks.filter((task) => {
        if (!task.latitude || !task.longitude) return true;
        const distance = calculateDistance(latitude, longitude, task.latitude, task.longitude);
        return distance <= radiusKm;
      });
    }

    const dynamicHelperCategories = dbCategories.map((dbCat) => ({
      id: dbCat.id,
      name: dbCat.name,
      slug: dbCat.slug,
      icon: dbCat.icon || inferEmojiIcon(dbCat.name),
      iconType: inferIconType(dbCat.slug || dbCat.name),
      taskCategory: dbCat.name,
      tasksCount: combinedTasks.filter((task) => matchesHelperCategory(task, dbCat.name)).length,
    }));

    // Category filter
    if (normalizedCategory && normalizedCategory !== "all") {
      combinedTasks = combinedTasks.filter((task) => matchesHelperCategory(task, normalizedCategory));
    }

    // Sorting
    const sortKey = String(sortBy || "relevance").toLowerCase();
    if (sortKey === "budget_desc" || sortKey === "price_desc" || sortKey === "high_to_low") {
      combinedTasks.sort((a, b) => Number(b.budget || 0) - Number(a.budget || 0));
    } else if (sortKey === "budget_asc" || sortKey === "price_asc" || sortKey === "low_to_high") {
      combinedTasks.sort((a, b) => Number(a.budget || 0) - Number(b.budget || 0));
    } else if (useHelperCatalog) {
      combinedTasks.sort((a, b) => (a.relevanceOrder || 99) - (b.relevanceOrder || 99));
    }

    return {
      tasks: combinedTasks.slice(offset, offset + limit),
      categories: dynamicHelperCategories,
      total: combinedTasks.length,
      limit,
      offset,
      appliedFilters: {
        category: category || null,
        search: search || null,
        location: location || city || null,
        minBudget: minBudget ? Number(minBudget) : null,
        maxBudget: maxBudget ? Number(maxBudget) : null,
        sortBy: sortKey,
      },
    };
  } catch (error) {
    console.error("Failed to search tasks:", error);
    throw error;
  }
};

/**
 * Accept a task as a helper
 */
export const assignHelper = async (user, taskId) => {
  if (user.role !== "HELPER") {
    throw new Error("Only helpers can accept tasks");
  }

  // Ensure helper is verified before accepting tasks
  const helperUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      idVerificationStatus: true,
      subscriptionActiveUntil: true,
      walletBalance: true,
    },
  });
  if (helperUser?.idVerificationStatus !== "VERIFIED") {
    throw new Error(
      "Your account is not verified yet. Please complete document verification and wait for admin approval to accept tasks."
    );
  }

  // Check active Buddy Pass (₹5/day or ₹99/month). If expired/inactive and wallet has >= ₹5 (500 paise), auto-activate Daily Pass
  const now = new Date();
  const hasActivePass =
    helperUser?.subscriptionActiveUntil &&
    new Date(helperUser.subscriptionActiveUntil) > now;

  if (!hasActivePass) {
    if ((helperUser?.walletBalance || 0) >= 500) {
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await prisma.$transaction([
        prisma.partnerSubscription.create({
          data: {
            userId: user.id,
            planType: "DAILY",
            amountPaise: 500,
            daysGranted: 1,
            startsAt: now,
            expiresAt,
            paymentMethod: "WALLET",
            status: "ACTIVE",
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            partnerPlanType: "DAILY",
            subscriptionActiveUntil: expiresAt,
            walletBalance: { decrement: 500 },
          },
        }),
      ]);
    } else if (helperUser?.subscriptionActiveUntil !== null) {
      // Previously had a pass that expired and insufficient wallet balance
      throw new Error(
        "Your Buddy Active Pass (₹5/day or ₹99/month) has expired. Please activate your pass from the Buddy Dashboard to accept tasks."
      );
    }
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      status: true,
      createdById: true,
      assignedToId: true,
    },
  });

  if (!task) {
    const catalogTask = HELPER_TASKS_CATALOG.find((t) => t.id === taskId);
    if (catalogTask) {
      return {
        ...catalogTask,
        status: "ASSIGNED",
        assignedToId: user.id,
      };
    }
    throw new Error("Task not found");
  }

  if (task.createdById === user.id) {
    throw new Error("You cannot accept your own task");
  }

  // Two valid cases for helper acceptance:
  // 1. OPEN task on public marketplace with no assigned helper
  // 2. REQUESTED direct booking where this user is the designated helper (assignedToId === user.id)
  const isMarketplaceOpen = task.status === "OPEN" && !task.assignedToId;
  const isDirectRequestForUser =
    (task.status === "REQUESTED" || task.status === "ASSIGNED") &&
    task.assignedToId === user.id;

  if (!isMarketplaceOpen && !isDirectRequestForUser) {
    throw new Error("Task is not available for acceptance");
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      assignedToId: user.id,
      status: "ASSIGNED",
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true, phone: true } },
      assignedTo: { select: { id: true, name: true, image: true, phone: true } },
    },
  });

  // Send notification to customer
  await notificationEvents.taskAccepted(taskId, user.id, task.createdById);
  try {
    emitToTaskRoom(taskId, 'task_status_changed', { taskId, newStatus: 'ASSIGNED', task: updatedTask });
    emitToUser(task.createdById, 'task_status_changed', { taskId, newStatus: 'ASSIGNED', task: updatedTask });
    emitBroadcast('task_updated', { taskId, newStatus: 'ASSIGNED', assignedToId: user.id });
  } catch (e) {
    console.warn('Socket emit error:', e?.message);
  }

  return updatedTask;
};

/**
 * Decline a direct booking request as helper (re-opens the task so customer can pick another Buddy)
 */
export const declineHelperRequest = async (user, taskId, reason = "Helper is unavailable", cancelCompletely = false) => {
  if (user.role !== "HELPER") {
    throw new Error("Only helpers can decline tasks");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      createdById: true,
      assignedToId: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.assignedToId !== user.id) {
    throw new Error("You are not the designated helper for this task");
  }

  if (task.status !== "REQUESTED" && task.status !== "ASSIGNED") {
    throw new Error("Task cannot be declined at this stage");
  }

  const nextStatus = cancelCompletely ? "CANCELLED" : "OPEN";

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: nextStatus,
      assignedToId: cancelCompletely ? task.assignedToId : null,
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true, phone: true } },
      assignedTo: { select: { id: true, name: true, image: true, phone: true } },
      reviews: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  try {
    await notificationEvents.taskDeclined(taskId, user.id, task.createdById, reason);
    emitToTaskRoom(taskId, 'task_status_changed', {
      taskId,
      newStatus: nextStatus,
      task: enrichTaskWithRelations(updatedTask),
    });
    emitToUser(task.createdById, 'task_status_changed', {
      taskId,
      newStatus: nextStatus,
      task: enrichTaskWithRelations(updatedTask),
    });
    if (nextStatus === "OPEN") {
      emitBroadcast('new_task_available', {
        taskId: updatedTask.id,
        task: enrichTaskWithRelations(updatedTask),
        category: updatedTask.category,
      });
    }
  } catch (e) {
    console.warn('Decline notification error:', e?.message);
  }

  return enrichTaskWithRelations(updatedTask);
};

/**
 * Update task details (Reschedule, Edit Location/TimeSlot, or Invite/Change Assigned Buddy)
 */
export const updateTaskDetails = async (taskId, userId, payload = {}, user = null) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const isAdmin = user?.role === "ADMIN" || user?.isAdmin || userId === "admin";
  const isOwner = task.createdById === userId;
  const isAssignee = task.assignedToId === userId;

  if (!isOwner && !isAssignee && !isAdmin) {
    throw new Error("You are not authorized to update this task");
  }

  const updateData = {};

  if (payload.title !== undefined) updateData.title = String(payload.title).trim();
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.location !== undefined) updateData.location = String(payload.location).trim();
  if (payload.latitude !== undefined) {
    updateData.latitude = payload.latitude !== null && payload.latitude !== "" ? parseFloat(payload.latitude) : null;
  }
  if (payload.longitude !== undefined) {
    updateData.longitude = payload.longitude !== null && payload.longitude !== "" ? parseFloat(payload.longitude) : null;
  }
  if (payload.preferredAt !== undefined) {
    updateData.preferredAt = payload.preferredAt ? new Date(payload.preferredAt) : null;
  }
  if (payload.timeSlot !== undefined) {
    updateData.timeSlot = String(payload.timeSlot).trim();
  }
  if (payload.budget !== undefined && !Number.isNaN(Number(payload.budget))) {
    updateData.budget = Number(payload.budget);
  }
  if (payload.image !== undefined) {
    updateData.image = payload.image;
  }
  if (payload.attachments !== undefined) {
    updateData.attachments = payload.attachments;
  }

  // Handle inviting / assigning / changing a Buddy on an existing task
  let newlyAssignedHelperId = null;
  if (payload.helperId !== undefined || payload.assignedToId !== undefined) {
    const rawTargetHelper = payload.helperId ?? payload.assignedToId;
    if (!rawTargetHelper) {
      updateData.assignedToId = null;
      if (["ASSIGNED", "REQUESTED"].includes(task.status)) {
        updateData.status = "OPEN";
      }
    } else {
      const resolvedId = await resolveHelperIdForTask(
        rawTargetHelper,
        task.category,
        task.title,
        task.createdById
      );
      if (resolvedId) {
        updateData.assignedToId = resolvedId;
        newlyAssignedHelperId = resolvedId;
        updateData.status = payload.bookNow === false ? "REQUESTED" : "ASSIGNED";
      }
    }
  } else if (payload.status && ["OPEN", "REQUESTED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(payload.status)) {
    updateData.status = payload.status;
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      createdBy: { select: { id: true, name: true, image: true, phone: true } },
      assignedTo: {
        select: {
          id: true,
          name: true,
          image: true,
          phone: true,
          city: true,
          address: true,
          skills: true,
          experience: true,
          hourlyRate: true,
          isAvailable: true,
          averageRating: true,
          totalReviews: true,
          idVerificationStatus: true,
        },
      },
      reviews: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  const enriched = enrichTaskWithRelations(updatedTask);

  try {
    if (newlyAssignedHelperId) {
      await notificationEvents.taskRequested(taskId, task.createdById, newlyAssignedHelperId);
      emitToUser(newlyAssignedHelperId, 'task_requested', {
        taskId,
        task: enriched,
        customerName: updatedTask.createdBy?.name || 'Customer',
        message: `${updatedTask.createdBy?.name || 'Customer'} assigned you to "${updatedTask.title}"`,
      });
    }
    if (updatedTask.assignedToId) {
      emitToUser(updatedTask.assignedToId, 'task_status_changed', {
        taskId,
        newStatus: updatedTask.status,
        task: enriched,
      });
    }
    emitToUser(updatedTask.createdById, 'task_status_changed', {
      taskId,
      newStatus: updatedTask.status,
      task: enriched,
    });
    emitToTaskRoom(taskId, 'task_status_changed', {
      taskId,
      newStatus: updatedTask.status,
      task: enriched,
    });
  } catch (e) {
    console.warn("Socket emit warning in updateTaskDetails:", e?.message);
  }

  return enriched;
};

/**
 * Get task by ID
 */
export const getTaskById = async (userId, taskId, user = null) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          phone: true,
          image: true,
          city: true,
          skills: true,
          averageRating: true,
          totalReviews: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          phone: true,
          image: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, image: true } },
          receiver: { select: { id: true, name: true, image: true } },
        },
      },
      reviews: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!task) {
    return null;
  }

  const isAdmin = user?.role === "ADMIN" || user?.isAdmin || userId === "admin";
  const isOwner = task.createdById === userId;
  const isAssignee = task.assignedToId === userId;

  if (!isOwner && !isAssignee && !isAdmin) {
    return null;
  }

  return enrichTaskWithRelations(task);
};

/**
 * Get tasks assigned to a helper
 */
export const getTasksAssignedToHelper = async (helperId) => {
  const tasks = await prisma.task.findMany({
    where: {
      assignedToId: helperId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          image: true,
          phone: true,
          city: true,
          averageRating: true,
          totalReviews: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          image: true,
          phone: true,
          city: true,
          averageRating: true,
          totalReviews: true,
        },
      },
      reviews: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return tasks.map(enrichTaskWithRelations);
};

/**
 * Get tasks created by user
 */
export const getTasksCreatedByUser = async (userId) => {
  const tasks = await prisma.task.findMany({
    where: {
      createdById: userId,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          image: true,
          phone: true,
          city: true,
          address: true,
          skills: true,
          experience: true,
          hourlyRate: true,
          isAvailable: true,
          averageRating: true,
          totalReviews: true,
          idVerificationStatus: true,
        },
      },
      reviews: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return tasks.map(enrichTaskWithRelations);
};

/**
 * Update task status
 */
export const updateTaskStatus = async (taskId, userId, newStatus, user = null, otpCode = null) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { createdBy: true, assignedTo: true },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const isAdmin = user?.role === "ADMIN" || user?.isAdmin || userId === "admin";
    const isOwner = task.createdById === userId;
    const isAssignee = task.assignedToId === userId;

    if (!isOwner && !isAssignee && !isAdmin) {
      throw new Error("You are not authorized to update this task");
    }

    // Validate status transitions (admins can override to any valid status)
    const validTransitions = {
      OPEN: ["ASSIGNED", "CANCELLED"],
      REQUESTED: ["ASSIGNED", "CANCELLED"],
      ASSIGNED: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!isAdmin && !validTransitions[task.status]?.includes(newStatus)) {
      throw new Error(`Cannot transition from ${task.status} to ${newStatus}`);
    }

    // Verify Completion / Pickup OTP if provided by Helper
    if (otpCode !== null && otpCode !== undefined && String(otpCode).trim() !== "") {
      const enteredOtp = String(otpCode).trim();
      const linkedOrder = await prisma.marketplaceOrder
        .findFirst({ where: { deliveryTaskId: taskId } })
        .catch(() => null);

      if (newStatus === "IN_PROGRESS") {
        const expectedPickup = linkedOrder?.pickupOtp || deriveFourDigitOtp(taskId, "pickup");
        const expectedComplete = deriveFourDigitOtp(taskId, "complete");
        if (enteredOtp !== expectedPickup && enteredOtp !== expectedComplete) {
          throw new Error("Invalid Pickup OTP. Please check the 4-digit PIN with the Seller/Customer.");
        }
      } else if (newStatus === "COMPLETED") {
        const expectedDelivery = linkedOrder?.deliveryOtp || deriveFourDigitOtp(taskId, "complete");
        const expectedComplete = deriveFourDigitOtp(taskId, "complete");
        if (enteredOtp !== expectedDelivery && enteredOtp !== expectedComplete) {
          throw new Error("Invalid Completion OTP. Please enter the 4-digit PIN from the Customer.");
        }
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completedAt: newStatus === "COMPLETED" ? new Date() : null,
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        assignedTo: { select: { id: true, name: true, image: true } },
      },
    });

    // Send notifications based on status change
    const otherUserId = userId === task.createdById ? task.assignedToId : task.createdById;
    const notifSenderId = userId === "admin" ? task.createdById : userId;

    try {
      if (newStatus === "IN_PROGRESS" && otherUserId && notifSenderId) {
        await notificationEvents.taskStarted(taskId, notifSenderId, otherUserId);
      } else if (newStatus === "COMPLETED" && otherUserId && notifSenderId) {
        await notificationEvents.taskCompleted(taskId, notifSenderId, otherUserId);
      } else if (newStatus === "CANCELLED" && otherUserId && notifSenderId) {
        await notificationEvents.taskCancelled(taskId, notifSenderId, otherUserId);
      }
    } catch (notifErr) {
      console.warn("Task status notification warning:", notifErr?.message);
    }

    if (newStatus === "IN_PROGRESS") {
      // Sync MarketplaceOrder status if this is a platform delivery task
      await prisma.marketplaceOrder
        .updateMany({
          where: { deliveryTaskId: taskId },
          data: { orderStatus: "OUT_FOR_DELIVERY" },
        })
        .catch(() => {});
    } else if (newStatus === "COMPLETED") {
      // Automatically release held escrow payment or trigger Razorpay Route helper payout when task is completed
      try {
        const confirmedMarketplacePayment = await prisma.payment.findFirst({
          where: { taskId, status: "CONFIRMED" },
          orderBy: { createdAt: "desc" },
        });
        if (confirmedMarketplacePayment) {
          await processHelperPayoutForBooking({
            paymentId: confirmedMarketplacePayment.id,
            taskId,
          });
        } else {
          await releaseEscrowForTask(taskId, userId === "admin" ? task.createdById : userId);
        }
      } catch (escrowErr) {
        console.warn("Auto escrow/payout release check warning:", escrowErr?.message);
      }
      // Sync MarketplaceOrder status if this is a platform delivery task
      await prisma.marketplaceOrder
        .updateMany({
          where: { deliveryTaskId: taskId },
          data: { orderStatus: "DELIVERED" },
        })
        .catch(() => {});
    }

    try {
      emitToTaskRoom(taskId, 'task_status_changed', { taskId, newStatus, task: updatedTask });
      if (otherUserId) {
        emitToUser(otherUserId, 'task_status_changed', { taskId, newStatus, task: updatedTask });
      }
      emitBroadcast('task_updated', { taskId, newStatus });
    } catch (e) {
      console.warn('Socket emitToTaskRoom error:', e?.message);
    }

    return updatedTask;
  } catch (error) {
    console.error("Failed to update task status:", error);
    throw error;
  }
};

// Index task after status update
export const updateTaskStatusAndIndex = async (taskId, userId, newStatus, user = null, otpCode = null) => {
  const updated = await updateTaskStatus(taskId, userId, newStatus, user, otpCode);
  try {
    await indexTask(updated);
  } catch (e) {
    console.error('Failed to index task after status update', e);
  }
  return enrichTaskWithRelations(updated);
};

/**
 * Cancel a task
 */
export const cancelTask = async (taskId, userId, reason = "Task cancelled by user") => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.createdById !== userId && userId !== "admin") {
      throw new Error("Only task creator can cancel");
    }

    if (task.status === "COMPLETED") {
      throw new Error("Cannot cancel completed tasks");
    }

    return updateTaskStatus(taskId, userId, "CANCELLED");
  } catch (error) {
    console.error("Failed to cancel task:", error);
    throw error;
  }
};

export const deleteTaskAndRemoveIndex = async (taskId) => {
  const deleted = await deleteTaskService(taskId);
  try {
    await deleteTask(taskId);
  } catch (e) {
    console.error('Failed to remove task from index', e);
  }
  return deleted;
};

/**
 * Get task statistics
 */
export const getTaskStats = async (userId) => {
  try {
    if (userId === "admin") {
      const [tasksCreated, tasksAssigned, tasksCompleted, tasksInProgress] = await Promise.all([
        prisma.task.count(),
        prisma.task.count({ where: { assignedToId: { not: null } } }),
        prisma.task.count({ where: { status: "COMPLETED" } }),
        prisma.task.count({ where: { status: "IN_PROGRESS" } }),
      ]);
      return {
        tasksCreated,
        tasksAssigned,
        tasksCompleted,
        tasksInProgress,
        completionRate: tasksAssigned > 0 ? ((tasksCompleted / tasksAssigned) * 100).toFixed(2) : 0,
      };
    }

    const tasksCreated = await prisma.task.count({
      where: { createdById: userId },
    });

    const tasksAssigned = await prisma.task.count({
      where: { assignedToId: userId },
    });

    const tasksCompleted = await prisma.task.count({
      where: { assignedToId: userId, status: "COMPLETED" },
    });

    const tasksInProgress = await prisma.task.count({
      where: { assignedToId: userId, status: "IN_PROGRESS" },
    });

    return {
      tasksCreated,
      tasksAssigned,
      tasksCompleted,
      tasksInProgress,
      completionRate: tasksAssigned > 0 ? ((tasksCompleted / tasksAssigned) * 100).toFixed(2) : 0,
    };
  } catch (error) {
    console.error("Failed to fetch task stats:", error);
    throw error;
  }
};

export const deleteTaskService = async (taskId) => {
  return prisma.$transaction(async (tx) => {
    await tx.marketplaceOrder.updateMany({
      where: { deliveryTaskId: taskId },
      data: { deliveryTaskId: null },
    });
    await tx.notification.deleteMany({ where: { taskId } });
    await tx.message.deleteMany({ where: { taskId } });
    await tx.review.deleteMany({ where: { taskId } });
    await tx.payment.deleteMany({ where: { taskId } });
    return tx.task.delete({ where: { id: taskId } });
  });
};

export default {
  createTask,
  getUserTasks,
  findNearbyTasks,
  searchTasks,
  assignHelper,
  declineHelperRequest,
  updateTaskDetails,
  getTaskById,
  getTasksAssignedToHelper,
  getTasksCreatedByUser,
  updateTaskStatus,
  cancelTask,
  getTaskStats,
  calculateDistance,
  deleteTaskService,
};
