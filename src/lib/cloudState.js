import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const stateId = import.meta.env.VITE_SUPABASE_STATE_ID || 'main'
const localPreviewOnly = import.meta.env.DEV && import.meta.env.VITE_LOCAL_PREVIEW_ONLY === 'true'
const VERSION_READ_TIMEOUT_MS = 8000
const DATA_READ_TIMEOUT_MS = 20000
const WRITE_TIMEOUT_MS = 20000

export const sharedStateEnabled = Boolean(supabaseUrl && supabaseAnonKey && !localPreviewOnly)

const supabase = sharedStateEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (input, init = {}) => {
          const controller = new AbortController()
          const method = String(init.method || 'GET').toUpperCase()
          let isVersionRead = false
          try {
            const requestUrl = new URL(typeof input === 'string' ? input : input.url)
            isVersionRead = requestUrl.searchParams.get('select') === 'updated_at'
          } catch {
            // Fall back to the safer full request timeout for unusual fetch inputs.
          }
          const timeoutMs = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
            ? WRITE_TIMEOUT_MS
            : isVersionRead ? VERSION_READ_TIMEOUT_MS : DATA_READ_TIMEOUT_MS
          const timeout = setTimeout(() => controller.abort(), timeoutMs)
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

  if (error) return { ok: false, data: null, ...cloudErrorDetails(error) }
  return { ok: true, data: data?.data || null, updatedAt: data?.updated_at || '' }
}

export async function fetchSharedStateVersion() {
  if (!supabase) return { ok: false, updatedAt: '', message: 'Supabase is not configured', retryable: false }

  const { data, error } = await supabase
    .from('lab_site_state')
    .select('updated_at')
    .eq('id', stateId)
    .maybeSingle()

  if (error) return { ok: false, updatedAt: '', ...cloudErrorDetails(error) }
  return { ok: true, updatedAt: data?.updated_at || '' }
}

export async function saveSharedState(data) {
  if (!supabase) return { ok: false, message: 'Supabase is not configured' }

  const updatedAt = new Date().toISOString()
  const { error } = await supabase.from('lab_site_state').upsert({
    id: stateId,
    data,
    updated_at: updatedAt,
  })

  if (error) return { ok: false, ...cloudErrorDetails(error) }
  return { ok: true, updatedAt }
}

function cloudErrorDetails(error) {
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError' || /timeout|aborted/i.test(error?.message || '')) {
    return { message: '连接云端超时。请检查网络、VPN 或 DNS 后重试。', retryable: true }
  }
  if (error instanceof TypeError || /failed to fetch|networkerror|network request failed/i.test(error?.message || '')) {
    return { message: '无法连接云端服务。请检查网络、VPN 或 DNS 后重试。', retryable: true }
  }
  const status = Number(error?.status || error?.statusCode)
  const retryable = status === 408 || status === 429 || status >= 500
  return { message: error?.message || '云端服务暂时不可用', retryable }
}
