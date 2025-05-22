import { Request, Response } from 'express'
import prisma from "../models/layer"

export const getLayersByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.query.userId as string)

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid or missing userId in query parameters' })
      return
    }

    const layers = await prisma.findMany({
      where: {
        users: {
          some: {
            id: userId
          }
        }
      },
      include: {
        features: true,
        map: true
      }
    })

    res.status(200).json(layers)
  } catch (error) {
    console.error('❌ Error fetching layers:', error)
    res.status(500).json({ error: 'Failed to fetch layers' })
  }
}