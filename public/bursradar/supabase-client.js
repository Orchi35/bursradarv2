(function () {
  const SUPABASE_URL      = 'https://retphdxaoblwczvrzsru.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_hcdzUiHbU7URlr05gYRtUw_N_ZAMFO1';
  const TIMEOUT_MS        = 12000;

  // ── Logo rengi — okul adından tutarlı renk üretir ──────────────────────────
  const LOGO_PALETTE = [
    '#1A3A6B','#0EA5E9','#2563EB','#7C3AED','#0F766E',
    '#16A34A','#DC2626','#EA580C','#CA8A04','#0891B2',
    '#9333EA','#DB2777','#059669','#D97706','#4F46E5',
  ];
  function logoColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
    return LOGO_PALETTE[Math.abs(h) % LOGO_PALETTE.length];
  }

  // ── Sınav durumu — exam_date ve application_deadline'dan türet ─────────────
  function deriveStatus(examDate, applicationDeadline) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exam  = examDate            ? new Date(examDate)            : null;
    const dead  = applicationDeadline ? new Date(applicationDeadline) : null;

    if (exam && exam < today)          return 'closed';
    if (dead && dead >= today)         return 'open';
    return 'upcoming';
  }

  // ── DB satırı → UI School ─────────────────────────────────────────────────
  function fromDbSchool(row) {
    return {
      id:                    row.id,
      name:                  row.name,
      district:              row.district,
      city:                  row.city                   || 'İzmir',
      campus:                row.campus_name            || undefined,
      phone:                 row.phone_number           || undefined,
      website:               row.website_url            || undefined,
      instagram:             row.instagram_handle       || undefined,
      verified:              row.is_verified            ?? false,
      isPremium:             row.is_premium             ?? false,
      logoColor:             logoColor(row.name),
      description:           row.about_text             || undefined,
      registrationStartDate: row.registration_start_date || undefined,
      registrationDeadline:  row.registration_end_date   || undefined,
    };
  }

  // ── DB satırı → UI Exam ───────────────────────────────────────────────────
  function fromDbExam(row, schoolMap) {
    const school = schoolMap.get(row.school_id);
    const status = deriveStatus(row.exam_date, row.application_deadline);

    return {
      id:                   row.id,
      schoolId:             row.school_id,
      examName:             row.title,
      examDate:             row.exam_date               || undefined,
      applicationStartDate: row.application_start_date  || undefined,
      applicationDeadline:  row.application_deadline    || undefined,
      eligibleGrades:       row.applicable_grades       || [],
      district:             school?.district            || 'İzmir',
      city:                 school?.city                || 'İzmir',
      status,
      verificationStatus:   row.is_verified ? 'verified' : 'pending',
      isFeatured:           row.is_featured             ?? false,
      scholarshipRate:      row.scholarship_rate        ?? null,
      scholarshipScore:     row.scholarship_rate        ?? 50,
      examLocation:         row.exam_location           || undefined,
      applicationUrl:       row.application_url         || undefined,
      notes:                row.notes                   || undefined,
    };
  }

  // ── HTTP yardımcıları ─────────────────────────────────────────────────────
  function restUrl(table, query) {
    return `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  }

  async function get(table, query) {
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(restUrl(table, query), {
        signal: ctrl.signal,
        headers: {
          apikey:        SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error(`${table} ${res.status}: ${await res.text()}`);
      return res.json();
    } finally { clearTimeout(t); }
  }

  // ── Ana veri yükleme ──────────────────────────────────────────────────────
  async function loadSupabaseData() {
    const [schoolRows, examRows] = await Promise.all([
      get('schools', 'select=*&order=name.asc'),
      get('exams',   'select=*&is_verified=eq.true&order=exam_date.asc'),
    ]);

    const schools   = schoolRows.map(fromDbSchool);
    const schoolMap = new Map(schoolRows.map(r => [r.id, schools.find(s => s.id === r.id)]));
    const exams     = examRows.map(r => fromDbExam(r, schoolMap));

    window.SCHOOLS = schools;
    window.EXAMS   = exams;

    window.getSchool        = id => window.SCHOOLS.find(s => s.id === id);
    window.getExam          = id => window.EXAMS.find(e => e.id === id);
    window.getExamsBySchool = id => window.EXAMS.filter(e => e.schoolId === id);

    window.BURSRADAR_DATA_SOURCE = 'supabase';
    window.BURSRADAR_DATA_READY  = true;
    window.dispatchEvent(new CustomEvent('bursradar:data-ready', {
      detail: { source: 'supabase', schools: schools.length, exams: exams.length },
    }));

    return { source: 'supabase', schools, exams };
  }

  // ── Genel API ─────────────────────────────────────────────────────────────
  window.BursRadarSupabase = {
    isConfigured:    () => true,
    loadSupabaseData,
  };

  // Sayfa yüklenince otomatik başlat
  loadSupabaseData().catch(err => {
    console.warn('[BursRadar] Supabase yüklenemedi, mock veri kullanılıyor.', err.message);
    window.BURSRADAR_DATA_SOURCE = 'local';
  });
})();
