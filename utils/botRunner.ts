import { BOT_EDGE_FUNCTION_PATH } from '../constants/izmirBotConfig';
import { isSupabaseConfigured } from './supabaseClient';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const LOCAL_BOT_URL = 'http://localhost:8787/run-bot';

export interface BotRunSummary {
  ok: boolean;
  scanned?: number;
  found?: number;
  saved?: number;
  errors?: number;
  error?: string;
  message?: string;
}

export async function triggerBotRun(): Promise<BotRunSummary> {
  if (isLocalWeb()) {
    try {
      return await postBotRun(LOCAL_BOT_URL);
    } catch (err) {
      console.warn('[botRunner] Local bot server unavailable, falling back to Edge Function.', err);
      // Local helper is optional; fall back to the deployed Edge Function.
    }
  }

  if (!isSupabaseConfigured() || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase yapılandırması eksik. .env.local dosyasını kontrol et.');
  }

  return postBotRun(`${SUPABASE_URL.replace(/\/$/, '')}${BOT_EDGE_FUNCTION_PATH}`);
}

function isLocalWeb() {
  return (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  );
}

async function postBotRun(url: string): Promise<BotRunSummary> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (url !== LOCAL_BOT_URL && SUPABASE_ANON_KEY) {
      headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
      headers.apikey = SUPABASE_ANON_KEY;
    }

    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers,
    });

    const text = await res.text();
    let data: BotRunSummary;
    try {
      data = text ? JSON.parse(text) as BotRunSummary : { ok: false, error: 'Boş yanıt' };
    } catch {
      data = { ok: false, error: text || `Bot HTTP ${res.status} döndürdü.` };
    }

    if (!res.ok || !data.ok) {
      throw new Error(data.error ?? `${url} HTTP ${res.status} döndürdü.`);
    }

    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Bot zaman aşımına uğradı. Kaynak taraması çok uzun sürdü.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function formatBotRunResult(result: BotRunSummary): string {
  if (!result.ok) {
    return `Bot çalışırken hata oluştu:\n${result.error ?? 'Bilinmeyen hata'}`;
  }

  if (result.message) return result.message;

  const lines = [
    `Bot tamamlandı`,
    ``,
    `Taranan okul: ${result.scanned ?? 0}`,
    `Bulunan ilan: ${result.found ?? 0}`,
    `Kaydedilen  : ${result.saved ?? 0} (onay bekliyor)`,
  ];

  if ((result.errors ?? 0) > 0) {
    lines.push(`Ulaşılamayan: ${result.errors}`);
  }

  if ((result.saved ?? 0) > 0) {
    lines.push(``, `Otomasyon sekmesinden inceleyebilirsin.`);
  }

  return lines.join('\n');
}
