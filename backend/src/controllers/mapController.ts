import { Request, Response } from "express";
import { Feature } from '@prisma/client'

import { PrismaClient, Prisma  } from "@prisma/client";

const prisma = new PrismaClient();

export const getMapsByUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.query.userId as string);

    if (isNaN(userId)) {
      res
        .status(400)
        .json({ error: "Invalid or missing userId in query parameters" });
      return;
    }

    const maps = await prisma.map.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        mapLayers: {
          include: {
            layer: true,
          },
        },
        widgets: {
          include: {
            widget: true,
          },
        },
        baseMap: true,
      },
    });

    res.status(200).json(maps);
  } catch (error) {
    console.error("❌ Error fetching maps:", error);
    res.status(500).json({ error: "Failed to fetch maps" });
  }
};

export const getMapsSharedWithUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.query.userId as string);

    if (isNaN(userId)) {
      res
        .status(400)
        .json({ error: "Invalid or missing userId in query parameters" });
      return;
    }

    const maps = await prisma.map.findMany({
      where: {
        ownerId: { not: userId },
        users: {
          some: { userId },
        },
        isPublic: false,
      },
      include: {
        mapLayers: {
          include: {
            layer: true,
          },
        },
        widgets: {
          include: {
            widget: true,
          },
        },
        baseMap: true,
      },
    });

    res.status(200).json(maps);
  } catch (error) {
    console.error("❌ Error fetching maps:", error);
    res.status(500).json({ error: "Failed to fetch maps" });
  }
};

export const getMapByUserAndId = async (
  req: Request,
  res: Response
): Promise<void> => {
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
            userId,
          },
        },
      },
      include: {
        users: true,
        mapLayers: {
          include: {
            layer: true,
          },
        },
        widgets: {
          include: {
            widget: true,
          },
        },
        baseMap: true,
      },
    })

    if (!map) {
      res.status(404).json({ error: 'Map not found for given user and id' })
      return
    }

    const layerIds = map.mapLayers.map((ml) => ml.layerId)

    // Si no hay capas, devolver directamente el mapa sin features
    if (layerIds.length === 0) {
      const cleanMap = {
        ...map,
        widgets: map.widgets.map((w) => w.widget),
        mapLayers: map.mapLayers.map((ml) => ({
          ...ml,
          layer: {
            ...ml.layer,
            features: [],
          },
        })),
      }

      res.status(200).json(cleanMap)
      return
    }

    const features = await prisma.$queryRaw<
      Array<{
        id: number
        name: string | null
        type: string
        layerId: number
        geometry: any
        properties: any
        createdAt: Date
        updatedAt: Date
      }>
    >(
      Prisma.sql`
        SELECT 
          id,
          name,
          type,
          "layerId",
          ST_AsGeoJSON(geometry)::json AS geometry,
          properties,
          "createdAt",
          "updatedAt"
        FROM "Feature"
        WHERE "layerId" IN (${Prisma.join(layerIds)})
      `
    )

    const featuresByLayerId: Record<number, typeof features> = {}
    for (const feature of features) {
      if (!featuresByLayerId[feature.layerId]) {
        featuresByLayerId[feature.layerId] = []
      }
      featuresByLayerId[feature.layerId].push(feature)
    }

    const cleanMap = {
      ...map,
      widgets: map.widgets.map((w) => w.widget),
      mapLayers: map.mapLayers.map((ml) => ({
        ...ml,
        layer: {
          ...ml.layer,
          features: featuresByLayerId[ml.layerId] || [],
        },
      })),
    }

    res.status(200).json(cleanMap)
  } catch (error) {
    console.error('❌ Error fetching map by user and id:', error)
    res.status(500).json({ error: 'Failed to fetch map' })
  }
}


export const getPublicMaps = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = parseInt(req.query.userId as string);

  if (isNaN(userId)) {
    res
      .status(400)
      .json({ error: "Invalid or missing userId in query parameters" });
    return;
  }

  try {
    const maps = await prisma.map.findMany({
      where: {
        isPublic: true,
        ownerId: { not: userId },
      },
      include: {
        users: true,
        mapLayers: {
          include: {
            layer: true,
          },
        },
        widgets: {
          include: {
            widget: true,
          },
        },
        baseMap: true,
      },
    });

    res.status(200).json(maps);
  } catch (error) {
    console.error("❌ Error fetching public maps:", error);
    res.status(500).json({ error: "Failed to fetch public maps" });
  }
};

export const createMap = async (
  request: Request,
  response: Response
): Promise<void> => {
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
      role = "owner",
      layers = [],
      widgets = [],
    } = request.body;

    if (!name) {
      response.status(400).json({ error: "Name is required" });
      return;
    }

    if (!userId) {
      response.status(400).json({ error: "userId is required" });
      return;
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
        owner: { connect: { id: userId } },
        users: {
          create: {
            user: { connect: { id: userId } },
            role,
          },
        },
        mapLayers: {
          create: layers.map((layer: { id: number }) => ({
            layer: { connect: { id: layer.id } },
          })),
        },
        widgets: {
          create: widgets.map((widget: { id: number }) => ({
            widget: { connect: { id: widget.id } },
          })),
        },
      },
      include: {
        users: true,
        mapLayers: {
          include: {
            layer: true,
          },
        },
        widgets: {
          include: {
            widget: true,
          },
        },
        baseMap: true,
      },
    });


    console.log("PPP",newMap)

    response.status(201).json(newMap);
  } catch (error) {
    console.error("❌ Error creating map:", error);
    response.status(500).json({ error: "Failed to create map" });
  }
};

export const deleteMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid map id" });
      return;
    }

    const existingMap = await prisma.map.findUnique({ where: { id } });
    if (!existingMap) {
      res.status(404).json({ error: "Map not found" });
      return;
    }

    await prisma.map.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("❌ Error deleting map:", error);
    res.status(500).json({ error: "Failed to delete map" });
  }
};

export const updateMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid map id" });
      return;
    }

    const {
      name,
      description,
      centerLat: rawCenterLat,
      centerLng: rawCenterLng,
      zoom: rawZoom,
      bbox,
      baseMapId: rawBaseMapId,
      isPublic,
      layers = [],
      widgets = [],
    } = req.body;

    const centerLat = parseFloat(rawCenterLat);
    const centerLng = parseFloat(rawCenterLng);
    const zoom = parseInt(rawZoom);
    const baseMapId = rawBaseMapId ? parseInt(rawBaseMapId) : undefined;

    if (isNaN(centerLat) || isNaN(centerLng)) {
      res.status(400).json({ error: "Invalid centerLat or centerLng" });
      return;
    }

    if (isNaN(zoom)) {
      res.status(400).json({ error: "Invalid zoom value" });
      return;
    }

    if (baseMapId !== undefined && isNaN(baseMapId)) {
      res.status(400).json({ error: "Invalid baseMapId" });
      return;
    }

    if (!bbox || typeof bbox !== "object" ||
        ["minLat", "minLng", "maxLat", "maxLng"].some(k => typeof bbox[k] !== "number")) {
      res.status(400).json({ error: "Invalid bbox" });
      return;
    }

    const existingMap = await prisma.map.findUnique({ where: { id } });
    if (!existingMap) {
      res.status(404).json({ error: "Map not found" });
      return;
    }

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
        mapLayers: {
          deleteMany: {},
          create: Array.isArray(layers)
            ? layers.map((layer: { id: number }) => ({
                layer: { connect: { id: layer.id } },
              }))
            : [],
        },
        widgets: {
          deleteMany: {},
          create: Array.isArray(widgets)
            ? widgets.map((widget: { id: number }) => ({
                widget: { connect: { id: widget.id } },
              }))
            : [],
        },
      },
      include: {
        users: true,
        mapLayers: {
          include: { layer: true },
        },
        widgets: {
          include: { widget: true },
        },
        baseMap: true,
      },
    });

    res.status(200).json(updatedMap);
  } catch (error) {
    console.error("❌ Error updating map:", error);
    res.status(500).json({ error: "Failed to update map" });
  }
};

