import express from "express";
import { adminMiddleware } from "../middlewere/adminMiddleware.js";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
} from "../controller/admin/orderAdminController.js";

const router = express.Router();

// All routes require admin authentication
router.get("/", adminMiddleware, getAllOrders);
router.get("/:id", adminMiddleware, getOrderById);
router.put("/:id/status", adminMiddleware, updateOrderStatus);
router.put("/:id/payment-status", adminMiddleware, updatePaymentStatus);

export default router;
