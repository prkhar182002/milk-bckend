import express from "express";
import { adminMiddleware } from "../middlewere/adminMiddleware.js";
import {
  createRider,
  getAllRiders,
  getRiderById,
  updateRider,
  updateRiderStatus,
  deleteRider,
  getOnlineRiders,
  getLiveLocations,
  getRiderAssignments,
} from "../controller/admin/riderAdminController.js";

const router = express.Router();

router.use(adminMiddleware);

router.post("/create", createRider);
router.get("/", getAllRiders);
router.get("/online", getOnlineRiders);
router.get("/locations/live", getLiveLocations);
router.get("/assignments", getRiderAssignments);
router.get("/:id", getRiderById);
router.put("/:id", updateRider);
router.put("/:id/status", updateRiderStatus);
router.delete("/:id", deleteRider);

export default router;
