import express from "express";
import expressWS from "express-ws";
import cors from "cors";
import chatRoutes from "./chat/routes.js";
import friendsRoutes from "./friends/routes.js";
import profileRoutes from "./profile/routes.js";

expressWS(express);
const router = express.Router();

const corsOptions = {
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};

router.use("/chat", cors(corsOptions), chatRoutes);
router.use("/friends", cors(corsOptions), friendsRoutes);
router.use("/profile", cors(corsOptions), profileRoutes);

export default router;
