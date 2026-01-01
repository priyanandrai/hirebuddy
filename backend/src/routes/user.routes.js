import express from "express";
import {
  setRole,
  updateHelperProfile,
  getHelperById
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/set-role", setRole);
router.post("/helper-profile", updateHelperProfile);
router.get("/helper/:id", getHelperById); //

export default router;
