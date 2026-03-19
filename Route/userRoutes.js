import express from "express";
import { fetchUsers } from "../controller/user/userController.js";



const router = express.Router();

router.get("/all", fetchUsers);

export default router;
