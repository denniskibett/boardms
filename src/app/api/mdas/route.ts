import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { MDAType, MDAResponse } from '@/types/mda'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') as MDAType | null
    const search = searchParams.get('search')

    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = supabaseServer()

    let query
    let countQuery

    if (type === 'ministry') {
      query = supabase.from('ministries').select('*')
      countQuery = supabase.from('ministries').select('*', { count: 'exact', head: true })
      
      // Apply search filter for ministries
      if (search) {
        query = query.or(`name.ilike.%${search}%,acronym.ilike.%${search}%`)
        countQuery = countQuery.or(`name.ilike.%${search}%,acronym.ilike.%${search}%`)
      }
    } else if (type === 'department') {
      query = supabase
        .from('state_departments')
        .select(`
          *,
          ministries (
            id,
            name,
            acronym
          )
        `)
      countQuery = supabase
        .from('state_departments')
        .select('*', { count: 'exact', head: true })
      
      // Apply search filter for departments (only name, no acronym)
      if (search) {
        query = query.ilike('name', `%${search}%`)
        countQuery = countQuery.ilike('name', `%${search}%`)
      }
    } else {
      // Default to agencies
      query = supabase
        .from('agencies')
        .select(`
          *,
          state_departments (
            id,
            name,
            ministry_id,
            ministries (
              id,
              name,
              acronym
            )
          )
        `)
      countQuery = supabase.from('agencies').select('*', { count: 'exact', head: true })
      
      // Apply search filter for agencies
      if (search) {
        query = query.or(`name.ilike.%${search}%,acronym.ilike.%${search}%`)
        countQuery = countQuery.or(`name.ilike.%${search}%,acronym.ilike.%${search}%`)
      }
    }

    // Apply pagination
    query = query.range(from, to)

    // Execute queries
    const [dataResult, countResult] = await Promise.all([
      query,
      countQuery
    ])

    if (dataResult.error) {
      console.error('Supabase query error:', dataResult.error)
      return NextResponse.json({ error: dataResult.error.message }, { status: 400 })
    }

    const count = countResult.count || 0

    const response: MDAResponse = {
      data: dataResult.data || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('MDAs API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}