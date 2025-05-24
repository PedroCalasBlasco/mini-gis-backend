import express from "express"
import { authenticateToken } from "../middleware/authenticateToken"
import { getAllWidgets } from "../controllers/widgetController"


const widgetsRouter = express.Router()


widgetsRouter.get('/', authenticateToken, getAllWidgets)

export default widgetsRouter