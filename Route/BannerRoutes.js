import express from "express";
import { uploadsingleimg } from "../helper/storageImage.js";
import { banneController } from "../controller/admin/BannerController.js";

const route = express.Router();

route.post("/create",uploadsingleimg.single("image"),banneController.addBannerImage)
route.get("/",banneController.getBannner)
route.delete("/:id",banneController.deleteBanner)


export default route;