import express from "express";
import { createBlog, deleteBlog, getAllBlog, getBlogById, updateBlog } from "../controller/admin/BlogController.js";
const route = express.Router();

route.post("/create", createBlog);
route.get("/getall", getAllBlog);
route.get("/get/:id", getBlogById);
route.put("/update/:id", updateBlog);
route.delete("/delete/:id", deleteBlog);

export default route;