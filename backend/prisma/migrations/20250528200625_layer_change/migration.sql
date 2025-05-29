-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "color" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Map" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "centerLat" DOUBLE PRECISION,
    "centerLng" DOUBLE PRECISION,
    "zoom" INTEGER,
    "bbox" JSONB,
    "baseMapId" INTEGER,

    CONSTRAINT "Map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseMap" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,

    CONSTRAINT "BaseMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapUser" (
    "userId" INTEGER NOT NULL,
    "mapId" INTEGER NOT NULL,
    "role" TEXT,

    CONSTRAINT "MapUser_pkey" PRIMARY KEY ("userId","mapId")
);

-- CreateTable
CREATE TABLE "Widget" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "config" JSONB,

    CONSTRAINT "Widget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapWidget" (
    "mapId" INTEGER NOT NULL,
    "widgetId" INTEGER NOT NULL,

    CONSTRAINT "MapWidget_pkey" PRIMARY KEY ("mapId","widgetId")
);

-- CreateTable
CREATE TABLE "Layer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "geometryType" TEXT,
    "sourceUrl" TEXT,
    "ownerId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "featureSchema" JSONB,
    "metadata" JSONB,
    "crs" JSONB NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "style" JSONB,
    "layerType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Layer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapLayer" (
    "mapId" INTEGER NOT NULL,
    "layerId" INTEGER NOT NULL,

    CONSTRAINT "MapLayer_pkey" PRIMARY KEY ("mapId","layerId")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "type" TEXT NOT NULL,
    "layerId" INTEGER NOT NULL,
    "geometry" geometry NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserLayers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserLayers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "_UserLayers_B_index" ON "_UserLayers"("B");

-- AddForeignKey
ALTER TABLE "Map" ADD CONSTRAINT "Map_baseMapId_fkey" FOREIGN KEY ("baseMapId") REFERENCES "BaseMap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapUser" ADD CONSTRAINT "MapUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapUser" ADD CONSTRAINT "MapUser_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapWidget" ADD CONSTRAINT "MapWidget_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapWidget" ADD CONSTRAINT "MapWidget_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "Widget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapLayer" ADD CONSTRAINT "MapLayer_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapLayer" ADD CONSTRAINT "MapLayer_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "Layer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "Layer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserLayers" ADD CONSTRAINT "_UserLayers_A_fkey" FOREIGN KEY ("A") REFERENCES "Layer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserLayers" ADD CONSTRAINT "_UserLayers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
