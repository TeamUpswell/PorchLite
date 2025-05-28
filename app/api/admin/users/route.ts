import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase with admin privileges using environment variables
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user roles from your roles table
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*')

    if (rolesError) {
      return NextResponse.json({ error: rolesError.message }, { status: 500 })
    }

    // Combine user data with roles
    const usersWithRoles = data.users.map(user => {
      const userRoles = rolesData
        .filter(role => role.user_id === user.id)
        .map(role => role.role)

      return {
        ...user,
        roles: userRoles
      }
    })

    return NextResponse.json({ users: usersWithRoles })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// Add POST endpoint to manage user roles
export async function POST(request: Request) {
  try {
    const { userId, role, action } = await request.json()
    
    if (!userId || !role || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (action === 'add') {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role,
          assigned_at: new Date().toISOString() 
        })
        
      if (error) throw error
    } else if (action === 'remove') {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .match({ user_id: userId, role })
        
      if (error) throw error
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error managing user role:', error)
    return NextResponse.json(
      { error: 'Failed to manage user role' },
      { status: 500 }
    )
  }
}