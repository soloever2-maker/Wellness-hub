// Align with Enjy — Studio location (6th of October City, Giza)
export const STUDIO_LAT = 29.978662
export const STUDIO_LNG = 30.988026
export const CHECK_IN_RADIUS_METERS = 200
export const CHECK_IN_GRACE_MINUTES = 60 // stay check-in-able for 1h after class ends

/**
 * Haversine formula — distance in meters between two lat/lng points.
 */
export function distanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export type GeoCheckResult =
  | { ok: true; distance: number }
  | { ok: false; reason: 'denied' | 'unavailable' | 'too_far' | 'timeout'; distance?: number }

/**
 * Requests the browser's geolocation and checks if the user
 * is within CHECK_IN_RADIUS_METERS of the studio.
 */
export function checkStudioProximity(): Promise<GeoCheckResult> {
  return new Promise(resolve => {
    if (!navigator.geolocation) {
      resolve({ ok: false, reason: 'unavailable' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const distance = distanceInMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          STUDIO_LAT,
          STUDIO_LNG
        )
        if (distance <= CHECK_IN_RADIUS_METERS) {
          resolve({ ok: true, distance })
        } else {
          resolve({ ok: false, reason: 'too_far', distance })
        }
      },
      err => {
        resolve({ ok: false, reason: err.code === err.TIMEOUT ? 'timeout' : 'denied' })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}
