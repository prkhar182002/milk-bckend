import express from "express";
import { userMiddleware } from "../middlewere/userMiddlewere.js";
import { createAddress, getAddress, UpdatedefaultAddress } from "../controller/user/AddressController.js";

const route = express.Router();

route.post("/create",userMiddleware,createAddress)
route.get("/get",userMiddleware,getAddress)
route.get("/update/:address_id",userMiddleware,UpdatedefaultAddress)





export default route;


