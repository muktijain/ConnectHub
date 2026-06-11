import express from "express";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import connectToSocket from "./controllers/socketManager.js";
import {login, register} from "./controllers/users.controller.js";
import userRoutes from "./routes/users.route.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);
app.use(cors());
app.use(express.json({limit: "40kb"}));  //limit the size of incoming JSON payloads to 40kb
app.use(express.urlencoded({limit: "40kb", extended: true})); //limit the size of incoming URL-encoded payloads to 40kb and allow for rich objects and arrays to be encoded into the URL-encoded format

const MONGO_URL = process.env.MONGO_URL;
app.set("port", process.env.PORT || 5000);

app.use("/api/v1/users", userRoutes); 

const startServer = async () => {
    try {
        server.listen(app.get("port"), () => {
            console.log("Server is running on port " + app.get("port"));
        });
        await mongoose.connect(MONGO_URL);
        console.log("connected to database");
    } catch (error) {
        console.error("Error starting server:", error);
    }
};

startServer();
