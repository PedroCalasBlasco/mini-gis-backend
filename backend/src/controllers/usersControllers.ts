import { Request, Response } from "express"
import { hashPassword } from "../services/password.service"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const createUser = async(request: Request, response: Response): Promise<void> => {

    try {
        const { email, password, firstName, lastName, phone, color} = request.body
        const hasshedPassword = await hashPassword(password)

        if(!email) {
            response.status(400).json({ error: "Email is Required"})
            return
        } 

        if(!password) {
            response.status(400).json({ error: "Password is Required"})
            return
        } 

        if(!firstName) {
            response.status(400).json({ error: "First NAme is Required"})
            return
        } 

        if(!lastName) {
            response.status(400).json({ error: "Last Name is Required"})
            return
        } 

        const user = await prisma.user.create( 
            {
                data: {
                    email,
                    password: hasshedPassword,
                    firstName: firstName ?? undefined,
                    lastName: lastName ?? undefined,
                    phone: phone ?? undefined,
                    color: color ?? undefined
                }
            }

        )

        response.status(201).json({user})

    } catch(error: any) {
        if(error.code === 'P2002' && error.meta.target.includes("email")){
            response.status(400).json({ error: "Email Already Exists"})
        }
        response.status(500).json({ error: "Error on register"})
    }
}

export const getAllUsers = async(request: Request, response: Response): Promise<void> => { 
    try {
        const users = await prisma.user.findMany()
        response.status(200).json({users})

    } catch(error: any) {
        response.status(500).json({ error: "Error fetching users" })
    }
}

export const getUserById = async(request: Request, response: Response): Promise<void> => { 

    const userId = parseInt(request.params.id)

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                color: true,
              },
        })

        if(!user){
            response.status(404).json({error: 'User not found'})
            return
        }
        response.status(200).json(user)

    } catch(error: any) {
        response.status(500).json({ error: "Error: try again later"})
    }
}


export const updateUser = async(request: Request, response: Response): Promise<void> => { 

    const userId = parseInt(request.params.id)
    const { email, password } = request.body

    console.log("PASSS", password)

    try {

        let dataToUpdate: any =  {...request.body} 

        if (password && password.trim().length > 0) {
            const hashedPassword = await hashPassword(password)
            dataToUpdate.password = hashedPassword
        } else {
            delete dataToUpdate.password
        }

        if(email){
            dataToUpdate.email = email
        }

        const user = await prisma.user.update({
            where: {
                id: userId
            },
            data: dataToUpdate
        })

        response.status(200).json(user)

    } catch(error: any) {
        if(error.code === 'P2002' && error.meta.targets.includes('email')) {
            response.status(400).json({error: 'email already exists'}) 
        
        }else if(error.code === 'P2025') {
            response.status(400).json({error: 'User doesnt found'}) 

        } else {
            response.status(500).json({ error: "Error: try again later"})
        }
    }
}


export const deleteUser = async(request: Request, response: Response): Promise<void> => { 

    const userId = parseInt(request.params.id)

    try {

        await prisma.user.delete({
            where: {
                id: userId
            }
        })

        response.status(200).json({ message: `User ${userId} was removed`}).end()

    } catch(error: any) {

        if(error.code === 'P2002' && error.meta.targets.includes('email')) {
            response.status(400).json({error: 'email already exists'}) 
        
        }else if(error.code === 'P2025') {
            response.status(400).json({error: 'User doesnt found'}) 

        } else {
            response.status(500).json({ error: "Error: try again later"})
        }
    }
}
