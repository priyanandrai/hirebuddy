import express from "express";
import {
  setRole,
  updateHelperProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/set-role", setRole);
router.post("/helper-profile", updateHelperProfile);

export default router;
