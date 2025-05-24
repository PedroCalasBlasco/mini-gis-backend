import { Request, Response, NextFunction } from "express"
import jwt  from "jsonwebtoken"
import { JWT_SECRET } from '../config'

//Middleware de JWT para saber si estamos autenticados
export const authenticateToken = (request: Request, response: Response, next: NextFunction): void => {
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