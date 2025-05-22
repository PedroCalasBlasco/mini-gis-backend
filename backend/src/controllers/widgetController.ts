import { Request, Response } from 'express'
import prisma from "../models/widget"

export const getAllWidgets = async (req: Request, res: Response): Promise<void> => {
  try {
    const widgets = await prisma.findMany()

    res.status(200).json(widgets)
  } catch (error) {
    console.error('❌ Error fetching widgets:', error)
    res.status(500).json({ error: 'Failed to fetch widgets' })
  }
}