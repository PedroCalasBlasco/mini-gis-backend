import express from "express"
import { authenticateToken } from "../middleware/authenticateToken"
import { getCRS } from "../controllers/crsController"


const crsRouter = express.Router()

crsRouter.get('/', getCRS)

export default crsRouter