import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const targetEmail = 'bharathreddy.mandadhi@gmail.com'

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const target = users.find(u => u.email === targetEmail)
  if (!target) {
    return NextResponse.json({ error: `User ${targetEmail} not found`, available: users.map(u => u.email) }, { status: 404 })
  }

  const results: string[] = []

  // Demote all other primary admins
  for (const u of users) {
    if (u.user_metadata?.role === 'primary' && u.id !== target.id) {
      await supabaseAdmin.auth.admin.updateUserById(u.id, {
        user_metadata: { ...u.user_metadata, role: 'secondary' }
      })
      results.push(`Demoted ${u.email} from primary to secondary`)
    }
  }

  // Promote the target
  await supabaseAdmin.auth.admin.updateUserById(target.id, {
    user_metadata: { ...target.user_metadata, role: 'primary' }
  })
  results.push(`Promoted ${targetEmail} to primary admin`)

  return NextResponse.json({
    success: true,
    results,
    message: 'Recovery complete! Log out and log back in for changes to take effect.'
  })
}
