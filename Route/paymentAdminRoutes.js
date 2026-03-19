import express from "express";
import { adminMiddleware } from "../middlewere/adminMiddleware.js";
import {
  getAllPaymentLinks,
  getAdminPaymentLink,
  cancelAdminPaymentLink,
  getAllTransactions,
  getAdminTransaction,
  createAdminRefund,
  getAllRefunds,
  getWebhookEvents,
  getPaymentStatistics,
} from "../controller/admin/paymentAdminController.js";

const router = express.Router();

// Payment Statistics
router.get("/statistics", adminMiddleware, getPaymentStatistics);

// Payment Links
router.get("/payment-links", adminMiddleware, getAllPaymentLinks);
router.get("/payment-links/:id", adminMiddleware, getAdminPaymentLink);
router.post("/payment-links/:id/cancel", adminMiddleware, cancelAdminPaymentLink);

// Transactions
router.get("/transactions", adminMiddleware, getAllTransactions);
router.get("/transactions/:id", adminMiddleware, getAdminTransaction);

// Refunds
router.get("/refunds", adminMiddleware, getAllRefunds);
router.post("/refunds/create", adminMiddleware, createAdminRefund);

// Webhook Events (Audit Trail)
router.get("/webhooks", adminMiddleware, getWebhookEvents);

export default router;
