import express from "express";
import { Categorycontroler } from "../controller/admin/ProductController.js";
import { uploadsingleimg } from "../helper/storageImage.js";
const routes = express.Router()

routes.post("/create",uploadsingleimg.single("image"),Categorycontroler.createCategory)
routes.get("/:id",Categorycontroler.getSingleCategory)
routes.put("/:id",uploadsingleimg.single("image"),Categorycontroler.updateCategory)
routes.delete("/:id",Categorycontroler.deleteCategory);



routes.get("/",Categorycontroler.getCategory)
routes.get("/:category",Categorycontroler.getCategory)


export default routes;