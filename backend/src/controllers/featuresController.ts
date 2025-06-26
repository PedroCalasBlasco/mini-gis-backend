import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { validateFeatureProperties } from "../utils/validateFeatureProperties";

const prisma = new PrismaClient();

export const getFeaturesByLayerId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const layerId = parseInt(req.query.layerId as string, 10);

  if (isNaN(layerId)) {
    res.status(400).json({ error: "Invalid layerId" });
    return;
  }

  try {
    const features = await prisma.$queryRawUnsafe<any[]>(
      `
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
      WHERE "layerId" = $1
      `,
      layerId
    );

    // 🔁 Convertimos properties de objeto plano a array
    const transformedFeatures = features.map((feature) => {
      const propsObj = feature.properties || {};
      const propArray = Object.entries(propsObj).map(([key, value]) => ({
        name: key,
        value: value,
        type: typeof value,
      }));

      return {
        ...feature,
        properties: propArray,
      };
    });

    res.status(200).json(transformedFeatures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createFeatures = async (
  req: Request,
  res: Response
): Promise<void> => {
  const features = req.body;

  if (!Array.isArray(features)) {
    res.status(400).json({ error: "Invalid input: expected an array of features" });
    return;
  }

  // ⚠️ Si está vacío, necesitamos al menos el layerId para saber qué borrar
  const layerId = features.length > 0
    ? parseInt(features[0].layerId, 10)
    : parseInt(req.query.layerId as string, 10); // permite mandarlo como query param si se desea

  if (isNaN(layerId)) {
    res.status(400).json({ error: "Missing or invalid layerId" });
    return;
  }

  try {
    const layer = await prisma.layer.findUnique({
      where: { id: layerId },
    });

    if (!layer) {
      res.status(404).json({ error: `Layer with ID ${layerId} not found` });
      return;
    }

    // 🔥 Siempre borramos los features anteriores
    await prisma.$executeRawUnsafe(
      `DELETE FROM "Feature" WHERE "layerId" = $1`,
      layerId
    );

    // 🚫 Si el array está vacío, ya hemos terminado
    if (features.length === 0) {
      res.status(200).json({ message: "All features deleted successfully" });
      return;
    }

    const schema = layer.featureSchema as any;
    const now = new Date();

    for (const feature of features) {
      const { type, geometry, properties } = feature;

      const flatProperties = Array.isArray(properties)
        ? properties.reduce((acc, prop) => {
            acc[prop.name] = prop.value;
            return acc;
          }, {} as Record<string, any>)
        : properties;

      if (schema) {
        const { valid, errors } = validateFeatureProperties(schema, flatProperties);
        if (!valid) {
          res.status(400).json({
            error: "Invalid properties for feature",
            details: errors,
          });
          return;
        }
      }

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "Feature" (type, "layerId", geometry, properties, "createdAt", "updatedAt")
        VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4::jsonb, $5, $6)
        `,
        type,
        layerId,
        JSON.stringify(geometry),
        JSON.stringify(flatProperties),
        now,
        now
      );
    }

    res.status(201).json({ message: "Features replaced successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
