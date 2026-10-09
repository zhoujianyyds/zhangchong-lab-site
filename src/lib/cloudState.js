import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const stateId = import.meta.env.VITE_SUPABASE_STATE_ID || 'main'
const localPreviewOnly = import.meta.env.DEV && import.meta.env.VITE_LOCAL_PREVIEW_ONLY === 'true'
const REQUEST_TIMEOUT_MS = 20000

export const sharedStateEnabled = Boolean(supabaseUrl && supabaseAnonKey && !localPreviewOnly)

const supabase = sharedStateEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (input, init = {}) => {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
          init.signal?.addEventListener('abort', () => controller.abort(), { once: true })
          return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout))
        },
      },
    })
  : null

export async function fetchSharedState() {
  if (!supabase) return { ok: false, data: null, message: 'Supabase is not configured' }

  const { data, error } = await supabase
    .from('lab_site_state')
    .select('data, updated_at')
    .eq('id', stateId)
    .maybeSingle()

  if (error) return { ok: false, data: null, message: describeCloudError(error) }
  return { ok: true, data: data?.data || null, updatedAt: data?.updated_at || '' }
}

export async function saveSharedState(data) {
  if (!supabase) return { ok: false, message: 'Supabase is not configured' }

  const updatedAt = new Date().toISOString()
  const { error } = await supabase.from('lab_site_state').upsert({
    id: stateId,
    data,
    updated_at: updatedAt,
  })

  if (error) return { ok: false, message: describeCloudError(error) }
  return { ok: true, updatedAt }
}

function describeCloudError(error) {
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError' || /timeout|aborted/i.test(error?.message || '')) {
    return '连接云端超时（20 秒）。请检查手机网络、VPN 或 DNS 后重试。'
  }
  if (error instanceof TypeError || /failed to fetch|networkerror|network request failed/i.test(error?.message || '')) {
    return '手机无法连接云端服务。请检查网络、VPN 或 DNS 后重试。'
  }
  return error?.message || '云端服务暂时不可用'
}
