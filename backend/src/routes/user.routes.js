import express from "express";
import {
  setRole,
  updateMyProfile,
  updateHelperProfile,
  getHelperById,
  getHelpersList,
  submitIdDocument,
  verifyUserId,
  getPendingIdSubmissions,
  getAssignedHelpersFromMyTasks,
  getAllUsers,
  updateUserRole,
  blockUser,
  deleteUser,
  createHelperByAdmin,
  getMyProfile,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, getMyProfile);
router.put("/profile", authMiddleware, updateMyProfile);
router.patch("/profile", authMiddleware, updateMyProfile);
router.post("/profile", authMiddleware, updateMyProfile);
router.get("/all", authMiddleware, getAllUsers);
router.post("/set-role", authMiddleware, setRole);
router.post("/helper-profile", authMiddleware, updateHelperProfile);
router.post("/helper/create", authMiddleware, createHelperByAdmin);
router.post("/helpers", authMiddleware, createHelperByAdmin);
router.post("/create", authMiddleware, createHelperByAdmin);
router.post("/id/submit", authMiddleware, submitIdDocument);
router.get("/helper/:id", getHelperById); //
router.get("/helpers", authMiddleware, getHelpersList);
// 👇 helpers assigned to my tasks
router.get("/assigned-helpers", authMiddleware, getAssignedHelpersFromMyTasks);
router.get('/pending-ids', authMiddleware, getPendingIdSubmissions);
router.post('/id/:id/verify', authMiddleware, verifyUserId);
router.patch('/id/:id/verify', authMiddleware, verifyUserId);
router.put('/:id/role', authMiddleware, updateUserRole);
router.patch('/:id/role', authMiddleware, updateUserRole);
router.patch('/:id/block', authMiddleware, blockUser);
router.post('/:id/block', authMiddleware, blockUser);
router.put('/:id/block', authMiddleware, blockUser);
router.delete('/:id', authMiddleware, deleteUser);

export default router;
