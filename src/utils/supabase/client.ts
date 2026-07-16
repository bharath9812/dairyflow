import { createBrowserClient } from '@supabase/ssr'

let client: any = null

// Safe interceptor for Supabase Web Lock contention in multi-tab local development / production.
// Prevents unhandled promise rejection crashes when browser tabs sleep/wake or reload.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message?.includes('lock:sb-') || 
      event.reason?.message?.includes('Lock "lock:')
    ) {
      event.preventDefault();
      console.warn('Supabase Web Lock contention intercepted and resolved silently:', event.reason.message);
    }
  });
}

export function createClient() {
  if (typeof window !== 'undefined') {
    if (!client) {
      client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    return client
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
