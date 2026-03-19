import express from "express";
import { AddtoCart, allReadyInCArt, deleteCart, GetAllCart, getSingleCart, UpdateCart, clearAllCart } from "../controller/user/CartController.js";
import { userMiddleware } from "../middlewere/userMiddlewere.js";

const route = express.Router();


route.post("/addtocart",userMiddleware,AddtoCart)
route.get("/cart/:product_id",userMiddleware,allReadyInCArt)
route.get("/cartallcart",userMiddleware,GetAllCart)
route.put("/updatecart/:id",userMiddleware,UpdateCart)
route.delete("/deletecart/:id",userMiddleware,deleteCart)
route.delete("/clearall",userMiddleware,clearAllCart) // Clear all cart items
route.get("/:id",userMiddleware,getSingleCart)


export default route;