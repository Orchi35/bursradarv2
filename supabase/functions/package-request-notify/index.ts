import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const MAIL_TO = Deno.env.get("PACKAGE_REQUEST_MAIL_TO") || "orcun@bursradar.info";
const MAIL_FROM = Deno.env.get("PACKAGE_REQUEST_MAIL_FROM") || "BursRadar <noreply@bursradar.info>";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json",
};

type PackageRequestRow = {
  id: string;
  school_id: string;
  user_id: string;
  package_type: "profile_management" | "featured_school";
  price: number;
  status: string;
  note: string | null;
  created_at: string;
  schools?: { name?: string | null } | null;
};

type AuthUser = {
  id: string;
  email?: string | null;
};

type UserProfile = {
  user_id: string;
  role: "user" | "school_user" | "admin";
  school_id: string | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function packageLabel(type: PackageRequestRow["package_type"]): string {
  return type === "featured_school" ? "Öne Çıkan Okul Paketi" : "Profil Yönetimi Paketi";
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR").format(price) + " TL";
}

async function fetchVisiblePackageRequest(requestId: string, authorization: string): Promise<PackageRequestRow | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase env eksik.");

  const url = new URL(`${SUPABASE_URL}/rest/v1/package_requests`);
  url.searchParams.set("select", "id,school_id,user_id,package_type,price,status,note,created_at,schools(name)");
  url.searchParams.set("id", `eq.${requestId}`);
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: authorization,
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : [];
  if (!res.ok) throw new Error(data?.message || data?.msg || `package_requests ${res.status}`);
  return data?.[0] || null;
}

async function fetchCurrentUser(authorization: string): Promise<AuthUser | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase env eksik.");

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: authorization,
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || data?.msg || `auth user ${res.status}`);
  return data;
}

async function fetchCurrentUserProfile(userId: string, authorization: string): Promise<UserProfile | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase env eksik.");

  const url = new URL(`${SUPABASE_URL}/rest/v1/user_profiles`);
  url.searchParams.set("select", "user_id,role,school_id");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: authorization,
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : [];
  if (!res.ok) throw new Error(data?.message || data?.msg || `user_profiles ${res.status}`);
  return data?.[0] || null;
}

async function sendMail(row: PackageRequestRow, user: AuthUser | null): Promise<void> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY tanımlı değil.");

  const schoolName = row.schools?.name || row.school_id;
  const label = packageLabel(row.package_type);
  const price = formatPrice(row.price);
  const requesterEmail = user?.email || "E-posta alınamadı";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px">Yeni BursRadar paket talebi</h2>
      <p><strong>Talep oluşturan hesap:</strong> ${requesterEmail}</p>
      <p><strong>Okul:</strong> ${schoolName}</p>
      <p><strong>Paket:</strong> ${label}</p>
      <p><strong>Fiyat:</strong> ${price}</p>
      <p><strong>Durum:</strong> ${row.status}</p>
      <p><strong>Talep ID:</strong> ${row.id}</p>
      <p><strong>Okul ID:</strong> ${row.school_id}</p>
      <p><strong>Kullanıcı ID:</strong> ${row.user_id}</p>
      ${row.note ? `<p><strong>Not:</strong> ${row.note}</p>` : ""}
      <p><strong>Tarih:</strong> ${new Date(row.created_at).toLocaleString("tr-TR")}</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "bursradar-supabase-edge-function/1.0",
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [MAIL_TO],
      reply_to: user?.email ? [user.email] : undefined,
      subject: `Yeni paket talebi: ${schoolName} - ${label}`,
      html,
    }),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.message || `Resend ${res.status}`);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const requestId = String(body?.requestId || "");
    if (!requestId) return jsonResponse({ error: "requestId gerekli" }, 400);

    const user = await fetchCurrentUser(authorization);
    if (!user?.id) return jsonResponse({ error: "Kullanıcı doğrulanamadı" }, 401);

    const profile = await fetchCurrentUserProfile(user.id, authorization);
    if (!profile || profile.role !== "school_user") {
      return jsonResponse({ error: "Sadece okul hesabı paket talebi maili gönderebilir" }, 403);
    }

    const row = await fetchVisiblePackageRequest(requestId, authorization);
    if (!row) return jsonResponse({ error: "Talep bulunamadı" }, 404);
    if (user?.id && row.user_id !== user.id) return jsonResponse({ error: "Talep kullanıcısı doğrulanamadı" }, 403);
    if (profile.school_id !== row.school_id) {
      return jsonResponse({ error: "Okul hesabı sadece kendi okul talebini gönderebilir" }, 403);
    }

    await sendMail(row, user);
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("[package-request-notify]", err);
    return jsonResponse({ ok: false, error: err instanceof Error ? err.message : "Mail gönderilemedi" }, 500);
  }
});
