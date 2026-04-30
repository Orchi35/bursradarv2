type SupabaseMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 12000;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getRestUrl(table: string, query = '') {
  if (!SUPABASE_URL) throw new Error('EXPO_PUBLIC_SUPABASE_URL is missing.');
  const suffix = query ? `?${query}` : '';
  return `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}${suffix}`;
}

async function request<T>(table: string, method: SupabaseMethod, body?: unknown, query = ''): Promise<T> {
  if (!SUPABASE_ANON_KEY) throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is missing.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
  if (method !== 'GET') headers.Prefer = 'return=minimal';

  let response: Response;
  try {
    response = await fetch(getRestUrl(table, query), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Supabase ${method} ${table} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase ${method} ${table} failed: ${response.status} ${message}`);
  }

  if (response.status === 204) return [] as T;
  const text = await response.text();
  if (!text.trim()) return [] as T;
  return JSON.parse(text) as T;
}

export async function selectRows<T>(table: string, query = 'select=*') {
  return request<T[]>(table, 'GET', undefined, query);
}

export async function insertRows<T>(table: string, rows: Partial<T> | Partial<T>[]) {
  return request<T[]>(table, 'POST', rows);
}

export async function updateRows<T>(table: string, filter: string, partial: Partial<T>) {
  return request<T[]>(table, 'PATCH', partial, filter);
}

export async function deleteRows(table: string, filter: string) {
  return request<unknown[]>(table, 'DELETE', undefined, filter);
}
