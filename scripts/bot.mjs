#!/usr/bin/env node
/**
 * BursRadar Scraper Bot
 * Kullanım: npm run bot:scrape
 *
 * Her okul için website ve Instagram sayfasını tarar,
 * bulduğu sınav duyurularını exams tablosuna (is_verified=false) ekler.
 * Admin ekranından onaylanana kadar uygulama göstermez.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ── .env.local yükle ─────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
try {
  const env = readFileSync(join(__dir, '..', '.env.local'), 'utf-8');
  for (const line of env.split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      if (key && !process.env[key]) process.env[key] = val;
    }
  }
} catch { /* .env.local yoksa ortam değişkenleri kullanılır */ }

// ── Sabitler ──────────────────────────────────────────────────────────────────
const FETCH_TIMEOUT_MS = 10_000;
const DRY_RUN          = process.argv.includes('--dry-run');
const CONCURRENCY      = 3;       // aynı anda kaç okul taransın

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('❌  EXPO_PUBLIC_SUPABASE_URL veya EXPO_PUBLIC_SUPABASE_ANON_KEY eksik.');
  console.error('    .env.local dosyasını kontrol et.');
  process.exit(1);
}

if (!SUPABASE_SVC && !DRY_RUN) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY eksik.');
  console.error('    Bu anahtar olmadan veritabanına yazma yapılamaz (RLS engeller).');
  console.error('    Yalnızca tarama yapmak için: npm run bot:dry-run');
  process.exit(1);
}

// ── Türkçe normalleştirme ─────────────────────────────────────────────────────
function normalize(text) {
  return (text || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/\s+/g, ' ').trim();
}

function hasAny(text, keywords) {
  return keywords.some(k => text.includes(k));
}

// ── Anahtar kelimeler ─────────────────────────────────────────────────────────
const EXAM_KW = [
  'bursluluk', 'burs sinavi', 'kabul sinavi', 'giris sinavi',
  'togs', 'basvuru', 'sinav tarihi', 'kayit donemi',
];
const REJECT_KW = ['dershane', 'kurs merkezi', 'universite sinavlari'];
const STRONG_EXAM_KW = ['bursluluk sinavi', 'burs sinavi', 'kabul sinavi', 'giris sinavi', 'togs', 'sinav tarihi'];
const BAD_TITLE_KW = ['ana sayfa', 'mezunlar dernegi', 'kurumsal', 'yonetim', 'hakkimizda', 'iletisim'];

// ── Türkçe ay → numara ────────────────────────────────────────────────────────
const MONTH_MAP = {
  ocak:'01', subat:'02', mart:'03', nisan:'04', mayis:'05', haziran:'06',
  temmuz:'07', agustos:'08', eylul:'09', ekim:'10', kasim:'11', aralik:'12',
};

// ── Tarih çıkarma ─────────────────────────────────────────────────────────────
function extractDate(text, year) {
  const n = normalize(text);
  // ISO: 2026-05-10
  let m = n.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  // GG.AA.YYYY veya GG/AA/YYYY
  m = n.match(/\b(0?[1-9]|[12]\d|3[01])[./](0?[1-9]|1[0-2])[./](20\d{2})\b/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  // Türkçe: "10 mayıs 2026" veya "10 mayıs"
  m = n.match(/\b(0?[1-9]|[12]\d|3[01])\s+(ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)(?:\s+(20\d{2}))?\b/);
  if (m) return `${m[3] || year}-${MONTH_MAP[m[2]]}-${m[1].padStart(2,'0')}`;
  return null;
}

function extractDateNear(text, labels, year) {
  const n = normalize(text);
  for (const label of labels) {
    const i = n.indexOf(label);
    if (i < 0) continue;
    const date = extractDate(n.slice(i, i + 200), year);
    if (date) return date;
  }
  return null;
}

function extractExamDate(text, year) {
  return (
    extractDateNear(text, ['sinav tarihi', 'togs sinavi', 'giris sinavi tarihi', 'kabul sinavi tarihi', 'sinav gunu'], year) ||
    extractDate(text, year)
  );
}

function extractDeadline(text, year) {
  return extractDateNear(
    text,
    ['son basvuru tarihi', 'son basvuru', 'basvuru bitis', 'basvurular bitis', 'basvuru son'],
    year,
  );
}

function extractApplicationStartDate(text, year) {
  return extractDateNear(
    text,
    ['basvuru baslama tarihi', 'basvuru baslangic tarihi', 'basvuru baslangic', 'basvurular basladi', 'kayit baslangic'],
    year,
  );
}

function extractApplicationUrl(text, fallbackUrl) {
  const match = text.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0].replace(/[),.]+$/, '') : fallbackUrl;
}

function extractExamLocation(text, school) {
  const n = normalize(text);
  for (const label of ['sinav yeri', 'sinav merkezi', 'yer', 'kampus', 'kampusu']) {
    const index = n.indexOf(label);
    if (index < 0) continue;
    const snippet = text.slice(index, index + 120).replace(/\s+/g, ' ').trim();
    if (snippet.length >= 8) return snippet.slice(0, 100);
  }
  return school.name;
}

// ── Sınıf çıkarma ─────────────────────────────────────────────────────────────
function extractGrades(text) {
  const n = normalize(text);
  const grades = new Set();
  for (const m of n.matchAll(/\b([1-9]|1[0-2])\s*(?:\.|-|inci|nci|uncu|rdü)?\s*sinif\b/g)) {
    const num = parseInt(m[1], 10);
    if (num >= 1 && num <= 12) grades.add(`${num}. Sınıf`);
  }
  if (n.includes('ortaokul')) ['5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf'].forEach(g => grades.add(g));
  if (n.includes('ilkokul'))  ['1. Sınıf','2. Sınıf','3. Sınıf','4. Sınıf'].forEach(g => grades.add(g));
  return [...grades].sort((a, b) => parseInt(a) - parseInt(b)).slice(0, 8);
}

// ── HTML → düz metin ──────────────────────────────────────────────────────────
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim()
    .slice(0, 6000);
}

function extractMeta(html) {
  const patterns = [
    /property="og:title"\s+content="([^"]{10,})"/gi,
    /property="og:description"\s+content="([^"]{10,})"/gi,
    /name="description"\s+content="([^"]{10,})"/gi,
    /<title[^>]*>([^<]{5,})<\/title>/gi,
  ];
  return patterns.flatMap(re => [...html.matchAll(re)].map(m => m[1])).join(' ').slice(0, 2000);
}

// ── Sınav başlığı çıkarma ─────────────────────────────────────────────────────
function extractTitle(text, fallback) {
  const n = normalize(text);
  if (n.includes('togs')) return 'TOGS Sınav Başvurusu';
  if (n.includes('bursluluk sinavi')) return 'Bursluluk Sınavı Başvurusu';
  if (n.includes('giris sinavi')) return 'Giriş Sınavı Başvurusu';
  if (n.includes('kabul sinavi')) return 'Kabul Sınavı Başvurusu';
  if (n.includes('burs') && n.includes('sinav')) return 'Burs Sınavı Başvurusu';
  return fallback;
}

function confidenceScore(text, draft) {
  const n = normalize(text);
  let score = 0.45;
  if (hasAny(n, ['bursluluk', 'burs sinavi', 'kabul sinavi', 'giris sinavi', 'togs'])) score += 0.2;
  if (draft.examDate) score += 0.12;
  if (draft.deadline) score += 0.1;
  if (draft.grades.length > 0) score += 0.08;
  if (draft.applicationUrl) score += 0.05;
  return Math.min(0.98, Number(score.toFixed(2)));
}

function buildNotes(text, sourceUrl) {
  const compact = text.replace(/\s+/g, ' ').trim();
  const excerpt = compact.length > 260 ? `${compact.slice(0, 260)}...` : compact;
  return `Bot tarafından kaynak metinden düzenlendi. Kaynak: ${sourceUrl}. Özet: ${excerpt}`;
}

function normalizeForApp(school, finding) {
  const year = new Date().getFullYear();
  const title = extractTitle(finding.rawText, `${school.name} Bursluluk Sınavı`);
  const examDate = extractExamDate(finding.rawText, year);
  const deadline = extractDeadline(finding.rawText, year);
  const grades = extractGrades(finding.rawText);
  const applicationUrl = extractApplicationUrl(finding.rawText, finding.sourceUrl);
  const applicationStartDate = extractApplicationStartDate(finding.rawText, year);
  const examLocation = extractExamLocation(finding.rawText, school);
  const confidence = confidenceScore(finding.rawText, { examDate, deadline, grades, applicationUrl });

  return {
    title,
    examDate,
    applicationStartDate,
    deadline,
    grades,
    examLocation,
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
      applicationStartDate,
      applicationDeadline: deadline,
      eligibleGrades: grades,
      examLocation,
      applicationUrl,
      sourceUrl: finding.sourceUrl,
      sourceType: finding.sourceType,
      confidence,
    },
  };
}

function dateAtStart(value) {
  const date = new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function todayAtStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isPast(value) {
  return Boolean(value && dateAtStart(value) < todayAtStart());
}

function hasStrongExamSignal(text, url) {
  return hasAny(normalize(`${text} ${url}`), STRONG_EXAM_KW);
}

function isAppReadyDraft(draft) {
  const title = normalize(draft.title);
  if (!draft.examDate || !draft.deadline) return false;
  if (isPast(draft.examDate) || isPast(draft.deadline)) return false;
  if (!draft.grades.length) return false;
  if (draft.confidence < 0.75) return false;
  if (draft.title.length > 90) return false;
  if (hasAny(title, BAD_TITLE_KW)) return false;
  return hasStrongExamSignal(`${draft.title} ${draft.rawText}`, draft.sourceUrl);
}

// ── HTTP fetch (timeout dahil) ────────────────────────────────────────────────
async function fetchPage(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.5,en;q=0.3',
      },
    });
    if (!res.ok) return { ok: false, status: res.status, html: '', text: '' };
    const html = await res.text();
    const text = `${extractMeta(html)} ${htmlToText(html)}`;
    return { ok: true, status: res.status, html, text };
  } catch (err) {
    return { ok: false, status: null, html: '', text: '', error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

// ── Supabase REST yardımcıları ─────────────────────────────────────────────────
function anonHeaders() {
  return {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
    'Content-Type': 'application/json',
  };
}

function serviceHeaders() {
  if (!SUPABASE_SVC) throw new Error('SUPABASE_SERVICE_ROLE_KEY eksik.');
  return {
    apikey: SUPABASE_SVC,
    Authorization: `Bearer ${SUPABASE_SVC}`,
    'Content-Type': 'application/json',
  };
}

async function dbGet(table, query = 'select=*') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: anonHeaders() });
  if (!res.ok) throw new Error(`GET ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

async function dbInsertMany(table, rows) {
  if (!rows.length) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...serviceHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`INSERT ${table} ${res.status}: ${await res.text()}`);
}

// ── Mevcut sınavları yükle (dedup için) ───────────────────────────────────────
async function loadExistingKeys(schoolIds) {
  if (!schoolIds.length) return new Set();
  const list = schoolIds.join(',');
  const rows = await dbGet('exams', `select=school_id,title,exam_date&school_id=in.(${list})`);
  return new Set(rows.map(r => `${r.school_id}|${normalize(r.title)}|${r.exam_date || ''}`));
}

// ── Bağlantılı sınav sayfalarını tara ────────────────────────────────────────
async function fetchLinkedPages(html, baseUrl) {
  const links = [];
  const seen  = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = htmlToText(m[2]);
    if (!hasAny(normalize(label + ' ' + m[1]), EXAM_KW)) continue;
    let url;
    try { url = new URL(m[1], baseUrl).toString(); } catch { continue; }
    if (seen.has(url)) continue;
    seen.add(url);
    links.push(url);
    if (links.length >= 3) break;
  }
  const results = [];
  for (const url of links) {
    const p = await fetchPage(url);
    if (p.ok && p.text) results.push({ url, text: p.text });
  }
  return results;
}

async function collectRawFindings(school) {
  const findings = [];
  const sources = [];
  if (school.website_url)       sources.push({ url: school.website_url, type: 'website' });
  if (school.instagram_handle) {
    const handle = school.instagram_handle.replace(/^@/, '');
    sources.push({ url: `https://www.instagram.com/${handle}/`, type: 'instagram' });
  }

  for (const src of sources) {
    process.stdout.write(`  → ${src.type.padEnd(10)} ${src.url} … `);
    const page = await fetchPage(src.url);

    if (!page.ok) {
      console.log(`✗ (${page.status ?? page.error})`);
      continue;
    }

    const n = normalize(page.text);
    if (hasAny(n, REJECT_KW) || !hasAny(n, EXAM_KW) || !hasStrongExamSignal(page.text, src.url)) {
      console.log('– sınav sinyali yok');
      continue;
    }
    console.log('✓');

    findings.push({ sourceUrl: src.url, sourceType: src.type, rawText: page.text });

    // Bağlantılı sınav sayfaları (yalnızca web sitesi için)
    if (src.type === 'website' && page.html) {
      const linkedPages = await fetchLinkedPages(page.html, src.url);
      for (const linked of linkedPages) {
        const ln = normalize(linked.text);
        if (!hasAny(ln, EXAM_KW)) continue;
        findings.push({ sourceUrl: linked.url, sourceType: src.type, rawText: linked.text, linkedFrom: src.url });
        console.log(`    ↳ bağlantı sayfası: ${linked.url}`);
      }
    }
  }

  return findings;
}

// ── Tek okulu iki aşamalı tara: ham bulgu → app uyumlu sınav taslağı ───────────
async function scrapeSchool(school) {
  const rawFindings = await collectRawFindings(school);
  return rawFindings
    .map(finding => normalizeForApp(school, finding))
    .filter(isAppReadyDraft);
}

// ── Paralel chunk işleme ──────────────────────────────────────────────────────
async function runInChunks(items, fn, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    const results = await Promise.all(items.slice(i, i + size).map(fn));
    out.push(...results);
  }
  return out;
}

// ── Ana fonksiyon ─────────────────────────────────────────────────────────────
async function main() {
  const startAt = Date.now();
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   BursRadar Scraper Bot                  ║');
  console.log(`║   ${new Date().toLocaleString('tr-TR').padEnd(40)}║`);
  console.log('╚══════════════════════════════════════════╝\n');

  // 1. Okulları yükle
  const schools = await dbGet('schools', 'select=*&order=name.asc');
  if (!schools.length) {
    console.log('⚠️  Hiç okul bulunamadı. Önce seed_schools.sql çalıştır.');
    return;
  }
  console.log(`📚 ${schools.length} okul yüklendi.\n`);

  // 2. Mevcut sınavları yükle (dedup)
  const existingKeys = await loadExistingKeys(schools.map(s => s.id));
  console.log(`🗂  Mevcut sınav kayıtları: ${existingKeys.size}\n`);
  console.log('─'.repeat(60));

  // 3. Okulları paralel tara
  const scrapeResults = await runInChunks(schools, async school => {
    console.log(`\n🏫 ${school.name}`);
    const found = await scrapeSchool(school);
    return { school, found };
  }, CONCURRENCY);

  console.log('\n' + '─'.repeat(60));

  // 4. Dedup + insert listesi hazırla
  const toInsert = [];
  for (const { school, found } of scrapeResults) {
    for (const f of found) {
      const key = `${school.id}|${normalize(f.title)}|${f.examDate || ''}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key); // aynı çalışma içi dedup
      toInsert.push({
        school_id:            school.id,
        title:                f.title,
        exam_date:            f.examDate   || null,
        application_start_date: f.applicationStartDate || null,
        application_deadline: f.deadline   || null,
        applicable_grades:    f.grades,
        status:               'Başvuru Açık',
        is_verified:          false,
        source_url:           f.sourceUrl,
        source_type:          f.sourceType,
        exam_location:        f.examLocation,
        application_url:      f.applicationUrl,
        notes:                f.notes,
        confidence_score:     f.confidence,
        normalized_payload:   f.normalizedPayload,
        raw_text:             f.rawText,
      });
    }
  }

  // 5. Kaydet
  if (DRY_RUN) {
    console.log(`\nDry-run modu: ${toInsert.length} yeni sınav veritabanına yazılmadı.`);
  } else if (toInsert.length > 0) {
    console.log(`\n💾 ${toInsert.length} yeni sınav kaydediliyor...`);
    await dbInsertMany('exams', toInsert);
    console.log('✅ Kaydedildi. Admin ekranından onaylayabilirsin.');
  } else {
    console.log('\nℹ️  Yeni sınav bulunamadı.');
  }

  const elapsed = ((Date.now() - startAt) / 1000).toFixed(1);
  const totalFound = scrapeResults.reduce((n, r) => n + r.found.length, 0);
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Özet');
  console.log(`   Taranan okul     : ${schools.length}`);
  console.log(`   Bulunan duyuru   : ${totalFound}`);
  console.log(`   Yeni eklenen     : ${toInsert.length}`);
  console.log(`   Süre             : ${elapsed}s`);
  console.log('═'.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n❌ Bot hatası:', err.message);
  process.exit(1);
});
