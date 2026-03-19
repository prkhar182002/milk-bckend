import express from "express";
import { handleRazorpayWebhook } from "../controller/webhook/webhookController.js";

const router = express.Router();

// Test endpoint to verify webhook route is accessible
router.get("/", (req, res) => {
  console.log("🔔 Webhook test endpoint accessed");
  res.json({
    success: true,
    message: "Webhook endpoint is accessible",
    endpoints: {
      post: "/api/webhook",
      post_razorpay: "/api/webhook/razorpay",
      post_rz: "/api/webhook-rz",
    },
    timestamp: new Date().toISOString(),
  });
});

router.get("/test", (req, res) => {
  console.log("🔔 Webhook test endpoint accessed");
  res.json({
    success: true,
    message: "Webhook endpoint is accessible and working",
    method: "GET",
    timestamp: new Date().toISOString(),
  });
});

// Razorpay webhook endpoint
// Note: Raw body is needed for signature verification
// The raw body parser is applied at app level before express.json()
router.post("/", handleRazorpayWebhook);
router.post("/razorpay", handleRazorpayWebhook);

export default router;
