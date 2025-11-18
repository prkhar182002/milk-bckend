import express from "express";
import { uploadsingleimg } from "../helper/storageImage.js";
import { Categorycontroler } from "../controller/admin/ProductController.js";
const route = express.Router();

route.post("/create",uploadsingleimg.array("images",9),Categorycontroler.creatProduct)
route.get("/",Categorycontroler.getallProduct)
route.get("/:category",Categorycontroler.getProductByCategory)
route.get("/product/:slug",Categorycontroler.getSinglePRoduct)
route.get("/product/search/:search",Categorycontroler.searchProduct)

export default route;