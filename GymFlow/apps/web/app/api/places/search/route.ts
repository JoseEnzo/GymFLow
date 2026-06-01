import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { limiters } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { success } = await limiters.api.limit(user.id)
  if (!success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query || query.length > 100) {
    return NextResponse.json({ error: 'Query obrigatória (máx. 100 chars)' }, { status: 400 })
  }

  const apiKey = process.env['GOOGLE_PLACES_API_KEY']
  if (!apiKey) {
    return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('type', 'gym')
  url.searchParams.set('language', 'pt-BR')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) {
    return NextResponse.json({ error: 'Falha na API do Google Places' }, { status: 502 })
  }

  const json = await res.json()

  const results = (json.results ?? []).slice(0, 5).map((place: Record<string, unknown>) => ({
    placeId: place['place_id'],
    name: place['name'],
    formattedAddress: place['formatted_address'],
    rating: place['rating'] ?? null,
    geometry: place['geometry']
      ? {
          lat: (place['geometry'] as { location: { lat: number; lng: number } }).location.lat,
          lng: (place['geometry'] as { location: { lat: number; lng: number } }).location.lng,
        }
      : null,
  }))

  return NextResponse.json(results)
}
