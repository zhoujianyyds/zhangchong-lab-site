import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const stateId = import.meta.env.VITE_SUPABASE_STATE_ID || 'main'

export const sharedStateEnabled = Boolean(supabaseUrl && supabaseAnonKey)

const supabase = sharedStateEnabled ? createClient(supabaseUrl, supabaseAnonKey) : null

export async function fetchSharedState() {
  if (!supabase) return { ok: false, data: null, message: 'Supabase is not configured' }

  const { data, error } = await supabase
    .from('lab_site_state')
    .select('data')
    .eq('id', stateId)
    .maybeSingle()

  if (error) return { ok: false, data: null, message: error.message }
  return { ok: true, data: data?.data || null }
}

export async function saveSharedState(data) {
  if (!supabase) return { ok: false, message: 'Supabase is not configured' }

  const { error } = await supabase.from('lab_site_state').upsert({
    id: stateId,
    data,
    updated_at: new Date().toISOString(),
  })

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}
