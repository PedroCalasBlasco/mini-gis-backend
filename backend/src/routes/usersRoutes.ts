import express, { Request, Response, NextFunction } from "express"
import jwt  from "jsonwebtoken"
import { createUser, deleteUser, getAllUsers, getUserById, updateUser } from "../controllers/usersControllers"


const usersRouter = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'

//Middleware de JWT para saber si estamos autenticados
const authenticateToken = (request: Request, response: Response, next: NextFunction): void => {
    const authHeader = request.headers['authorization']
    const token = authHeader &&  authHeader.split(' ')[1]
    if(!token){
        response.status(401).json({ error: 'No Authorization'})
        return
    }

    jwt.verify(token, JWT_SECRET, (error, __decoded) => {
        if(error){
            console.error("Error on authetication", error)
            response.status(403).json({error: 'You dont have access to this resource'})
            return
        }
        next()
    })

}


usersRouter.post('/', authenticateToken, createUser)
usersRouter.get('/', authenticateToken, getAllUsers)
usersRouter.get('/:id', authenticateToken, getUserById)
usersRouter.put('/:id', authenticateToken, updateUser)
usersRouter.delete('/:id', authenticateToken, deleteUser)



export default usersRouter

















