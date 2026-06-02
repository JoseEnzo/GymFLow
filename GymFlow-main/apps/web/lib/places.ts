export interface PlaceDetails {
  placeId: string
  name: string
  formattedAddress: string
  photos: string[]
  rating: number | null
  openingHours: { periods?: unknown[]; weekdayText?: string[] } | null
  phoneNumber: string | null
  website: string | null
  geometry: { lat: number; lng: number } | null
}

export async function searchPlaces(query: string, location?: string): Promise<PlaceDetails[]> {
  const params = new URLSearchParams({
    query,
    ...(location ? { location } : {}),
  })

  const res = await fetch(`/api/places/search?${params}`)
  if (!res.ok) throw new Error('Falha na busca de locais')
  return res.json()
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const res = await fetch(`/api/places/details?placeId=${placeId}`)
  if (!res.ok) throw new Error('Falha ao buscar detalhes do local')
  return res.json()
}

export function getPhotoUrl(photoReference: string, maxWidth = 800): string {
  return `/api/places/photo?reference=${photoReference}&maxWidth=${maxWidth}`
}
