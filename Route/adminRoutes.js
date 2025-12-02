import express from "express";
import { adminLogin, verifyAdmin } from "../controller/admin/adminController.js";

const router = express.Router();

// POST /admin/login
router.post("/login", adminLogin);

// GET /admin/verify
router.get("/verify", verifyAdmin);





export default router;
