import express from "express";
import { adminMiddleware } from "../middlewere/adminMiddleware.js";
import {
  getPendingSettlements,
  settlePayment,
  getSettlementHistory,
} from "../controller/admin/settlementController.js";

const router = express.Router();

router.use(adminMiddleware);

router.get("/pending", getPendingSettlements);
router.post("/settle", settlePayment);
router.get("/history", getSettlementHistory);

export default router;
