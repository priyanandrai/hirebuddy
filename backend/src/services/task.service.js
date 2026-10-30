import prisma from "../utils/prisma.js";
import { notificationEvents } from "./notification.service.js";
import { indexTask, deleteTask } from "./es.client.js";
import { emitToTaskRoom, emitToUser } from "../config/socket.config.js";
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
 * Create a new task
 */
export const createTask = async (data, user) => {
  const {
    title,
    description,
    category = "General",
    location = "To be coordinated",
    latitude,
    longitude,
    budget,
    preferredAt,
    helperId,
  } = data;

  const isDirectRequest = Boolean(helperId);

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

  const task = await prisma.task.create({
    data: {
      title,
      description,
      category: resolvedCategoryName,
      location: location || "To be coordinated",
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      budget: Number(budget || 0),
      preferredAt: preferredAt ? new Date(preferredAt) : null,
      createdById: user.id,
      assignedToId: helperId || null,
      status: isDirectRequest ? "REQUESTED" : "OPEN",
      paymentStatus: "PENDING",
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true, phone: true } },
      assignedTo: { select: { id: true, name: true, image: true, phone: true } },
    },
  });

  if (isDirectRequest && helperId) {
    try {
      await notificationEvents.taskRequested(task.id, user.id, helperId);
      emitToUser(helperId, 'task_requested', {
        taskId: task.id,
        task,
        customerName: user.name || 'A customer',
        message: `${user.name || 'A customer'} requested you for "${task.title}"`,
      });
    } catch (notifErr) {
      console.warn('Failed to send task requested alert:', notifErr?.message);
    }
  }

  return task;
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
export const getUserTasks = (userId) => {
  return prisma.task.findMany({
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
    },
    orderBy: { createdAt: "desc" },
  });
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

    const where = {};
    if (status && status !== "ALL") where.status = status;

    let dbTasks = await prisma.task.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        assignedTo: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // Normalize DB tasks with presentation fields if not present
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
        : "29 Oct 2026",
      timeSlot: t.timeSlot || "10:00 AM - 01:00 PM",
      relevanceOrder: 100 + index,
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
            `Need a verified helper for ${dbCat.name} services.`,
          image: getCategoryImageForTask(dbCat.name, dbCat.name),
          isNew: true,
          status: "OPEN",
          isDefaultGrid: false,
          relevanceOrder: 20,
        });
      }
    }

    let combinedTasks = useHelperCatalog
      ? [
          ...dynamicCatalogTasks,
          ...formattedDbTasks.filter(
            (dbTask) =>
              !dynamicCatalogTasks.some(
                (catTask) =>
                  catTask.title.toLowerCase() === String(dbTask.title || "").toLowerCase() &&
                  Number(catTask.budget) === Number(dbTask.budget)
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
    select: { idVerificationStatus: true },
  });
  if (helperUser?.idVerificationStatus !== "VERIFIED") {
    throw new Error(
      "Your account is not verified yet. Please complete document verification and wait for admin approval to accept tasks."
    );
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
  const isDirectRequestForUser = task.status === "REQUESTED" && task.assignedToId === user.id;

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
    emitToTaskRoom(taskId, 'task_status_changed', { taskId, newStatus: 'ASSIGNED' });
    emitToUser(task.createdById, 'task_status_changed', { taskId, newStatus: 'ASSIGNED' });
  } catch (e) {
    console.warn('Socket emit error:', e?.message);
  }

  return updatedTask;
};

/**
 * Decline a direct booking request as helper
 */
export const declineHelperRequest = async (user, taskId, reason = "Helper is unavailable") => {
  if (user.role !== "HELPER") {
    throw new Error("Only helpers can decline tasks");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
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

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "CANCELLED",
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true, phone: true } },
      assignedTo: { select: { id: true, name: true, image: true, phone: true } },
    },
  });

  try {
    await notificationEvents.taskDeclined(taskId, user.id, task.createdById, reason);
    emitToTaskRoom(taskId, 'task_status_changed', { taskId, newStatus: 'CANCELLED' });
    emitToUser(task.createdById, 'task_status_changed', { taskId, newStatus: 'CANCELLED' });
  } catch (e) {
    console.warn('Decline notification error:', e?.message);
  }

  return updatedTask;
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
      messages: { select: { id: true } },
      reviews: { select: { id: true } },
      payments: { select: { id: true, status: true } },
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

  return task;
};

/**
 * Get tasks assigned to a helper
 */
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
          image: true,
          phone: true,
          city: true,
          averageRating: true,
          totalReviews: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Get tasks created by user
 */
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Update task status
 */
export const updateTaskStatus = async (taskId, userId, newStatus, user = null) => {
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
      ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!isAdmin && !validTransitions[task.status]?.includes(newStatus)) {
      throw new Error(`Cannot transition from ${task.status} to ${newStatus}`);
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
    if (newStatus === "IN_PROGRESS" && otherUserId) {
      await notificationEvents.taskStarted(taskId, userId, otherUserId);
    } else if (newStatus === "COMPLETED" && otherUserId) {
      await notificationEvents.taskCompleted(taskId, userId, otherUserId);
    } else if (newStatus === "CANCELLED" && otherUserId) {
      await notificationEvents.taskCancelled(taskId, userId, otherUserId);
    }

    try {
      emitToTaskRoom(taskId, 'task_status_changed', { taskId, newStatus });
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
export const updateTaskStatusAndIndex = async (taskId, userId, newStatus, user = null) => {
  const updated = await updateTaskStatus(taskId, userId, newStatus, user);
  try {
    await indexTask(updated);
  } catch (e) {
    console.error('Failed to index task after status update', e);
  }
  return updated;
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

    if (task.createdById !== userId) {
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
  // delete from DB
  const deleted = await prisma.task.delete({ where: { id: taskId } });
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
  getTaskById,
  getTasksAssignedToHelper,
  getTasksCreatedByUser,
  updateTaskStatus,
  cancelTask,
  getTaskStats,
  calculateDistance,
  deleteTaskService,
};
