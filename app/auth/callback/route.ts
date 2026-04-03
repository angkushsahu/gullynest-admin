import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Prefer the configured app URL over request.url origin — behind a reverse proxy
  // request.url may resolve to the internal host (e.g. localhost:3000) instead of
  // the public-facing domain.
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? requestOrigin

  if (code) {
    try {
      const supabase = await createSupabaseServerClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) return NextResponse.redirect(`${origin}${next}`)
    } catch {
      return NextResponse.json({ error: 'Unable to create auth callback' }, { status: 500 })
    }
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`)
}
