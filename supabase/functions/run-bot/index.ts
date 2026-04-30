import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json",
};

const FETCH_TIMEOUT_MS = 10_000;
const CONCURRENCY = 3;

interface School {
  id: string;
  name: string;
  website_url: string | null;
  instagram_handle: string | null;
}

interface RawFinding {
  sourceUrl: string;
  sourceType: string;
  rawText: string;
  linkedFrom?: string;
}

interface AppExamDraft {
  title: string;
  examDate: string | null;
  applicationStartDate: string | null;
  deadline: string | null;
  grades: string[];
  examLocation: string | null;
  applicationUrl: string | null;
  notes: string;
  confidence: number;
  sourceUrl: string;
  sourceType: string;
  rawText: string;
  normalizedPayload: Record<string, unknown>;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function normalize(text: string): string {
  return (text || "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("\u0131", "i")
    .replaceAll("\u011f", "g")
    .replaceAll("\u00fc", "u")
    .replaceAll("\u015f", "s")
    .replaceAll("\u00f6", "o")
    .replaceAll("\u00e7", "c")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

const EXAM_KW = [
  "bursluluk",
  "burs sinavi",
  "kabul sinavi",
  "giris sinavi",
  "togs",
  "basvuru",
  "sinav tarihi",
  "kayit donemi",
];

const REJECT_KW = ["dershane", "kurs merkezi", "universite sinavlari"];
const STRONG_EXAM_KW = ["bursluluk sinavi", "burs sinavi", "kabul sinavi", "giris sinavi", "togs", "sinav tarihi"];
const BAD_TITLE_KW = ["ana sayfa", "mezunlar dernegi", "kurumsal", "yonetim", "hakkimizda", "iletisim"];

const ISO_DATE_RE = new RegExp("\\b(20\\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\\d|3[01])\\b");
const DMY_DATE_RE = new RegExp("\\b(0?[1-9]|[12]\\d|3[01])[./](0?[1-9]|1[0-2])[./](20\\d{2})\\b");
const TR_DATE_RE = new RegExp("\\b(0?[1-9]|[12]\\d|3[01])\\s+(ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)(?:\\s+(20\\d{2}))?\\b");
const GRADE_RE = new RegExp("\\b([1-9]|1[0-2])\\s*(?:\\.|-|inci|nci|uncu|rd\\u00fc)?\\s*sinif\\b", "g");

const MONTH_MAP: Record<string, string> = {
  ocak: "01",
  subat: "02",
  mart: "03",
  nisan: "04",
  mayis: "05",
  haziran: "06",
  temmuz: "07",
  agustos: "08",
  eylul: "09",
  ekim: "10",
  kasim: "11",
  aralik: "12",
};

function extractDate(text: string, year: number): string | null {
  const n = normalize(text);
  let match = n.match(ISO_DATE_RE);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;

  match = n.match(DMY_DATE_RE);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;

  match = n.match(TR_DATE_RE);
  if (match) return `${match[3] || year}-${MONTH_MAP[match[2]]}-${match[1].padStart(2, "0")}`;

  return null;
}

function extractDateNear(text: string, labels: string[], year: number): string | null {
  const n = normalize(text);
  for (const label of labels) {
    const index = n.indexOf(label);
    if (index < 0) continue;
    const date = extractDate(n.slice(index, index + 200), year);
    if (date) return date;
  }
  return null;
}

function extractExamDate(text: string, year: number): string | null {
  return (
    extractDateNear(text, ["sinav tarihi", "togs sinavi", "giris sinavi tarihi", "kabul sinavi tarihi", "sinav gunu"], year) ||
    extractDate(text, year)
  );
}

function extractDeadline(text: string, year: number): string | null {
  return extractDateNear(text, ["son basvuru tarihi", "son basvuru", "basvuru bitis", "basvurular bitis", "basvuru son"], year);
}

function extractApplicationStartDate(text: string, year: number): string | null {
  return extractDateNear(text, [
    "basvuru baslama tarihi",
    "basvuru baslangic tarihi",
    "basvuru baslangic",
    "basvurular basladi",
    "kayit baslangic",
  ], year);
}

function extractApplicationUrl(text: string, fallbackUrl: string): string {
  const match = text.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0].replace(/[),.]+$/, "") : fallbackUrl;
}

function extractExamLocation(text: string, school: School): string | null {
  const n = normalize(text);
  const labels = ["sinav yeri", "sinav merkezi", "yer", "kampus", "kampusu"];
  for (const label of labels) {
    const index = n.indexOf(label);
    if (index < 0) continue;
    const snippet = text.slice(index, index + 120).replace(/\s+/g, " ").trim();
    if (snippet.length >= 8) return snippet.slice(0, 100);
  }
  return school.name;
}

function extractGrades(text: string): string[] {
  const n = normalize(text);
  const grades = new Set<string>();

  for (const match of n.matchAll(GRADE_RE)) {
    const grade = Number(match[1]);
    if (grade >= 1 && grade <= 12) grades.add(`${grade}. Sinif`);
  }

  if (n.includes("ortaokul")) ["5. Sinif", "6. Sinif", "7. Sinif", "8. Sinif"].forEach((grade) => grades.add(grade));
  if (n.includes("ilkokul")) ["1. Sinif", "2. Sinif", "3. Sinif", "4. Sinif"].forEach((grade) => grades.add(grade));

  return [...grades].sort((a, b) => Number.parseInt(a) - Number.parseInt(b)).slice(0, 8);
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000);
}

function extractMeta(html: string): string {
  const patterns = [
    /property="og:title"\s+content="([^"]{10,})"/gi,
    /property="og:description"\s+content="([^"]{10,})"/gi,
    /name="description"\s+content="([^"]{10,})"/gi,
    /<title[^>]*>([^<]{5,})<\/title>/gi,
  ];

  return patterns.flatMap((pattern) => [...html.matchAll(pattern)].map((match) => match[1])).join(" ").slice(0, 2000);
}

function extractTitle(text: string, fallback: string): string {
  const n = normalize(text);
  if (n.includes("togs")) return "TOGS Sinav Basvurusu";
  if (n.includes("bursluluk sinavi")) return "Bursluluk Sinavi Basvurusu";
  if (n.includes("giris sinavi")) return "Giris Sinavi Basvurusu";
  if (n.includes("kabul sinavi")) return "Kabul Sinavi Basvurusu";
  if (n.includes("burs") && n.includes("sinav")) return "Burs Sinavi Basvurusu";

  return fallback;
}

function confidenceScore(text: string, draft: Pick<AppExamDraft, "examDate" | "deadline" | "grades" | "applicationUrl">): number {
  const n = normalize(text);
  let score = 0.45;
  if (hasAny(n, ["bursluluk", "burs sinavi", "kabul sinavi", "giris sinavi", "togs"])) score += 0.2;
  if (draft.examDate) score += 0.12;
  if (draft.deadline) score += 0.1;
  if (draft.grades.length > 0) score += 0.08;
  if (draft.applicationUrl) score += 0.05;
  return Math.min(0.98, Number(score.toFixed(2)));
}

function buildNotes(text: string, sourceUrl: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  const excerpt = compact.length > 260 ? `${compact.slice(0, 260)}...` : compact;
  return `Bot tarafindan kaynak metinden duzenlendi. Kaynak: ${sourceUrl}. Ozet: ${excerpt}`;
}

function normalizeForApp(school: School, finding: RawFinding): AppExamDraft {
  const year = new Date().getFullYear();
  const title = extractTitle(finding.rawText, `${school.name} Bursluluk Sinavi`);
  const examDate = extractExamDate(finding.rawText, year);
  const deadline = extractDeadline(finding.rawText, year);
  const grades = extractGrades(finding.rawText);
  const applicationUrl = extractApplicationUrl(finding.rawText, finding.sourceUrl);
  const partial = { examDate, deadline, grades, applicationUrl };
  const confidence = confidenceScore(finding.rawText, partial);

  return {
    title,
    examDate,
    applicationStartDate: extractApplicationStartDate(finding.rawText, year),
    deadline,
    grades,
    examLocation: extractExamLocation(finding.rawText, school),
    applicationUrl,
    notes: buildNotes(finding.rawText, finding.sourceUrl),
    confidence,
    sourceUrl: finding.sourceUrl,
    sourceType: finding.sourceType,
    rawText: finding.rawText.slice(0, 700),
    normalizedPayload: {
      schoolName: school.name,
      title,
      examDate,
      applicationStartDate: extractApplicationStartDate(finding.rawText, year),
      applicationDeadline: deadline,
      eligibleGrades: grades,
      examLocation: extractExamLocation(finding.rawText, school),
      applicationUrl,
      sourceUrl: finding.sourceUrl,
      sourceType: finding.sourceType,
      confidence,
    },
  };
}

function dateAtStart(value: string): Date {
  const date = new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function todayAtStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isPast(value: string | null): boolean {
  return Boolean(value && dateAtStart(value) < todayAtStart());
}

function hasStrongExamSignal(text: string, url: string): boolean {
  return hasAny(normalize(`${text} ${url}`), STRONG_EXAM_KW);
}

function isAppReadyDraft(draft: AppExamDraft): boolean {
  const title = normalize(draft.title);
  if (!draft.examDate || !draft.deadline) return false;
  if (isPast(draft.examDate) || isPast(draft.deadline)) return false;
  if (!draft.grades.length) return false;
  if (draft.confidence < 0.75) return false;
  if (draft.title.length > 90) return false;
  if (hasAny(title, BAD_TITLE_KW)) return false;
  return hasStrongExamSignal(`${draft.title} ${draft.rawText}`, draft.sourceUrl);
}

async function fetchPage(url: string): Promise<{ ok: boolean; status: number | null; html: string; text: string; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.5,en;q=0.3",
      },
    });

    if (!res.ok) return { ok: false, status: res.status, html: "", text: "" };

    const html = await res.text();
    return { ok: true, status: res.status, html, text: `${extractMeta(html)} ${htmlToText(html)}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: null, html: "", text: "", error: message };
  } finally {
    clearTimeout(timer);
  }
}

function dbHeaders() {
  if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function dbGet<T>(table: string, query = "select=*"): Promise<T[]> {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL is missing.");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: dbHeaders() });
  if (!res.ok) throw new Error(`GET ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

async function dbInsertMany(table: string, rows: Record<string, unknown>[]): Promise<void> {
  if (!rows.length) return;
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL is missing.");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...dbHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });

  if (!res.ok) throw new Error(`INSERT ${table} ${res.status}: ${await res.text()}`);
}

async function loadExistingKeys(schoolIds: string[]): Promise<Set<string>> {
  if (!schoolIds.length) return new Set();

  const rows = await dbGet<{ school_id: string; title: string; exam_date: string | null }>(
    "exams",
    `select=school_id,title,exam_date&school_id=in.(${schoolIds.join(",")})`,
  );

  return new Set(rows.map((row) => `${row.school_id}|${normalize(row.title)}|${row.exam_date || ""}`));
}

async function fetchLinkedPages(html: string, baseUrl: string): Promise<Array<{ url: string; text: string }>> {
  const links: string[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = htmlToText(match[2]);
    if (!hasAny(normalize(`${label} ${match[1]}`), EXAM_KW)) continue;

    let url: string;
    try {
      url = new URL(match[1], baseUrl).toString();
    } catch {
      continue;
    }

    if (seen.has(url)) continue;
    seen.add(url);
    links.push(url);
    if (links.length >= 3) break;
  }

  const results: Array<{ url: string; text: string }> = [];
  for (const url of links) {
    const page = await fetchPage(url);
    if (page.ok && page.text) results.push({ url, text: page.text });
  }

  return results;
}

async function collectRawFindings(school: School): Promise<RawFinding[]> {
  const findings: RawFinding[] = [];
  const sources: Array<{ url: string; type: string }> = [];

  if (school.website_url) sources.push({ url: school.website_url, type: "website" });
  if (school.instagram_handle) {
    const handle = school.instagram_handle.replace(/^@/, "");
    sources.push({ url: `https://www.instagram.com/${handle}/`, type: "instagram" });
  }

  for (const source of sources) {
    const page = await fetchPage(source.url);
    if (!page.ok) continue;

    const n = normalize(page.text);
    if (hasAny(n, REJECT_KW) || !hasAny(n, EXAM_KW) || !hasStrongExamSignal(page.text, source.url)) continue;

    findings.push({
      sourceUrl: source.url,
      sourceType: source.type,
      rawText: page.text,
    });

    if (source.type === "website" && page.html) {
      const linkedPages = await fetchLinkedPages(page.html, source.url);
      for (const linked of linkedPages) {
        const ln = normalize(linked.text);
        if (!hasAny(ln, EXAM_KW)) continue;

        findings.push({
          sourceUrl: linked.url,
          sourceType: source.type,
          rawText: linked.text,
          linkedFrom: source.url,
        });
      }
    }
  }

  return findings;
}

async function scrapeSchool(school: School): Promise<AppExamDraft[]> {
  const rawFindings = await collectRawFindings(school);
  return rawFindings
    .map((finding) => normalizeForApp(school, finding))
    .filter(isAppReadyDraft);
}

async function runInChunks<T, R>(items: T[], fn: (item: T) => Promise<R>, size: number): Promise<R[]> {
  const out: R[] = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(...await Promise.all(items.slice(index, index + size).map(fn)));
  }
  return out;
}

async function runBot() {
  const schools = await dbGet<School>("schools", "select=id,name,website_url,instagram_handle&order=name.asc");

  if (!schools.length) {
    return { ok: true, message: "Kayitli okul bulunamadi.", scanned: 0, found: 0, saved: 0, errors: 0 };
  }

  const existingKeys = await loadExistingKeys(schools.map((school) => school.id));
  const scrapeResults = await runInChunks(schools, async (school) => {
    const found = await scrapeSchool(school);
    return { school, found };
  }, CONCURRENCY);

  const toInsert: Record<string, unknown>[] = [];

  for (const { school, found } of scrapeResults) {
    for (const item of found) {
      const key = `${school.id}|${normalize(item.title)}|${item.examDate || ""}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);

      toInsert.push({
        school_id: school.id,
        title: item.title,
        exam_date: item.examDate,
        application_start_date: item.applicationStartDate,
        application_deadline: item.deadline,
        applicable_grades: item.grades,
        status: "Basvuru Acik",
        is_verified: false,
        source_url: item.sourceUrl,
        source_type: item.sourceType,
        exam_location: item.examLocation,
        application_url: item.applicationUrl,
        notes: item.notes,
        confidence_score: item.confidence,
        normalized_payload: item.normalizedPayload,
        raw_text: item.rawText,
      });
    }
  }

  await dbInsertMany("exams", toInsert);

  return {
    ok: true,
    scanned: schools.length,
    found: scrapeResults.reduce((sum, result) => sum + result.found.length, 0),
    saved: toInsert.length,
    errors: 0,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Only POST is supported." }, 405);

  try {
    return jsonResponse(await runBot());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[run-bot]", message);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
