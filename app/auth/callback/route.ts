import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

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
