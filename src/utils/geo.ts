import { LocationCoords } from '../types';

// Haversine formula to compute distance in km
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Estimate ETA in minutes given distance in km and average speed in km/h (accounting for urban emergency traffic)
export function estimateEtaMinutes(distanceKm: number, averageSpeedKmh: number = 48): number {
  if (distanceKm <= 0.1) return 1;
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.ceil(hours * 60);
  return Math.max(1, minutes);
}

// Default fallback location (City Medical District)
export const DEFAULT_USER_LOCATION: LocationCoords = {
  lat: 37.7749,
  lng: -122.4194,
  accuracy: 12,
  address: '742 Market Street, San Francisco, CA 94103',
};

// Request real browser geolocation with permission handling
export async function getCurrentBrowserLocation(): Promise<LocationCoords> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_USER_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        // Attempt reverse geocoding via OpenStreetMap Nominatim
        let address = `Coordinates: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°W`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              address = data.display_name.split(',').slice(0, 3).join(', ');
            }
          }
        } catch {
          // Keep formatted coordinate fallback
        }

        resolve({
          lat,
          lng,
          accuracy,
          address,
        });
      },
      (error) => {
        console.warn('Geolocation access error or denied:', error.message);
        resolve(DEFAULT_USER_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000,
      }
    );
  });
}

// Interpolate step towards target coordinate for live movement simulation
export function stepTowards(
  current: { lat: number; lng: number },
  target: { lat: number; lng: number },
  factor: number = 0.15
): { lat: number; lng: number } {
  const newLat = current.lat + (target.lat - current.lat) * factor;
  const newLng = current.lng + (target.lng - current.lng) * factor;
  return { lat: newLat, lng: newLng };
}
