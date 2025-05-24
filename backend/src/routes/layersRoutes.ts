import express from "express"
import { authenticateToken } from "../middleware/authenticateToken"
import { getLayersByUser } from "../controllers/layersController"

const layersRouter = express.Router()

layersRouter.get('/', authenticateToken, getLayersByUser)

export default layersRouter