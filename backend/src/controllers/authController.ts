import { Request, Response } from "express"
import { comparePasswords, hashPassword } from "../services/password.service"
import prisma from "../models/user"
import { generateToken } from "../services/auth.service"

export const register = async(request: Request, response: Response): Promise<void> => {
    const { email, password, firstName, lastName, phone, color} = request.body

    try {

        if(!email) {
            response.status(400).json({ error: "Email is Required"})
            return
        } 

        if(!password) {
            response.status(400).json({ error: "Password is Required"})
            return
        } 
        
        const hashedPassword = await hashPassword(password)
    
        const user = await prisma.create(
            {
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    phone,
                    color
                }
            }
        )

        const token = generateToken(user)

        response.status(201).json({token})


    } catch(error: any){
        if(error.code === 'P2002' && error.meta.target.includes("email")){
            response.status(400).json({ error: "Email Already Exists"})
        }
        response.status(500).json({ error: "Error on register"})
    }
}


export const login = async(request: Request, response: Response): Promise<void> => {
    
    const { email, password} = request.body

    try {

        if(!email) {
            response.status(400).json({ error: "Email is Required"})
            return
        } 

        if(!password) {
            response.status(400).json({ error: "Password is Required"})
            return
        } 

        const user = await prisma.findUnique({ where: {email}})

        if(!user){
            response.status(404).json({ error: 'User and password do not match'})
            return
        }

        const passwordMatch = await comparePasswords(password, user.password)


        if(!passwordMatch){
            response.status(401).json({ error: "User and password dont match"})
            return
        }

        const token = generateToken(user)
        response.status(200).json({token, id: user.id })

    } catch(error: any) {
        console.log("Error: ", error)
    }   
}