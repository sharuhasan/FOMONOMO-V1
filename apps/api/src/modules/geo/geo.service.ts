import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find activities within a given radius of a point.
   * Uses PostGIS ST_DWithin on the location_point geography column.
   */
  async findNearby(lat: number, lng: number, radiusKm: number) {
    const radiusMeters = radiusKm * 1000;
    return this.prisma.$queryRaw`
      SELECT id, title, category, location, lat, lng, scheduled_time, max_participants, is_active,
        ST_Distance(location_point, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) as distance_meters
      FROM activities
      WHERE is_active = true
        AND location_point IS NOT NULL
        AND ST_DWithin(
          location_point,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_meters ASC
    `;
  }
}
