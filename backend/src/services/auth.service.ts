import { User } from "../models/user.interface"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config"


export const generateToken = (user: User): string => {
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" })
}