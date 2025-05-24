import { Request, Response } from 'express'
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET /basemaps
export const getAllBaseMaps = async (req: Request, res: Response) => {
  try {
    const baseMaps = await prisma.baseMap.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        thumbnailUrl: true,
      },
    })

    res.status(200).json(baseMaps)
  } catch (error) {
    console.error('Error fetching base maps:', error)
    res.status(500).json({ message: 'Error al obtener los mapas base' })
  }
}