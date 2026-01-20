import express from "express";
import { handleRazorpayWebhook } from "../controller/webhook/webhookController.js";

const router = express.Router();

// Razorpay webhook endpoint
// Note: Raw body is needed for signature verification
// The raw body parser is applied at app level before express.json()
router.post("/razorpay", handleRazorpayWebhook);

export default router;
