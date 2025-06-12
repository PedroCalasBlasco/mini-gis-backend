import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getLayersByUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ownerId = parseInt(req.query.ownerId as string);

    if (isNaN(ownerId)) {
      res
        .status(400)
        .json({ error: "Invalid or missing userId in query parameters" });
      return;
    }

    const layers = await prisma.layer.findMany({
      where: {
        ownerId: ownerId,
      },
      include: {
        features: true,
        mapLayers: {
          include: {
            layer: true,
          },
        },
      },
    });

    res.status(200).json(layers);
  } catch (error) {
    console.error("❌ Error fetching layers:", error);
    res.status(500).json({ error: "Failed to fetch layers" });
  }
};

export const getLayersSharedWithUser = async (
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

    const layers = await prisma.layer.findMany({
      where: {
        ownerId: { not: userId },
        userLayers: {
          some: {
            userId: userId,
          },
        },
        isPublic: false,
      },
      include: {
        features: true,
        mapLayers: {
          include: {
            layer: true,
          },
        },
      },
    });

    res.status(200).json(layers);
  } catch (error) {
    console.error("❌ Error fetching layers:", error);
    res.status(500).json({ error: "Failed to fetch layers" });
  }
};

export const getPublicLayers = async (
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

    const layers = await prisma.layer.findMany({
      where: {
        isPublic: true,
        ownerId: { not: userId },
      },
      include: {
        features: true,
        mapLayers: {
          include: {
            layer: true,
          },
        },
      },
    });

    res.status(200).json(layers);
  } catch (error) {
    console.error("❌ Error fetching layers:", error);
    res.status(500).json({ error: "Failed to fetch layers" });
  }
};

export const getLayerById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const layerId = parseInt(req.params.layerId);

    if (isNaN(layerId)) {
      res.status(400).json({ error: "Invalid or missing layerId" });
      return;
    }

    const layer = await prisma.layer.findUnique({
      where: { id: layerId },
      include: {
        features: true,
        mapLayers: {
          include: {
            layer: true,
          },
        },
      },
    });

    if (!layer) {
      res.status(404).json({ error: "Layer not found" });
      return;
    }

    res.status(200).json(layer);
  } catch (error) {
    console.error("❌ Error fetching layer:", error);
    res.status(500).json({ error: "Failed to fetch layer" });
  }
};

export const createLayer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      description,
      geometryType,
      sourceUrl,
      ownerId,
      isPublic,
      featureSchema,
      metadata,
      crs,
      isVisible,
      opacity,
      style,
      layerType,
      userIds, // array de IDs de usuarios relacionados
    } = req.body;

    if (!name || !ownerId || !crs || !layerType) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // 1. Crear el layer
    const newLayer = await prisma.layer.create({
      data: {
        name,
        description,
        geometryType,
        sourceUrl,
        ownerId,
        isPublic: isPublic ?? true,
        featureSchema,
        metadata,
        crs,
        isVisible: isVisible ?? true,
        opacity: opacity ?? 1.0,
        style,
        layerType,
      },
    });

    // 2. Relacionar con los usuarios a través de UserLayer
    if (Array.isArray(userIds) && userIds.length > 0) {
      await prisma.userLayer.createMany({
        data: userIds.map((userId: number) => ({
          userId,
          layerId: newLayer.id,
        })),
        skipDuplicates: true, // evita error si ya existe la relación
      });
    }

    res.status(201).json(newLayer);
  } catch (error) {
    console.error("❌ Error creating layer:", error);
    res.status(500).json({ error: "Failed to create layer" });
  }
};

export const deleteLayer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const layerId = parseInt(req.params.layerId);

    if (isNaN(layerId)) {
      res.status(400).json({ error: "Invalid or missing layerId" });
      return;
    }

    // Verificamos si existe primero
    const existing = await prisma.layer.findUnique({ where: { id: layerId } });

    if (!existing) {
      res.status(404).json({ error: "Layer not found" });
      return;
    }

    await prisma.layer.delete({ where: { id: layerId } });

    res.status(200).json({ message: "Layer deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting layer:", error);
    res.status(500).json({ error: "Failed to delete layer" });
  }
};

export const updateLayer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const layerId = parseInt(req.params.layerId);

    if (isNaN(layerId)) {
      res.status(400).json({ error: "Invalid or missing layerId" });
      return;
    }

    const existing = await prisma.layer.findUnique({ where: { id: layerId } });

    if (!existing) {
      res.status(404).json({ error: "Layer not found" });
      return;
    }

    const {
      name,
      description,
      geometryType,
      sourceUrl,
      isPublic,
      featureSchema,
      metadata,
      crs,
      isVisible,
      opacity,
      style,
      layerType,
      userIds, // array de IDs de usuarios relacionados (opcional)
    } = req.body;

    // 1. Actualizar los datos del Layer
    const updatedLayer = await prisma.layer.update({
      where: { id: layerId },
      data: {
        name,
        description,
        geometryType,
        sourceUrl,
        isPublic,
        featureSchema,
        metadata,
        crs,
        isVisible,
        opacity,
        style,
        layerType,
      },
    });

    // 2. Actualizar relaciones UserLayer si se proporcionan userIds
    if (Array.isArray(userIds)) {
      // Eliminar relaciones anteriores
      await prisma.userLayer.deleteMany({
        where: {
          layerId,
        },
      });

      // Insertar nuevas relaciones
      if (userIds.length > 0) {
        await prisma.userLayer.createMany({
          data: userIds.map((userId: number) => ({
            userId,
            layerId,
          })),
        });
      }
    }

    res.status(200).json(updatedLayer);
  } catch (error) {
    console.error("❌ Error updating layer:", error);
    res.status(500).json({ error: "Failed to update layer" });
  }
};
