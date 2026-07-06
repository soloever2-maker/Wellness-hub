// Align with Enjy — Studio location (6th of October City, Giza)
export const STUDIO_LAT = 29.978662
export const STUDIO_LNG = 30.988026
export const CHECK_IN_RADIUS_METERS = 200
export const CHECK_IN_GRACE_MINUTES = 60 // minimum grace after class ends

// Check-in opens at the START of the class day (midnight) — clients
// can check in any time during the day, even hours before class.
export function checkInWindowStart(startTime: string | number | Date): number {
  const start = new Date(startTime)
  const startOfDay = new Date(start)
  startOfDay.setHours(0, 0, 0, 0)
  return startOfDay.getTime()
}

// Check-in stays open until the END OF THE DAY the class ends
// (or CHECK_IN_GRACE_MINUTES after end if that's later — covers
// late-night classes that finish close to midnight).
export function checkInWindowEnd(endTime: string | number | Date): number {
  const end = new Date(endTime)
  const endOfDay = new Date(end)
  endOfDay.setHours(23, 59, 59, 999)
  return Math.max(
    end.getTime() + CHECK_IN_GRACE_MINUTES * 60 * 1000,
    endOfDay.getTime(),
  )
}

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
