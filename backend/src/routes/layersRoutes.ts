import express from "express";
import { authenticateToken } from "../middleware/authenticateToken";
import {
  getLayersByUser,
  createLayer,
  getLayerById,
  deleteLayer,
  updateLayer,
  getLayersSharedWithUser,
  getPublicLayers,
} from "../controllers/layersController";

const layersRouter = express.Router();

layersRouter.get("/", authenticateToken, getLayersByUser);
layersRouter.get("/public", authenticateToken, getPublicLayers);
layersRouter.get("/shared", authenticateToken, getLayersSharedWithUser);
layersRouter.post("/", authenticateToken, createLayer);
layersRouter.get("/:layerId", authenticateToken, getLayerById);
layersRouter.delete("/:layerId", authenticateToken, deleteLayer);
layersRouter.put("/:layerId", authenticateToken, updateLayer);

export default layersRouter;
