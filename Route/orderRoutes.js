import express from "express"
import { userMiddleware } from "../middlewere/userMiddlewere.js";
import { createOrder, getOrder, getSingleOrder, verifyOrder, getRazorpayKey } from "../controller/user/razerpayController.js";

const route = express.Router();

route.get("/key", getRazorpayKey) // Get Razorpay key (public, no auth needed)
route.post("/create",userMiddleware,createOrder)
route.post("/verify",userMiddleware,verifyOrder)
route.get("/getorder",userMiddleware,getOrder)
route.get("/getsingleorder/:id",userMiddleware,getSingleOrder)

export default route