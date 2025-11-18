import express from "express";
import { createBlog, deleteBlog, getAllBlog } from "../controller/admin/BlogController.js";
import { uploadsingleimg } from "../helper/storageImage.js";
const route = express.Router();

route.post("/create",uploadsingleimg.single("image"),createBlog)
route.get("/getall",getAllBlog)
route.delete("/delete/:id",deleteBlog)

export default route 