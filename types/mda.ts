export interface Ministry {
  id: number
  name: string
  acronym: string | null
  cluster_id: number | null
  cabinet_secretary: number | null
  headquarters: string | null
  website: string | null
  email: string | null
  phone: string | null
  status: string | null
  created_at: string
  updated_at: string
}

export interface StateDepartment {
  id: number
  ministry_id: number | null
  name: string
  principal_secretary: string | null
  location: string | null
  website: string | null
  email: string | null
  phone: string | null
  status: string | null
  created_at: string
  updated_at: string
  ps: string | null
  // No acronym field!
  ministries?: Ministry
}

export interface Agency {
  id: number
  state_department_id: number | null
  name: string
  director_general: string | null
  chairperson: string | null
  acronym: string | null
  location: string | null
  website: string | null
  email: string | null
  phone: string | null
  status_id: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  state_departments?: StateDepartment
}

export type MDAType = 'ministry' | 'department' | 'agency'
export type MDAEntity = Ministry | StateDepartment | Agency

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface MDAResponse {
  data: MDAEntity[]
  pagination: Pagination
  error?: string
}

export interface MinistryWithDepartments extends Ministry {
  state_departments?: StateDepartmentWithAgencies[]
}

export interface StateDepartmentWithAgencies extends StateDepartment {
  agencies?: Agency[]
}

export interface HierarchicalData {
  ministries: MinistryWithDepartments[]
  totalAgencies: number
  totalDepartments: number
}