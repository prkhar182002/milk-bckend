import express from "express";
import { adminMiddleware } from "../middlewere/adminMiddleware.js";
import {
  assignOrderToRider,
  getSuggestions,
  getNearbyRiders,
  reassignOrder,
} from "../controller/admin/assignmentController.js";

const router = express.Router();

router.use(adminMiddleware);

router.post("/assign", assignOrderToRider);
router.get("/suggestions/:orderId", getSuggestions);
router.get("/nearby/:orderId", getNearbyRiders);
router.put("/:id/reassign", reassignOrder);

export default router;
