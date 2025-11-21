import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = params
    const supabase = supabaseServer()

    const { data: agency, error } = await supabase
      .from('agencies')
      .select(`
        *,
        state_departments (
          *,
          ministries (
            *
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: agency })
  } catch (error) {
    console.error('MDA Detail API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}