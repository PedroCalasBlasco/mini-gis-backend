import express  from "express"
import { authenticateToken } from "../middleware/authenticateToken"
import { createUser, deleteUser, getAllUsers, getUserById, updateUser } from "../controllers/usersControllers"


const usersRouter = express.Router()


usersRouter.post('/', authenticateToken, createUser)
usersRouter.get('/', authenticateToken, getAllUsers)
usersRouter.get('/:id', authenticateToken, getUserById)
usersRouter.put('/:id', authenticateToken, updateUser)
usersRouter.delete('/:id', authenticateToken, deleteUser)



export default usersRouter

















