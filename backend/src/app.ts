import dotenv from "dotenv"
import express  from "express"
import authRouter from "./routes/authRoutes"
import usersRouter from "./routes/usersRoutes"
import cors from 'cors'

dotenv.config()

const app = express()

app.use(cors({
    origin: 'http://localhost:5173', // tu frontend
    credentials: true               // si usas cookies o headers especiales
  }))

app.use(express.json())

//Routes
app.use('/auth', authRouter)
app.use('/users', usersRouter)


export default app