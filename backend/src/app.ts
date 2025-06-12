import dotenv from "dotenv"
import express  from "express"
import authRouter from "./routes/authRoutes"
import usersRouter from "./routes/usersRoutes"
import mapsRoutes from "./routes/mapsRoutes"
import cors from 'cors'
import basemMapsRouter from "./routes/baseMapRoutes"
import layersRouter from "./routes/layersRoutes"
import widgetsRouter from "./routes/widgetsRoutes"
import crsRouter from "./routes/crsRoutes"
import featuresRouter from "./routes/featuresRoutes"

dotenv.config()

const app = express()

app.use(cors({
    origin: 'http://localhost:5173', // frontend
    credentials: true               // cookies o headers especiales
  }))

app.use(express.json())

//Routes
app.use('/auth', authRouter)
app.use('/users', usersRouter)
app.use('/maps', mapsRoutes)
app.use('/basemaps', basemMapsRouter)
app.use('/layers', layersRouter)
app.use('/widgets', widgetsRouter)
app.use('/crs', crsRouter)
app.use('/features', featuresRouter)


export default app