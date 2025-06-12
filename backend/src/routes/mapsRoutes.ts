import express from "express";
import { authenticateToken } from "../middleware/authenticateToken";
import {
  createMap,
  getMapsByUser,
  deleteMap,
  updateMap,
  getMapByUserAndId,
  getPublicMaps,
  getMapsSharedWithUser,
} from "../controllers/mapController";

const mapsRouter = express.Router();

mapsRouter.post("/", authenticateToken, createMap);
mapsRouter.get("/", authenticateToken, getMapsByUser);
mapsRouter.get("/public", authenticateToken, getPublicMaps);
mapsRouter.get("/shared", authenticateToken, getMapsSharedWithUser);
mapsRouter.get("/:id", authenticateToken, getMapByUserAndId);
mapsRouter.delete("/:id", authenticateToken, deleteMap);
mapsRouter.put("/:id", authenticateToken, updateMap);

export default mapsRouter;
