import { Request, Response } from 'express'
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const getCRS = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string)?.toLowerCase() || ''

    // Detectar si query es solo números (un código EPSG)
    const epsgCode = /^\d+$/.test(query) ? parseInt(query, 10) : null
    
    let crsList
    
    if (epsgCode) {
      // Buscar exacto por código EPSG o también aplicar filtro LIKE
      crsList = await prisma.$queryRawUnsafe<any[]>(`
        SELECT srid, auth_name, auth_srid, srtext, proj4text
        FROM spatial_ref_sys
        WHERE auth_srid = $1
        ORDER BY auth_srid
        LIMIT 50
      `, epsgCode)
    } else {
      crsList = await prisma.$queryRawUnsafe<any[]>(`
        SELECT srid, auth_name, auth_srid, srtext, proj4text
        FROM spatial_ref_sys
        WHERE LOWER(auth_name || ':' || auth_srid || ' ' || srtext) LIKE '%' || $1 || '%'
        ORDER BY auth_srid
        LIMIT 50
      `, query)
    }

    const formatted = crsList.map(crs => {
        const match = crs.srtext.match(/DATUM\["([^"]+)"/)
        const datumName = match ? match[1] : crs.srtext
      
        return {
          code: String(crs.auth_srid),
          name: datumName,
          label: `${crs.auth_name}: ${crs.auth_srid} - ${datumName}`,
        }
    })

    res.json(formatted)
  } catch (error) {
    console.error('Error fetching CRS from PostGIS:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}