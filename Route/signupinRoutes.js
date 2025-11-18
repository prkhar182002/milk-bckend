import express from "express";
import {userController} from "../controller/all/userSignupin.js";
import { userMiddleware } from "../middlewere/userMiddlewere.js";
const routes= express.Router();

routes.post("/signup",userController.SignupUser)
routes.post("/login",userController.LoginUser)
routes.get("/logout",userController.logoutUser)
routes.get("/getuser",userMiddleware,userController.getUser)

export default routes;