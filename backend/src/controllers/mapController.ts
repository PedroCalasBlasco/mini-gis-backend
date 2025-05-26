import { Request, Response } from "express"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()


export const getMapsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.query.userId as string)

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid or missing userId in query parameters' })
      return
    }

    const maps = await prisma.map.findMany({
      where: {
        users: {
          some: {
            userId: userId
          }
        }
        
      },
      include: {
        mapLayers: {
          include: {
            layer: true
          }
        },
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

export const getMapByUserAndId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.query.userId as string)
    const mapId = parseInt(req.params.id)

    if (isNaN(userId) || isNaN(mapId)) {
      res.status(400).json({ error: 'Invalid or missing userId or mapId' })
      return
    }

    const map = await prisma.map.findFirst({
      where: {
        id: mapId,
        users: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        users: true,
        mapLayers: {
          include: {
            layer: true
          }
        },
        widgets: {
          include: {
            widget: true
          }
        },
        baseMap: true
      }
    })

    if (!map) {
      res.status(404).json({ error: 'Map not found for given user and id' })
      return
    }

    // 👉 Aquí transformamos los widgets
    const cleanMap = {
      ...map,
      widgets: map.widgets.map(w => w.widget)
    }

    res.status(200).json(cleanMap)
  } catch (error) {
    console.error('❌ Error fetching map by user and id:', error)
    res.status(500).json({ error: 'Failed to fetch map' })
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

    const newMap = await prisma.map.create({
      data: {
        name,
        description,
        centerLat,
        centerLng,
        zoom,
        bbox,
        isPublic,
        baseMap: baseMapId ? { connect: { id: baseMapId } } : undefined,
        users: {
          create: {
            user: { connect: { id: userId } },
            role,
          }
        },
        mapLayers: {
          create: layers.map((layer: { id: number }) => ({
            layer: { connect: { id: layer.id } }
          }))
        },
        widgets: {
          create: widgets.map((widget: { id: number }) => ({
            widget: { connect: { id: widget.id } }
          }))
        }
      },
      include: {
        users: true,
        mapLayers: {
          include: {
            layer: true
          }
        },
        widgets: {
          include: {
            widget: true
          }
        },
        baseMap: true
      }
    })

    response.status(201).json(newMap)
  } catch (error) {
    console.error('❌ Error creating map:', error)
    response.status(500).json({ error: 'Failed to create map' })
  }
}


export const deleteMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid map id" })
      return
    }

    const existingMap = await prisma.map.findUnique({ where: { id } })
    if (!existingMap) {
      res.status(404).json({ error: "Map not found" })
      return
    }

    await prisma.map.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error("❌ Error deleting map:", error)
    res.status(500).json({ error: "Failed to delete map" })
  }
}


export const updateMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid map id" })
      return
    }

    const {
      name,
      description,
      centerLat,
      centerLng,
      zoom,
      bbox,
      baseMapId,
      isPublic,
      layers = [],
      widgets = []
    } = req.body

    const existingMap = await prisma.map.findUnique({ where: { id } })
    if (!existingMap) {
      res.status(404).json({ error: "Map not found" })
      return
    }

    // Actualización principal con eliminación de relaciones previas
    const updatedMap = await prisma.map.update({
      where: { id },
      data: {
        name,
        description,
        centerLat,
        centerLng,
        zoom,
        bbox,
        isPublic,
        baseMap: baseMapId ? { connect: { id: baseMapId } } : undefined,

        // Eliminar relaciones anteriores antes de crear nuevas
        mapLayers: {
          deleteMany: {},
          create: layers.map((layer: { id: number }) => ({
            layer: { connect: { id: layer.id } }
          }))
        },
        widgets: {
          deleteMany: {},
          create: widgets.map((widget: { id: number }) => ({
            widget: { connect: { id: widget.id } }
          }))
        }
      },
      include: {
        users: true,
        mapLayers: {
          include: { layer: true }
        },
        widgets: {
          include: { widget: true }
        },
        baseMap: true
      }
    })

    res.status(200).json(updatedMap)
  } catch (error) {
    console.error("❌ Error updating map:", error)
    res.status(500).json({ error: "Failed to update map" })
  }
}