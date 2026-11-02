import express from "express";
import prisma from "../utils/prisma.js";
import { sendNotification } from "../services/notification.service.js";
import { getOrCreatePlatformAdminUser } from "../services/marketplace.service.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verifyUserToken } from "../utils/jwt.js";

const router = express.Router();

// Create a support ticket (works for logged-in or guest users)
router.post("/tickets", async (req, res) => {
  try {
    let { userId, name, email, phone, subject, category = "General", message, orderNumber, taskId } = req.body;

    // Optionally resolve user from Authorization Bearer token if present
    if (!userId || !name || !email) {
      try {
        const authHeader = req.headers.authorization || "";
        const [scheme, token] = authHeader.split(" ");
        if (scheme === "Bearer" && token && token !== "hirebuddy_admin_secret_2026") {
          const decoded = verifyUserToken(token);
          const resolvedId = decoded?.id || decoded?.userId;
          if (resolvedId) {
            const dbUser = await prisma.user.findUnique({
              where: { id: resolvedId },
              select: { id: true, name: true, email: true, phone: true },
            });
            if (dbUser) {
              userId = userId || dbUser.id;
              name = name || dbUser.name;
              email = email || dbUser.email;
              phone = phone || dbUser.phone;
            }
          }
        }
      } catch (e) {
        // Ignore token decode failure for guest tickets
      }
    }

    name = name || "HireBuddy Customer";
    email = email || "customer@hirebuddy.in";

    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and message are required." });
    }

    const fullMessage = [
      String(message).trim(),
      orderNumber ? `(Order: ${orderNumber})` : "",
      taskId ? `(Task ID: ${taskId})` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: userId || null,
        name: String(name).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : null,
        subject: String(subject).trim(),
        category: String(category || "General").trim(),
        message: fullMessage,
        status: "OPEN",
      },
    });

    try {
      const adminUser = await getOrCreatePlatformAdminUser();
      await sendNotification(
        null,
        userId || adminUser.id,
        adminUser.id,
        "support_ticket_created",
        `Support Ticket: ${ticket.subject}`,
        `${ticket.name} (${ticket.email}) submitted a support request: "${ticket.message.slice(0, 120)}"`
      );
    } catch (e) {
      console.warn("Support ticket notification warning:", e?.message);
    }

    res.status(201).json({
      success: true,
      message: "Your support ticket has been logged! Our Meerut Support Desk will assist you shortly.",
      ticket,
    });
  } catch (error) {
    console.error("Create support ticket error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get logged-in user's support tickets
router.get("/my-tickets", authMiddleware, async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          ...(req.user.email ? [{ email: req.user.email }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ tickets });
  } catch (error) {
    console.error("Get user support tickets error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all support tickets (supports both /admin/tickets and /admin/all)
const getAllAdminTicketsHandler = async (req, res) => {
  try {
    const rows = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
    });

    const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, phone: true, role: true },
          })
        : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const tickets = rows.map((t) => ({
      ...t,
      user: t.userId ? userMap[t.userId] || null : null,
      guestName: t.name,
      guestEmail: t.email,
      guestPhone: t.phone,
    }));

    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.get("/admin/tickets", getAllAdminTicketsHandler);
router.get("/admin/all", getAllAdminTicketsHandler);

// Admin: Reply / update support ticket status (supports both /admin/tickets/:ticketId and /admin/:ticketId/resolve)
const updateAdminTicketHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status = "RESOLVED", adminReply } = req.body;
    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(status ? { status } : {}),
        ...(adminReply !== undefined ? { adminReply } : {}),
      },
    });

    if (updated.userId && adminReply) {
      try {
        const adminUser = await getOrCreatePlatformAdminUser();
        await sendNotification(
          null,
          adminUser.id,
          updated.userId,
          "support_ticket_reply",
          `Support Update: ${updated.subject}`,
          `HireBuddy Support replied: "${adminReply}"`
        );
      } catch (e) {}
    }

    res.json({ success: true, ticket: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

router.patch("/admin/tickets/:ticketId", updateAdminTicketHandler);
router.patch("/admin/:ticketId/resolve", updateAdminTicketHandler);

export default router;
