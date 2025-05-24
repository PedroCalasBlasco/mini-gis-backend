import express from "express"
import { authenticateToken } from "../middleware/authenticateToken"
import { getAllBaseMaps } from "../controllers/baseMapController"


const basemMapsRouter = express.Router()

basemMapsRouter.get('/', authenticateToken, getAllBaseMaps)

export default basemMapsRouter