import { Request, Response } from "express"
import prisma from "../models/map"



export const getMapsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.query.userId as string)

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid or missing userId in query parameters' })
      return
    }

    const maps = await prisma.findMany({
      where: {
        users: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        layers: true,
        widgets: {
          include: {
            widget: true
          }
        },
        baseMap: true
      }
    })

    res.status(200).json(maps)
  } catch (error) {
    console.error('❌ Error fetching maps:', error)
    res.status(500).json({ error: 'Failed to fetch maps' })
  }
}


export const createMap = async (request: Request, response: Response): Promise<void> => {
    try {
      const {
        name,
        description,
        centerLat,
        centerLng,
        zoom,
        bbox,
        baseMapId,
        isPublic = false,
        userId,
        role = 'owner',
        layers = [],
        widgets = []
      } = request.body
  
      if (!name) {
        response.status(400).json({ error: 'Name is required' })
        return 
      }

      if (!userId) {
        response.status(400).json({ error: 'userId is required' })
        return
      }

  
      const newMap = await prisma.create({
        data: {
          name,
          description,
          centerLat,
          centerLng,
          zoom,
          bbox,
          isPublic,
          baseMap: baseMapId ? { connect: { id: baseMapId } } : undefined,
  
          // Relación obligatoria con el usuario creador
          users: {
            create: {
              user: { connect: { id: userId } },
              role,
            },
          },
  
          // Capas opcionales
          layers: {
            create: layers.map((layer: { name: string }) => ({
              name: layer.name,
              users: {
                connect: { id: userId }, // el creador es dueño también de las capas
              },
            })),
          },
  
          // Widgets opcionales
          widgets: {
            create: widgets.map((widget: { widgetId: number }) => ({
              widget: { connect: { id: widget.widgetId } },
            })),
          },
        },
        include: {
          users: true,
          layers: true,
          widgets: {
            include: {
              widget: true,
            },
          },
          baseMap: true,
        },
      })
  
      response.status(201).json(newMap)
    } catch (error) {
      console.error('❌ Error creating map:', error)
      response.status(500).json({ error: 'Failed to create map' })
    }
  }