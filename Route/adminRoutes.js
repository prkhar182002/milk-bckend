import express from "express";
import { adminController } from "../controller/admin/adminAuthController.js";
import { adminMiddleware } from "../middlewere/adminMiddleware.js";
import { fetchUsers } from "../controller/user/userController.js";
import { getDashboardStats } from "../controller/admin/dashboardController.js";
import { getAdminNotifications, markAdminNotificationsRead } from "../controller/admin/notificationAdminController.js";

const routes = express.Router();

// Public routes
routes.post("/login", adminController.adminLogin);
routes.get("/verify", adminController.adminVerify);
routes.get("/logout", adminController.adminLogout);

// Protected routes (require admin authentication)
routes.get("/getadmin", adminMiddleware, adminController.getAdmin);
routes.put("/update-password", adminMiddleware, adminController.updateAdminPassword);
routes.get("/users", adminMiddleware, fetchUsers);
routes.get("/dashboard/stats", adminMiddleware, getDashboardStats);
routes.get("/notifications", adminMiddleware, getAdminNotifications);
routes.put("/notifications/read", adminMiddleware, markAdminNotificationsRead);

export default routes;
