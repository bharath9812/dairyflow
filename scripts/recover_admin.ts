import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Parse .env.local manually
const envContent = readFileSync('.env.local', 'utf-8')
const envVars: Record<string, string> = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx > 0) {
    envVars[trimmed.substring(0, eqIdx)] = trimmed.substring(eqIdx + 1)
  }
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing supabase URL or service key")
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function recoverAdmin() {
  console.log("Fetching users...")
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
  
  if (error) {
    console.error("Error fetching users:", error)
    return
  }

  const targetEmail = "bharathreddy.mandadhi@gmail.com"
  const targetUser = users.find(u => u.email === targetEmail)

  if (!targetUser) {
    console.log(`User ${targetEmail} not found. Available users:`, users.map(u => u.email))
    return
  }

  console.log(`Found user ${targetEmail} (ID: ${targetUser.id}). Current role:`, targetUser.user_metadata?.role)

  // Demote any existing primary admins
  for (const u of users) {
    if (u.user_metadata?.role === 'primary' && u.id !== targetUser.id) {
      console.log(`Demoting current primary admin: ${u.email}`)
      await supabaseAdmin.auth.admin.updateUserById(u.id, {
        user_metadata: { ...u.user_metadata, role: 'secondary' }
      })
    }
  }

  // Promote target user to primary
  console.log(`Promoting ${targetEmail} to primary admin...`)
  const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
    user_metadata: { ...targetUser.user_metadata, role: 'primary' }
  })

  if (updateError) {
    console.error("Failed to promote user:", updateError)
  } else {
    console.log("Successfully promoted user to primary admin:", data.user.email)
  }
}

recoverAdmin()
