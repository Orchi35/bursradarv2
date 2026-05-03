(function () {
  const SUPABASE_URL      = 'https://retphdxaoblwczvrzsru.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_hcdzUiHbU7URlr05gYRtUw_N_ZAMFO1';
  const TIMEOUT_MS        = 12000;

  // ── Supabase JS SDK istemcisi (auth + realtime) ───────────────────────────
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      storage: window.localStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

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
    const schoolVerificationStatus = row.verification_status || (row.is_verified ? 'official_verified' : 'pending_review');
    return {
      id:                    row.id,
      name:                  row.name,
      district:              row.district,
      city:                  row.city                   || 'İzmir',
      campus:                row.campus_name            || undefined,
      phone:                 row.phone_number           || undefined,
      website:               row.website_url            || undefined,
      instagram:             row.instagram_handle       || undefined,
      verified:              schoolVerificationStatus === 'official_verified',
      isPremium:             row.is_premium             ?? false,
      logoColor:             logoColor(row.name),
      profileImageUrl:       row.logo_url               || undefined,
      logoUrl:               row.logo_url               || undefined,
      heroColor:             row.hero_color             || undefined,
      description:           row.about_text             || undefined,
      registrationStartDate: row.registration_start_date || undefined,
      registrationDeadline:  row.registration_end_date   || undefined,
      verificationStatus:    schoolVerificationStatus,
      verification_status:   schoolVerificationStatus,
      verificationSource:    row.verification_source    || undefined,
      verification_source:   row.verification_source    || undefined,
      verifiedAt:            row.verified_at             || undefined,
      lastCheckedAt:         row.last_checked_at         || undefined,
      verificationAdminNote: row.verification_admin_note || undefined,
      registrationVerificationStatus: row.registration_verification_status || 'pending_review',
      registration_verification_status: row.registration_verification_status || 'pending_review',
      registrationVerificationSource: row.registration_verification_source || undefined,
      registrationVerifiedAt:         row.registration_verified_at         || undefined,
      registrationLastCheckedAt:      row.registration_last_checked_at     || undefined,
      registrationAdminNote:          row.registration_admin_note          || undefined,
      trust: {
        status:        schoolVerificationStatus,
        source:        row.verification_source || 'unknown',
        verifiedAt:    row.verified_at || undefined,
        lastCheckedAt: row.last_checked_at || undefined,
        verifiedBy:    row.verified_by || undefined,
        adminNote:     row.verification_admin_note || undefined,
      },
      registrationTrust: {
        status:        row.registration_verification_status || 'pending_review',
        source:        row.registration_verification_source || 'unknown',
        verifiedAt:    row.registration_verified_at || undefined,
        lastCheckedAt: row.registration_last_checked_at || undefined,
        verifiedBy:    row.registration_verified_by || undefined,
        adminNote:     row.registration_admin_note || undefined,
      },
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
      verificationStatus:   row.verification_status || (row.is_verified ? 'official_verified' : 'pending_review'),
      verificationSource:   row.verification_source || 'unknown',
      verifiedAt:           row.verified_at || undefined,
      lastCheckedAt:        row.last_checked_at || undefined,
      verifiedBy:           row.verified_by || undefined,
      verificationAdminNote: row.verification_admin_note || undefined,
      isFeatured:           row.is_featured             ?? false,
      scholarshipRate:      row.scholarship_rate        ?? null,
      examLocation:         row.exam_location           || undefined,
      applicationUrl:       row.application_url         || undefined,
      notes:                row.notes                   || undefined,
      trustStatus:          row.verification_status     || 'pending_review',
      trustSource:          row.verification_source     || undefined,
      trustVerifiedAt:      row.verified_at             || undefined,
      trustLastCheckedAt:   row.last_checked_at         || undefined,
      trustAdminNote:       row.verification_admin_note || undefined,
    };
  }

  // ── REST yardımcıları ─────────────────────────────────────────────────────
  function restUrl(table, query) {
    return `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  }

  function authHeaders(session) {
    const token = session?.access_token || SUPABASE_ANON_KEY;
    return {
      apikey:         SUPABASE_ANON_KEY,
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer:         'return=representation',
    };
  }

  async function restGet(table, query, session) {
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(restUrl(table, query), {
        signal:  ctrl.signal,
        headers: authHeaders(session),
      });
      if (!res.ok) throw new Error(`GET ${table} ${res.status}: ${await res.text()}`);
      return res.json();
    } finally { clearTimeout(t); }
  }

  async function restPost(table, body, session) {
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(restUrl(table, ''), {
        method:  'POST',
        signal:  ctrl.signal,
        headers: authHeaders(session),
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`POST ${table} ${res.status}: ${await res.text()}`);
      return res.json();
    } finally { clearTimeout(t); }
  }

  async function restPatch(table, query, body, session) {
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(restUrl(table, query), {
        method:  'PATCH',
        signal:  ctrl.signal,
        headers: authHeaders(session),
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`PATCH ${table} ${res.status}: ${await res.text()}`);
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } finally { clearTimeout(t); }
  }

  async function restDelete(table, query, session) {
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(restUrl(table, query), {
        method:  'DELETE',
        signal:  ctrl.signal,
        headers: authHeaders(session),
      });
      if (!res.ok) throw new Error(`DELETE ${table} ${res.status}: ${await res.text()}`);
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } finally { clearTimeout(t); }
  }

  async function restRpc(fn, params, session) {
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method:  'POST',
        signal:  ctrl.signal,
        headers: authHeaders(session),
        body:    JSON.stringify(params || {}),
      });
      if (!res.ok) throw new Error(`RPC ${fn} ${res.status}: ${await res.text()}`);
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } finally { clearTimeout(t); }
  }

  // ── Ana veri yükleme ──────────────────────────────────────────────────────
  async function loadSupabaseData() {
    const [schoolRows, examRows] = await Promise.all([
      restGet('schools', 'select=*&order=name.asc'),
      restGet('exams',   'select=*&is_verified=eq.true&order=exam_date.asc'),
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

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function getSession() {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  }

  async function signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data?.session || null;
  }

  async function signUp(email, password) {
    const redirectTo = window.ReactNativeWebView != null
      ? window.BURSRADAR_AUTH_REDIRECT_TO
      : `${window.location.origin}${window.location.pathname}`;
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    return data?.session || null;
  }

  async function resendSignupConfirmation(email) {
    const trimmed = (email || '').trim();
    if (!trimmed) throw new Error('E-posta adresi gerekli.');
    const redirectTo = window.ReactNativeWebView != null
      ? window.BURSRADAR_AUTH_REDIRECT_TO
      : `${window.location.origin}/?auth=signup`;
    const { error } = await sb.auth.resend({
      type: 'signup',
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
  }

  async function deleteAccount(session) {
    await restRpc('delete_user', {}, session);
    await sb.auth.signOut();
  }

  async function signInWithGoogle() {
    const isNative = window.ReactNativeWebView != null;
    const redirectTo = isNative
      ? window.BURSRADAR_AUTH_REDIRECT_TO
      : `${window.location.origin}/?auth=google`;
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: isNative,
      },
    });
    if (error) throw error;
    if (isNative && data?.url) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'oauth', url: data.url }));
      return;
    }
  }

  async function resetPassword(email) {
    const redirectTo = `${window.location.origin}/?auth=reset`;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  async function getCurrentUserProfile(session) {
    if (!session?.access_token) return null;
    const rows = await restGet('user_profiles', `select=*&user_id=eq.${session.user.id}&limit=1`, session);
    return rows?.[0] || null;
  }

  // ── Kullanıcı sınav planı ─────────────────────────────────────────────────
  async function getUserExamMarks(session) {
    if (!session?.access_token) return [];
    return restGet('user_exam_marks', `select=exam_id,is_favorite,has_reminder&user_id=eq.${session.user.id}`, session);
  }

  async function setUserExamMark(examId, { isFavorite, hasReminder }, session) {
    if (!session?.access_token) return;
    if (!isFavorite && !hasReminder) {
      await restDelete('user_exam_marks', `user_id=eq.${session.user.id}&exam_id=eq.${examId}`, session);
      return;
    }
    const body = {
      user_id:      session.user.id,
      exam_id:      examId,
      is_favorite:  isFavorite  ?? false,
      has_reminder: hasReminder ?? false,
    };
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(restUrl('user_exam_marks', ''), {
        method:  'POST',
        signal:  ctrl.signal,
        headers: { ...authHeaders(session), Prefer: 'resolution=merge-duplicates,return=minimal' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`upsert user_exam_marks ${res.status}: ${await res.text()}`);
    } finally { clearTimeout(t); }
  }

  // ── Okul paketleri ────────────────────────────────────────────────────────
  async function getSchoolPackages(schoolId, session) {
    return restGet('school_packages', `select=*&school_id=eq.${schoolId}&order=created_at.desc`, session);
  }

  async function getSchoolPackageRequests(schoolId, session) {
    return restGet('package_requests', `select=*&school_id=eq.${schoolId}&order=created_at.desc`, session);
  }

  async function getSchoolExams(schoolId, session) {
    const rows = await restGet('exams', `select=*&school_id=eq.${schoolId}&order=exam_date.asc`, session);
    const school = window.getSchool ? window.getSchool(schoolId) : null;
    return (rows || []).map(row => fromDbExam(row, new Map([[schoolId, school]])));
  }

  async function createPackageRequest({ schoolId, packageType, price, note }, session) {
    const rows = await restPost('package_requests', {
      school_id:    schoolId,
      package_type: packageType,
      price:        price,
      note:         note || null,
    }, session);
    const request = rows?.[0] || null;
    if (request?.id) {
      try {
        await notifyPackageRequest(request.id, session);
      } catch (err) {
        err.requestSaved = true;
        throw err;
      }
    }
    return request;
  }

  async function notifyPackageRequest(requestId, session) {
    if (!session?.access_token) throw new Error('Oturum bulunamadı.');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/package-request-notify`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok || data?.ok === false) throw new Error(data?.error || `Mail ${res.status}`);
      return data;
    } finally {
      clearTimeout(t);
    }
  }

  async function createSchoolExam(schoolId, values, session) {
    const rows = await restPost('exams', {
      school_id:              schoolId,
      title:                  values.examName || values.title,
      exam_date:              values.examDate              || null,
      exam_location:          values.examLocation          || null,
      application_start_date: values.applicationStartDate  || null,
      application_deadline:   values.applicationDeadline   || null,
      applicable_grades:      values.eligibleGrades         || [],
      scholarship_rate:       values.scholarshipRate        ?? null,
      application_url:        values.applicationUrl         || null,
      notes:                  values.notes                  || null,
      is_verified:            false,
      is_featured:            false,
    }, session);
    const row = rows?.[0] || null;
    const school = window.getSchool ? window.getSchool(schoolId) : null;
    return row ? fromDbExam(row, new Map([[schoolId, school]])) : null;
  }

  async function deleteSchoolExam(examId, session) {
    return restDelete('exams', `id=eq.${examId}`, session);
  }

  // ── Okul profil yönetimi ──────────────────────────────────────────────────
  async function updateSchoolProfile(schoolId, values, session) {
    const body = {};
    if ('name'            in values) body.name             = values.name;
    if ('campusName'      in values) body.campus_name      = values.campusName      || null;
    if ('campus'          in values) body.campus_name      = values.campus          || null;
    if ('phoneNumber'     in values) body.phone_number     = values.phoneNumber     || null;
    if ('phone'           in values) body.phone_number     = values.phone           || null;
    if ('websiteUrl'      in values) body.website_url      = values.websiteUrl      || null;
    if ('website'         in values) body.website_url      = values.website         || null;
    if ('instagramHandle' in values) body.instagram_handle = values.instagramHandle || null;
    if ('instagram'       in values) body.instagram_handle = values.instagram       || null;
    if ('aboutText'       in values) body.about_text       = values.aboutText       || null;
    if ('description'     in values) body.about_text       = values.description     || null;
    if ('logoUrl'         in values) body.logo_url         = values.logoUrl         || null;
    if ('profileImageUrl' in values) body.logo_url         = values.profileImageUrl || null;
    if ('heroColor'       in values) body.hero_color       = values.heroColor       || null;
    if ('registrationStartDate' in values) body.registration_start_date = values.registrationStartDate || null;
    if ('registrationDeadline'  in values) body.registration_end_date   = values.registrationDeadline  || null;
    const rows = await restPatch('schools', `id=eq.${schoolId}`, body, session);
    return rows?.[0] ? fromDbSchool(rows[0]) : null;
  }

  async function updateRegistrationTrust(schoolId, values, session) {
    const body = {};
    const nextStatus = values.status || values.verificationStatus || null;
    const nowIso = new Date().toISOString();
    if ('registrationStartDate' in values) body.registration_start_date           = values.registrationStartDate || null;
    if ('registrationEndDate'   in values) body.registration_end_date             = values.registrationEndDate   || null;
    if ('verificationStatus'    in values) body.registration_verification_status  = values.verificationStatus    || 'pending_review';
    if ('status'                in values) body.registration_verification_status  = values.status                || 'pending_review';
    if ('verificationSource'    in values) body.registration_verification_source  = values.verificationSource    || 'unknown';
    if ('source'                in values) body.registration_verification_source  = values.source                || 'unknown';
    if ('verifiedAt'            in values) body.registration_verified_at          = values.verifiedAt            || null;
    if ('lastCheckedAt'         in values) body.registration_last_checked_at      = values.lastCheckedAt         || null;
    if ('adminNote'             in values) body.registration_admin_note           = values.adminNote             || null;
    if (nextStatus === 'official_verified') {
      body.registration_verified_at = nowIso;
      body.registration_last_checked_at = nowIso;
      if (session?.user?.id) body.registration_verified_by = session.user.id;
    }
    const rows = await restPatch('schools', `id=eq.${schoolId}`, body, session);
    return rows?.[0] ? fromDbSchool(rows[0]) : null;
  }

  async function updateSchoolTrust(schoolId, values, session) {
    const body = {};
    const nextStatus = values.status || values.verificationStatus || null;
    const nowIso = new Date().toISOString();
    if ('verificationStatus' in values) body.verification_status     = values.verificationStatus || 'pending_review';
    if ('status'             in values) body.verification_status     = values.status             || 'pending_review';
    if ('verificationSource' in values) body.verification_source     = values.verificationSource || 'unknown';
    if ('source'             in values) body.verification_source     = values.source             || 'unknown';
    if ('verifiedAt'         in values) body.verified_at             = values.verifiedAt         || null;
    if ('lastCheckedAt'      in values) body.last_checked_at         = values.lastCheckedAt      || null;
    if ('adminNote'          in values) body.verification_admin_note = values.adminNote          || null;
    if (nextStatus === 'official_verified') {
      body.verified_at = nowIso;
      body.last_checked_at = nowIso;
      body.verified_by = session?.user?.id || null;
      body.is_verified = true;
    } else if (nextStatus) {
      body.is_verified = false;
    }
    const rows = await restPatch('schools', `id=eq.${schoolId}`, body, session);
    return rows?.[0] ? fromDbSchool(rows[0]) : null;
  }

  async function updateExamTrust(examId, values, session) {
    const body = {};
    const nextStatus = values.status || values.verificationStatus || null;
    const nowIso = new Date().toISOString();
    if ('verificationStatus' in values) body.verification_status     = values.verificationStatus || 'pending_review';
    if ('status'             in values) body.verification_status     = values.status             || 'pending_review';
    if ('verificationSource' in values) body.verification_source     = values.verificationSource || 'unknown';
    if ('source'             in values) body.verification_source     = values.source             || 'unknown';
    if ('verifiedAt'         in values) body.verified_at             = values.verifiedAt         || null;
    if ('lastCheckedAt'      in values) body.last_checked_at         = values.lastCheckedAt      || null;
    if ('adminNote'          in values) body.verification_admin_note = values.adminNote          || null;
    if ('applicationUrl'     in values) body.application_url         = values.applicationUrl     || null;
    if (nextStatus === 'official_verified') {
      body.verified_at = nowIso;
      body.last_checked_at = nowIso;
      body.verified_by = session?.user?.id || null;
    }
    if (body.verification_status) body.is_verified = body.verification_status === 'official_verified';
    const rows = await restPatch('exams', `id=eq.${examId}`, body, session);
    const row = rows?.[0] || null;
    if (!row) return null;
    const school = window.getSchool ? window.getSchool(row.school_id) : null;
    return fromDbExam(row, new Map([[row.school_id, school]]));
  }

  async function uploadSchoolLogo(schoolId, file, session) {
    if (!session?.access_token) throw new Error('Oturum gerekli');
    const ext  = (file.name || 'logo.jpg').split('.').pop() || 'jpg';
    const path = `${schoolId}/logo.${ext}`;
    const { error } = await sb.storage
      .from('school-assets')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data: urlData } = sb.storage.from('school-assets').getPublicUrl(path);
    const logoUrl = urlData.publicUrl + '?t=' + Date.now();
    return updateSchoolProfile(schoolId, { profileImageUrl: logoUrl }, session);
  }

  // ── Admin: paket ve talep yönetimi ────────────────────────────────────────
  async function getAdminPackageRequests(session) {
    return restGet('package_requests', 'select=*,schools(name)&order=created_at.desc', session);
  }

  async function getAdminSchoolPackages(session) {
    return restGet('school_packages', 'select=*,schools(name)&order=created_at.desc', session);
  }

  async function getAdminUserProfiles(session) {
    return restRpc('admin_list_user_profiles', {}, session);
  }

  async function getAdminSchools(session) {
    return restGet('schools', 'select=*&order=name.asc', session);
  }

  async function approvePackageRequest({ requestId, adminNote, note, expiresAt }, session) {
    return restRpc('admin_approve_package_request', {
      target_request_id: requestId,
      admin_note_value:  adminNote || note || null,
      expires_at_value:  expiresAt || null,
    }, session);
  }

  async function rejectPackageRequest({ requestId, adminNote, note }, session) {
    return restRpc('admin_reject_package_request', {
      target_request_id: requestId,
      admin_note_value:  adminNote || note || null,
    }, session);
  }

  async function deactivateSchoolPackage({ packageId, nextStatus, status }, session) {
    return restRpc('admin_deactivate_school_package', {
      target_package_id: packageId,
      next_status:       nextStatus || status || 'inactive',
    }, session);
  }

  async function assignSchoolPackage({ schoolId, packageType, price, expiresAt }, session) {
    return restRpc('admin_assign_school_package', {
      target_school_id:    schoolId,
      target_package_type: packageType,
      package_price:       price,
      expires_at_value:    expiresAt || null,
    }, session);
  }

  async function updateSchoolPackageExpiry({ packageId, expiresAt }, session) {
    return restRpc('admin_update_school_package_expiry', {
      target_package_id: packageId,
      expires_at_value:  expiresAt || null,
    }, session);
  }

  async function restrictUserProfile({ profileUserId, restricted, restrictionNote }, session) {
    return restRpc('admin_restrict_user_profile', {
      target_profile_user_id: profileUserId,
      restricted_value:        restricted,
      restriction_note_value:  restrictionNote || null,
    }, session);
  }

  async function findAdminUserByEmail(email, session) {
    const rows = await restRpc('admin_find_user_profile_by_email', { search_email: email }, session);
    return Array.isArray(rows) ? rows : (rows ? [rows] : []);
  }

  async function updateAdminUserRole({ email, role, schoolId }, session) {
    const rows = await restRpc('admin_update_user_role_by_email', {
      target_email:     email,
      target_role:      role,
      target_school_id: schoolId || null,
    }, session);
    return Array.isArray(rows) ? rows : (rows ? [rows] : []);
  }

  // ── Realtime ──────────────────────────────────────────────────────────────
  function startRealtime({ session, profile, onPublicDataChange, onPrivateDataChange, onProfileChange }) {
    let debounceTimer = null;
    function debounced(fn, payload) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fn(payload), 400);
    }

    const channels = [];

    // Herkese açık okul/sınav değişiklikleri
    const publicCh = sb.channel('bursradar-public')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, payload => {
        debounced(() => loadSupabaseData().then(() => onPublicDataChange?.(payload)).catch(() => {}), payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, payload => {
        debounced(() => loadSupabaseData().then(() => onPublicDataChange?.(payload)).catch(() => {}), payload);
      })
      .subscribe();
    channels.push(publicCh);

    // Oturum açık kullanıcı: özel plan verileri
    if (session?.user?.id) {
      const privateCh = sb.channel('bursradar-private-' + session.user.id)
        .on('postgres_changes', {
          event:  '*',
          schema: 'public',
          table:  'user_exam_marks',
          filter: `user_id=eq.${session.user.id}`,
        }, () => onPrivateDataChange?.())
        .subscribe();
      channels.push(privateCh);
    }

    // Admin veya okul kullanıcısı: paket ve talep değişiklikleri
    if (profile?.role === 'admin' || profile?.role === 'school_user') {
      const adminCh = sb.channel('bursradar-packages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'school_packages' },  () => onPrivateDataChange?.())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'package_requests' }, () => onPrivateDataChange?.())
        .subscribe();
      channels.push(adminCh);
    }

    // Kullanıcı rol profili değişiklikleri
    if (session?.user?.id) {
      const profileCh = sb.channel('bursradar-profile-' + session.user.id)
        .on('postgres_changes', {
          event:  '*',
          schema: 'public',
          table:  'user_profiles',
          filter: `user_id=eq.${session.user.id}`,
        }, () => onProfileChange?.())
        .subscribe();
      channels.push(profileCh);
    }

    // Temizleme fonksiyonu döndür
    return function cleanup() {
      clearTimeout(debounceTimer);
      channels.forEach(ch => sb.removeChannel(ch));
    };
  }

  // ── Genel API ─────────────────────────────────────────────────────────────
  window.BursRadarSupabase = {
    isConfigured: () => true,

    // Veri
    loadSupabaseData,

    // Auth
    getSession,
    signIn,
    signUp,
    resendSignupConfirmation,
    signOut,
    deleteAccount,
    signInWithGoogle,
    resetPassword,
    getCurrentUserProfile,

    // Kullanıcı planı
    getUserExamMarks,
    setUserExamMark,

    // Okul paket / sınav yönetimi
    getSchoolPackages,
    getSchoolPackageRequests,
    getSchoolExams,
    createPackageRequest,
    notifyPackageRequest,
    createSchoolExam,
    deleteSchoolExam,

    // Okul profil yönetimi
    updateSchoolProfile,
    updateRegistrationTrust,
    updateSchoolTrust,
    updateExamTrust,
    uploadSchoolLogo,

    // Admin
    getAdminPackageRequests,
    getAdminSchoolPackages,
    getAdminUserProfiles,
    getAdminSchools,
    approvePackageRequest,
    rejectPackageRequest,
    deactivateSchoolPackage,
    assignSchoolPackage,
    updateSchoolPackageExpiry,
    restrictUserProfile,
    findAdminUserByEmail,
    updateAdminUserRole,

    // Realtime
    startRealtime,
  };

  // ── Sayfa yüklenince otomatik veri başlat ─────────────────────────────────
  loadSupabaseData().catch(err => {
    console.warn('[BursRadar] Supabase yüklenemedi, mock veri kullanılıyor.', err.message);
    window.BURSRADAR_DATA_SOURCE = 'local';
  });
})();
