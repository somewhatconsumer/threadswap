export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

// Simple address lookup using OpenStreetMap Nominatim.
// For higher traffic you should proxy this through your own backend
// and follow Nominatim's usage policy.
export async function suggestAddresses(query: string, limit = 5): Promise<GeocodeResult[]> {
  const q = query.trim()
  if (!q) return []

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('q', q)

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error('Failed to look up address')
  }

  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name?: string }>
  if (!Array.isArray(data) || data.length === 0) {
    return []
  }

  return data
    .map((row) => {
      const lat = Number.parseFloat(row.lat)
      const lng = Number.parseFloat(row.lon)
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return null
      }
      return {
        lat,
        lng,
        displayName: row.display_name ?? q,
      } as GeocodeResult
    })
    .filter((v): v is GeocodeResult => v !== null)
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const [first] = await suggestAddresses(query, 1)
  return first ?? null
}

