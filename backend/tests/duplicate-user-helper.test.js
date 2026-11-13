import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import prisma from "../src/utils/prisma.js";

describe("Duplicate Email & Phone Prevention across User & Helper Creation", () => {
  let server;
  let baseUrl;
  let dbConnected = false;
  const createdUserIds = [];
  let restoreMocks = () => {};

  const suffix = String(Math.floor(100000 + Math.random() * 899999));
  const userPhone = `9811${suffix}`;
  const userEmail = `customer.${suffix}@hirebuddy.test`;
  const helperPhone = `9822${suffix}`;
  const helperEmail = `helper.${suffix}@hirebuddy.test`;
  const adminHelperPhone = `9833${suffix}`;
  const adminHelperEmail = `adminhelper.${suffix}@hirebuddy.test`;

  before(async () => {
    try {
      await prisma.user.count();
      dbConnected = true;
    } catch {
      dbConnected = false;
      // Fallback in-memory User store if MariaDB isn't running locally
      const store = [];
      const origFindMany = prisma.user.findMany;
      const origFindUnique = prisma.user.findUnique;
      const origFindFirst = prisma.user.findFirst;
      const origCreate = prisma.user.create;

      const matchesCondition = (u, cond) => {
        if (!cond) return true;
        if (cond.NOT && matchesCondition(u, cond.NOT)) return false;
        if (cond.id && u.id !== cond.id) return false;
        if (cond.email !== undefined && u.email !== cond.email) return false;
        if (cond.phone !== undefined && u.phone !== cond.phone) return false;
        if (Array.isArray(cond.OR)) {
          return cond.OR.some((sub) => matchesCondition(u, sub));
        }
        return true;
      };

      prisma.user.findMany = async ({ where } = {}) =>
        store.filter((u) => matchesCondition(u, where));
      prisma.user.findFirst = async ({ where } = {}) =>
        store.find((u) => matchesCondition(u, where)) || null;
      prisma.user.findUnique = async ({ where } = {}) =>
        store.find((u) => matchesCondition(u, where)) || null;
      prisma.user.create = async ({ data }) => {
        if (data.email && store.some((u) => u.email === data.email)) {
          const e = new Error("Unique constraint failed on the fields: (`email`)");
          e.code = "P2002";
          e.meta = { target: ["email"] };
          throw e;
        }
        if (data.phone && store.some((u) => u.phone === data.phone)) {
          const e = new Error("Unique constraint failed on the fields: (`phone`)");
          e.code = "P2002";
          e.meta = { target: ["phone"] };
          throw e;
        }
        const row = {
          id: `mock-${store.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        store.push(row);
        return row;
      };

      restoreMocks = () => {
        prisma.user.findMany = origFindMany;
        prisma.user.findUnique = origFindUnique;
        prisma.user.findFirst = origFindFirst;
        prisma.user.create = origCreate;
      };
    }

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (dbConnected && createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
    restoreMocks();
  });

  const postJson = async (path, body, headers = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  it("1. Creates a new customer via /api/auth/signup and rejects duplicate email or phone", async () => {
    const createRes = await postJson("/api/auth/signup", {
      name: "Test Customer",
      email: `  ${userEmail.toUpperCase()}  `,
      phone: `+91 ${userPhone}`,
      password: "Password@123",
    });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.data.user.email, userEmail);
    assert.equal(createRes.data.user.phone, userPhone);
    createdUserIds.push(createRes.data.user.id);

    // Duplicate email (case-insensitive) with different phone -> 409
    const dupEmailRes = await postJson("/api/auth/signup", {
      name: "Another User",
      email: userEmail.toUpperCase(),
      phone: `9844${suffix}`,
      password: "Password@123",
    });
    assert.equal(dupEmailRes.status, 409);
    assert.match(dupEmailRes.data.message, /email/i);

    // Duplicate phone (+91 formatted) with different email -> 409
    const dupPhoneRes = await postJson("/api/auth/signup", {
      name: "Another User",
      email: `unique.${suffix}@hirebuddy.test`,
      phone: `+91${userPhone}`,
      password: "Password@123",
    });
    assert.equal(dupPhoneRes.status, 409);
    assert.match(dupPhoneRes.data.message, /mobile number/i);

    // Both duplicate email and phone -> 409
    const dupBothRes = await postJson("/api/auth/signup", {
      name: "Another User",
      email: userEmail,
      phone: userPhone,
      password: "Password@123",
    });
    assert.equal(dupBothRes.status, 409);
    assert.match(dupBothRes.data.message, /email.*mobile number/i);
  });

  it("2. Rejects public helper registration (/api/auth/register-helper) for existing user/helper email or phone without overwriting", async () => {
    // Attempt to register helper with existing CUSTOMER phone -> MUST fail with 409 (not overwrite!)
    const hijackPhoneRes = await postJson("/api/auth/register-helper", {
      firstName: "Attacker",
      lastName: "Helper",
      phone: userPhone,
      password: "NewPassword@999",
      services: ["Plumber"],
    });
    assert.equal(hijackPhoneRes.status, 409);
    assert.match(hijackPhoneRes.data.message, /mobile number/i);

    // Attempt to register helper with existing CUSTOMER email -> MUST fail with 409
    const hijackEmailRes = await postJson("/api/auth/register-helper", {
      firstName: "Attacker",
      lastName: "Helper",
      phone: helperPhone,
      email: userEmail.toUpperCase(),
      password: "NewPassword@999",
      services: ["Plumber"],
    });
    assert.equal(hijackEmailRes.status, 409);
    assert.match(hijackEmailRes.data.message, /email/i);

    // Register a genuinely new helper -> 201
    const validHelperRes = await postJson("/api/auth/register-helper", {
      firstName: "Ramesh",
      lastName: "Kumar",
      phone: helperPhone,
      email: helperEmail,
      password: "Helper@1234",
      services: ["Electrician", "Plumber"],
    });
    assert.equal(validHelperRes.status, 201);
    assert.equal(validHelperRes.data.user.role, "HELPER");
    createdUserIds.push(validHelperRes.data.user.id);

    // Attempt to re-register with same helper phone -> 409
    const dupHelperPhoneRes = await postJson("/api/auth/register-helper", {
      firstName: "Duplicate",
      lastName: "Helper",
      phone: `0${helperPhone}`,
      password: "Helper@5678",
      services: ["Cleaning"],
    });
    assert.equal(dupHelperPhoneRes.status, 409);
    assert.match(dupHelperPhoneRes.data.message, /mobile number/i);
  });

  it("3. Rejects admin helper/user creation (/api/user/helper/create) for existing email or phone", async () => {
    const adminHeaders = {
      Authorization: "Bearer hirebuddy_admin_secret_2026",
    };

    // Duplicate phone against existing helper -> 409
    const dupPhoneAdmin = await postJson(
      "/api/user/helper/create",
      {
        name: "Admin Dup Phone",
        phone: `+91-${helperPhone}`,
        password: "Helper@1234",
        skills: "Cleaning",
      },
      adminHeaders
    );
    assert.equal(dupPhoneAdmin.status, 409);
    assert.match(dupPhoneAdmin.data.message, /mobile number/i);

    // Duplicate email against existing customer -> 409
    const dupEmailAdmin = await postJson(
      "/api/user/helper/create",
      {
        name: "Admin Dup Email",
        phone: adminHelperPhone,
        email: userEmail,
        password: "Helper@1234",
        skills: "Cleaning",
      },
      adminHeaders
    );
    assert.equal(dupEmailAdmin.status, 409);
    assert.match(dupEmailAdmin.data.message, /email/i);

    // Valid new helper by admin -> 201
    const okAdmin = await postJson(
      "/api/user/helper/create",
      {
        name: "Admin Created Helper",
        phone: adminHelperPhone,
        email: adminHelperEmail,
        password: "Helper@1234",
        skills: "Cleaning",
      },
      adminHeaders
    );
    assert.equal(okAdmin.status, 201);
    assert.equal(okAdmin.data.helper.phone, adminHelperPhone);
    assert.equal(okAdmin.data.helper.email, adminHelperEmail);
    createdUserIds.push(okAdmin.data.helper.id);
  });

  it("4. Invalidates active helper JWT immediately with ACCOUNT_DELETED when deleted from Admin", async () => {
    const adminSecret = process.env.ADMIN_SECRET || "hirebuddy_admin_secret_2026";
    const tempPhone = `9755${suffix}`;
    const regRes = await postJson("/api/auth/register-helper", {
      firstName: "Delete",
      lastName: "Target",
      phone: tempPhone,
      password: "Password@123",
      services: ["Cleaning"],
    });
    assert.equal(regRes.status, 201);
    const token = regRes.data.token;
    const helperId = regRes.data.user.id;
    createdUserIds.push(helperId);

    // Before delete: /api/user/profile succeeds
    const meBefore = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(meBefore.status, 200);

    // Admin deletes the helper account via DELETE /api/user/:id
    const delRes = await fetch(`${baseUrl}/api/user/${helperId}`, {
      method: "DELETE",
      headers: { "x-admin-token": adminSecret },
    });
    assert.equal(delRes.status, 200);

    // After delete: /api/user/profile immediately returns 401 ACCOUNT_DELETED
    const meAfter = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meAfterBody = await meAfter.json();
    assert.equal(meAfter.status, 401);
    assert.equal(meAfterBody.code, "ACCOUNT_DELETED");
    assert.equal(meAfterBody.isDeleted, true);
  });
});
