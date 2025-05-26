import express from "express"
import { authenticateToken } from "../middleware/authenticateToken"
import { createMap, getMapsByUser, deleteMap, updateMap, getMapByUserAndId } from "../controllers/mapController"


const mapsRouter = express.Router()


mapsRouter.post('/', authenticateToken, createMap)
mapsRouter.get('/', authenticateToken, getMapsByUser)
mapsRouter.get('/:id', authenticateToken, getMapByUserAndId)
mapsRouter.delete('/:id', authenticateToken, deleteMap)
mapsRouter.put('/:id', authenticateToken, updateMap)

export default mapsRouter