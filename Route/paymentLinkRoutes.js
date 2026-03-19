import express from "express";
import { userMiddleware } from "../middlewere/userMiddlewere.js";
import {
  createOrderPaymentLink,
  getPaymentLink,
  getUserPaymentLinks,
  checkPaymentStatus,
  cancelUserPaymentLink,
} from "../controller/user/paymentLinkController.js";

const router = express.Router();

// Create payment link for an order
router.post("/create", userMiddleware, createOrderPaymentLink);

// Get all payment links for the user
router.get("/", userMiddleware, getUserPaymentLinks);

// Get specific payment link
router.get("/:id", userMiddleware, getPaymentLink);

// Check payment status (polling fallback)
router.get("/:payment_link_id/status", userMiddleware, checkPaymentStatus);

// Cancel payment link
router.post("/:id/cancel", userMiddleware, cancelUserPaymentLink);

export default router;
