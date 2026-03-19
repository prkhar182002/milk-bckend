import express from "express";
import { riderMiddleware } from "../middlewere/riderMiddleware.js";
import {
  riderLogin,
  riderLogout,
  getRiderProfile,
  updateRiderProfile,
  updateFcmToken,
  toggleOnline,
} from "../controller/rider/riderAuthController.js";

const router = express.Router();

router.post("/login", riderLogin);

// Protected routes
router.get("/logout", riderMiddleware, riderLogout);
router.get("/me", riderMiddleware, getRiderProfile);
router.put("/profile", riderMiddleware, updateRiderProfile);
router.put("/fcm-token", riderMiddleware, updateFcmToken);
router.put("/toggle-online", riderMiddleware, toggleOnline);

export default router;
