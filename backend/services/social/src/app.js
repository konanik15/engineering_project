import express from "express";
import expressWS from "express-ws";
expressWS(express);
const router = express.Router();

import chatRoutes from "./chat/routes.js";

router.use("/chat", chatRoutes);

export default router;
