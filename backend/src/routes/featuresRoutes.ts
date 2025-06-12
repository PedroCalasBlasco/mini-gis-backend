import express from "express"
import { authenticateToken } from "../middleware/authenticateToken"
import { getFeaturesByLayerId, createFeatures } from "../controllers/featuresController"

const featuresRouter = express.Router()

featuresRouter.get('/', authenticateToken, getFeaturesByLayerId)
featuresRouter.post('/', authenticateToken, createFeatures)

export default featuresRouter