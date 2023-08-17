import express from "express";
import expressWS from "express-ws";
expressWS(express);
const router = express.Router();

import chatRoutes from "./chat/routes.js";
import friendsRoutes from "./friends/routes.js";
import profileRoutes from "./profile/routes.js";

router.use("/chat", chatRoutes);
router.use("/friends", friendsRoutes);
router.use("/profile", profileRoutes);

export default router;
