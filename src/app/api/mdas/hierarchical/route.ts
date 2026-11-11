import { NextResponse } from 'next/server'
import { requireAccess } from '@/lib/auth/permissions'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  const g = await requireAccess('mdas', 'view')
  if (g.error) return g.error
  try {
    const supabase = supabaseServer()

    // Fetch ministries with their state departments and agencies
    const { data: ministries, error: ministriesError } = await supabase
      .from('ministries')
      .select(`
        *,
        state_departments (
          *,
          agencies (*)
        )
      `)
      .order('name')

    if (ministriesError) {
      console.error('Supabase ministries error:', ministriesError)
      return NextResponse.json({ error: ministriesError.message }, { status: 400 })
    }

    // Calculate totals
    let totalAgencies = 0
    let totalDepartments = 0

    const ministriesWithData = ministries?.map(ministry => {
      const departments = ministry.state_departments || []
      totalDepartments += departments.length
      
      departments.forEach((dept: { agencies?: unknown[] }) => {
        totalAgencies += dept.agencies?.length || 0
      })

      return {
        ...ministry,
        state_departments: departments
      }
    }) || []

    const response = {
      ministries: ministriesWithData,
      totalAgencies,
      totalDepartments
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Hierarchical MDAs API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}