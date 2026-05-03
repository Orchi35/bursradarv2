// BursRadar — screen components
const { useState: useS, useEffect: useE, useMemo: useM } = React;

const SCHOOL_PACKAGE_DEFINITIONS = [
  {
    type: 'profile_management',
    name: 'Profil Yönetimi Paketi',
    price: 1000,
    tone: 'standard',
    features: [
      'Okul profil bilgilerini yönetebilme',
      'Açıklama, iletişim, görsel ve kayıt bilgilerini güncelleyebilme',
      'Bursluluk sınavı bilgilerini düzenleyebilme',
      'Profil düzenleme paneline erişim',
    ],
  },
  {
    type: 'featured_school',
    name: 'Öne Çıkan Okul Paketi',
    price: 5000,
    tone: 'featured',
    features: [
      'Okul profili yönetimi',
      'Öne Çıkan Okullar alanında gösterilme',
      'Kayıt ve bursluluk sınavı listelerinde öncelikli sıralama',
      'Okul profilinde özel öne çıkan okul rozeti',
    ],
  },
];

const TRUST_STATUS_OPTIONS = [
  { value: 'official_verified', label: 'Resmi doğrulandı', text: 'Okul web sitesi veya yetkili kaynaktan doğrulanmış bilgi.' },
  { value: 'pending_review', label: 'Kontrol bekliyor', text: 'Bilgi çeşitli kaynaklardan derlendi, doğrulama sürecinde.' },
  { value: 'possibly_outdated', label: 'Eski olabilir', text: 'Bu bilgi uzun süredir güncellenmedi. Okuldan doğrulayın.' },
];

const TRUST_SOURCE_OPTIONS = [
  { value: 'official_website', label: 'Okul web sitesi' },
  { value: 'school_contact', label: 'Okul yetkilisi' },
  { value: 'social_media', label: 'Sosyal medya' },
  { value: 'manual_research', label: 'Manuel araştırma' },
  { value: 'unknown', label: 'Bilinmiyor' },
];

function trustDateValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

function trustInfo(trust) {
  const rawStatus = trust?.status || 'pending_review';
  const lastChecked = trust?.lastCheckedAt ? new Date(trust.lastCheckedAt) : null;
  const stale = rawStatus !== 'official_verified' && lastChecked && ((Date.now() - lastChecked.getTime()) / 86400000) > 15;
  const status = stale ? 'possibly_outdated' : rawStatus;
  return TRUST_STATUS_OPTIONS.find(item => item.value === status) || TRUST_STATUS_OPTIONS[1];
}

function sourceLabel(source) {
  return (TRUST_SOURCE_OPTIONS.find(item => item.value === source) || TRUST_SOURCE_OPTIONS[4]).label;
}

function isFeaturedSchool(school) {
  return !!school?.isPremium;
}

function schoolFeaturedRank(school) {
  return isFeaturedSchool(school) ? 0 : 1;
}

function schoolUserOwnsProfile(auth, schoolId) {
  return auth?.profile?.role === 'school_user' && auth.profile.school_id === schoolId;
}

function userIsAdmin(auth) {
  return auth?.profile?.role === 'admin';
}

function examFeaturedRank(exam) {
  const school = window.getSchool(exam.schoolId);
  return (isFeaturedSchool(school) || exam.isFeatured) ? 0 : 1;
}

function packageLabel(type) {
  return type === 'featured_school' ? 'Öne Çıkan Okul Paketi' : 'Profil Yönetimi Paketi';
}

function requestStatusLabel(status) {
  return {
    pending: 'İncelemede',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    expired: 'Süresi Doldu',
  }[status] || status;
}

function packageStatusLabel(status) {
  return {
    active: 'Aktif',
    inactive: 'Pasif',
    expired: 'Süresi Doldu',
  }[status] || status;
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function uniquePackageRequests(rows) {
  const statusOrder = { pending: 0, approved: 1, rejected: 2, expired: 3 };
  const sorted = [...(rows || [])].sort((a, b) =>
    (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) ||
    new Date(b.created_at) - new Date(a.created_at)
  );
  const seen = new Set();
  return sorted.filter(row => {
    const key = row.school_id + ':' + row.package_type + ':' + row.status;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Link yardımcıları ──────────────────────────────────────────────────────
const SAFE_PROTOCOLS = /^(https?:\/\/|mailto:|tel:|maps:)/i;

function normalizeWebUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'https://' + trimmed;
}

function normalizePhoneUrl(phone) {
  if (!phone) return null;
  return 'tel:' + phone.replace(/\s+/g, '');
}

function normalizeInstagramUrl(handle) {
  if (!handle) return null;
  const trimmed = handle.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'https://www.instagram.com/' + trimmed.replace(/^@/, '');
}

function openLink(url) {
  if (!url) return;
  if (!SAFE_PROTOCOLS.test(url)) {
    alert('Bu link güvenli bir protokol içermiyor ve açılamıyor.');
    return;
  }
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) alert('Link açılamadı. Lütfen tarayıcı pop-up engelleyicisini kontrol edin.');
}

function HomeScreen({ go, fav, rem, toggleFav, toggleRem }) {
  const [district, setDistrict] = useS('Tümü');
  const [grade, setGrade] = useS('Tümü');
  const [sheet, setSheet] = useS(null);

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = window.EXAMS.filter(e => {
    const d = new Date(e.examDate); d.setHours(0,0,0,0);
    return d >= today && e.status !== 'closed' && (district === 'Tümü' || e.district === district);
  }).sort((a,b) => examFeaturedRank(a) - examFeaturedRank(b) || new Date(a.examDate) - new Date(b.examDate));

  const featured = window.EXAMS
    .filter(e => (e.isFeatured || isFeaturedSchool(window.getSchool(e.schoolId))) && e.status === 'open')
    .sort((a,b) => examFeaturedRank(a) - examFeaturedRank(b) || new Date(a.examDate) - new Date(b.examDate));

  // Öne çıkan okullar — doğrulanmış + açık sınavı olanlar; açık sınav sayısına göre sıralı
  const featuredSchools = window.SCHOOLS
    .filter(s => s.verified)
    .map(s => {
      const exams = window.getExamsBySchool(s.id);
      return { school: s, exams, openCount: exams.filter(e => e.status === 'open').length, totalCount: exams.length };
    })
    .filter(x => isFeaturedSchool(x.school) || x.openCount > 0)
    .sort((a, b) => schoolFeaturedRank(a.school) - schoolFeaturedRank(b.school) || b.openCount - a.openCount)
    .slice(0, 3);

  // Okul kayıt dönemleri — açık olanlar önce, sonra yaklaşanlar
  const regSchools = window.SCHOOLS
    .map(s => ({ school: s, reg: window.registrationStatus(s) }))
    .filter(x => x.reg && x.reg.state !== 'closed')
    .sort((a, b) => {
      const featuredOrder = schoolFeaturedRank(a.school) - schoolFeaturedRank(b.school);
      if (featuredOrder !== 0) return featuredOrder;
      const order = { open: 0, upcoming: 1 };
      if (order[a.reg.state] !== order[b.reg.state]) return order[a.reg.state] - order[b.reg.state];
      return window.daysUntil(a.school.registrationDeadline) - window.daysUntil(b.school.registrationDeadline);
    });

  const trustItems = [
    { cls: 'verified', label: 'Resmi Doğrulandı', desc: 'Okul web sitesi veya yetkili kaynaktan doğrulanmış sınav bilgisi.', icon: 'check' },
    { cls: 'pending', label: 'Kontrol Bekliyor', desc: 'Sosyal medya veya çeşitli kaynaklardan derlendi, doğrulama sürecinde.', icon: 'clock' },
    { cls: 'outdated', label: 'Eski Olabilir', desc: '15 günden uzun süredir güncellenmeyen veriler. Okuldan doğrulayın.', icon: 'refresh' },
  ];

  return (
    <div className="page-enter">
      <div className="hero">
        <div className="radar-bg">
          <div className="radar-sweep" />
          <div className="radar-blip" style={{ left: '30%', top: '40%' }} />
          <div className="radar-blip" style={{ left: '65%', top: '60%' }} />
          <div className="radar-blip" style={{ left: '50%', top: '25%' }} />
        </div>
        <div className="hero-bell" onClick={() => go('plan')}><Icon name="bell" /></div>
        <div className="logo-row">
          <div className="logo-box"><img src="assets/logo.png" alt="BursRadar" /></div>
          <div>
            <div className="app-name">BursRadar</div>
            <div className="app-tagline">İzmir · Özel Okul Burs Platformu</div>
          </div>
        </div>
        <div className="hero-title">Burs sınavlarını<br/>kaçırma.</div>
        <div className="hero-sub">İzmir'de ilçe ve sınıf seviyene göre yaklaşan bursluluk sınavlarını tek yerden takip et.</div>
      </div>

      <div className="filter-card">
        <div className="filter-title">Sınavları Bul</div>
        <div className="dropdown-row" onClick={() => setSheet('district')}>
          <div className="dropdown-label"><Icon name="pin" /> İlçe</div>
          <div className="dropdown-value">{district}<span className="chev">▾</span></div>
        </div>
        <div className="filter-sep" />
        <div className="dropdown-row" onClick={() => setSheet('grade')}>
          <div className="dropdown-label"><Icon name="cap" /> Sınıf</div>
          <div className="dropdown-value">{grade}<span className="chev">▾</span></div>
        </div>
        <button className="search-btn" onClick={() => go('exams', { district, grade })}>
          <Icon name="search" /> Sınavları Göster
        </button>
      </div>

      <div className="section-head">
        <div>
          <div className="section-title"><Icon name="clock" /> Yaklaşan Sınavlar</div>
          <div className="section-sub">{upcoming.length} sınav · 30 gün</div>
        </div>
        <div className="section-link" onClick={() => go('exams')}>Tümü →</div>
      </div>
      <div className="h-scroll">
        {upcoming.slice(0, 6).map(e => (
          <ExamCard key={e.id} exam={e} compact onOpen={id => go('exam', { id })}
                    fav={fav.includes(e.id)} rem={rem.includes(e.id)}
                    onFav={toggleFav} onRem={toggleRem} />
        ))}
      </div>

      <div style={{ height: 24 }} />
      <div className="section-head">
        <div>
          <div className="section-title"><Icon name="calendar" /> Okul Kayıt Dönemleri</div>
          <div className="section-sub">{regSchools.filter(x => x.reg.state === 'open').length} açık · {regSchools.filter(x => x.reg.state === 'upcoming').length} yakında</div>
        </div>
        <div className="section-link" onClick={() => go('schools')}>Tümü →</div>
      </div>
      <div className="h-scroll">
        {regSchools.slice(0, 6).map(({ school, reg }) => {
          const dEnd = window.daysUntil(school.registrationDeadline);
          const dStart = window.daysUntil(school.registrationStartDate);
          const total = window.daysUntil(school.registrationDeadline) - window.daysUntil(school.registrationStartDate);
          const pct = reg.state === 'upcoming' ? 0
            : reg.state === 'closed' ? 100
            : Math.min(100, Math.max(6, ((Math.abs(dStart) || 0) / Math.max(1, total + Math.abs(dStart))) * 100));
          return (
            <div key={school.id} className={'reg-mini reg-mini-' + reg.state} onClick={() => go('school', { id: school.id })}>
              <div className="reg-mini-head">
                <SchoolLogo school={school} size={40} />
                <div className="reg-mini-headtext">
                  <div className="reg-mini-name">{school.name}</div>
                  <div className="reg-mini-meta">
                    <Icon name="pin" style={{ width: 10, height: 10 }} /> {school.district}
                  </div>
                </div>
              </div>

              <div className={'reg-mini-status reg-' + reg.state}>
                <span className="reg-dot" />
                <span className="reg-mini-status-label">{reg.label}</span>
                <span className="reg-mini-status-days">
                  {reg.state === 'open'
                    ? (dEnd === 0 ? 'son gün' : dEnd + ' gün')
                    : reg.state === 'upcoming'
                      ? (dStart === 0 ? 'bugün' : dStart + ' gün')
                      : ''}
                </span>
              </div>

              <div className="reg-mini-track">
                <div className="reg-mini-track-fill" style={{ width: pct + '%' }} />
                <div className="reg-mini-marker" style={{ left: pct + '%' }} />
              </div>

              <div className="reg-mini-dates">
                <div className="reg-mini-date">
                  <div className="reg-mini-date-key">Başvuru</div>
                  <div className="reg-mini-date-val">{window.formatDate(school.registrationStartDate)}</div>
                </div>
                <div className="reg-mini-date reg-mini-date-end">
                  <div className="reg-mini-date-key">Son Kayıt</div>
                  <div className="reg-mini-date-val">{window.formatDate(school.registrationDeadline)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 24 }} />
      <div className="section-head">
        <div>
          <div className="section-title"><Icon name="star" /> Öne Çıkan Okullar</div>
          <div className="section-sub">Editör seçimi · Doğrulanmış</div>
        </div>
        <div className="section-link" onClick={() => go('schools')}>Tümü →</div>
      </div>
      <div className="featured-schools">
        {featuredSchools.map(({ school, openCount, totalCount }) => {
          const reg = window.registrationStatus(school);
          return (
            <div key={school.id} className="featured-school" onClick={() => go('school', { id: school.id })}>
              <div className="featured-school-cover" style={{ background: school.heroColor || school.logoColor }}>
                {school.profileImageUrl ? (
                  <div className="featured-school-logo">
                    <img src={school.profileImageUrl} alt="" />
                  </div>
                ) : (
                  <div className="featured-school-monogram">{window.schoolInitials(school.name)}</div>
                )}
                <div className="featured-school-verify">
                  <Icon name="check" /> Doğrulanmış
                </div>
              </div>
              <div className="featured-school-body">
                <div className="featured-school-name">{school.name}</div>
                <div className="featured-school-meta">
                  <Icon name="pin" style={{ width: 11, height: 11 }} /> {school.district} · İzmir
                </div>
                {school.description && <div className="featured-school-desc">{school.description}</div>}
                <div className="featured-school-stats">
                  <div className="fs-stat">
                    <div className="fs-stat-num">{openCount}</div>
                    <div className="fs-stat-lbl">Açık Sınav</div>
                  </div>
                  <div className="fs-stat-divider" />
                  <div className="fs-stat">
                    <div className="fs-stat-num">{totalCount}</div>
                    <div className="fs-stat-lbl">Toplam</div>
                  </div>
                  {reg && reg.state !== 'closed' && (
                    <>
                      <div className="fs-stat-divider" />
                      <div className={'fs-stat fs-stat-reg fs-' + reg.state}>
                        <div className="fs-stat-num"><span className="fs-dot" />{reg.state === 'open' ? 'Kayıt' : 'Yakında'}</div>
                        <div className="fs-stat-lbl">{reg.state === 'open' ? 'Açık' : window.formatDate(school.registrationStartDate)}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 16 }} />
      <div className="trust-card">
        <div className="trust-title"><Icon name="shield" /> Veri Güven Sistemi</div>
        <div className="trust-sub">BursRadar'daki her sınav bilgisi kaynağı belirtilmiş ve doğrulama durumu işaretlenmiştir.</div>
        {trustItems.map(it => (
          <div key={it.label} className={'trust-item ' + it.cls}>
            <div className="icon"><Icon name={it.icon} /></div>
            <div style={{ flex: 1 }}>
              <div className="trust-item-title">{it.label}</div>
              <div className="trust-item-desc">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="stats-banner">
        <div className="stat-item"><div className="stat-value">{window.SCHOOLS.length}</div><div className="stat-label">Okul</div></div>
        <div className="stat-divider" />
        <div className="stat-item"><div className="stat-value">{window.EXAMS.length}</div><div className="stat-label">Sınav</div></div>
        <div className="stat-divider" />
        <div className="stat-item"><div className="stat-value">{window.IZMIR_DISTRICTS.length - 1}</div><div className="stat-label">İlçe</div></div>
        <div className="stat-divider" />
        <div className="stat-item"><div className="stat-value">İzmir</div><div className="stat-label">Şehir</div></div>
      </div>

      <SelectSheet open={sheet === 'district'} title="İlçe Seç" options={window.IZMIR_DISTRICTS}
                   value={district} onSelect={setDistrict} onClose={() => setSheet(null)} />
      <SelectSheet open={sheet === 'grade'} title="Sınıf Seç" options={window.GRADES}
                   value={grade} onSelect={setGrade} onClose={() => setSheet(null)} />
    </div>
  );
}

function ExamsScreen({ go, params, fav, rem, toggleFav, toggleRem }) {
  const [district, setDistrict] = useS(params?.district || 'Tümü');
  const [grade, setGrade] = useS(params?.grade || 'Tümü');
  const [onlyOpen, setOnlyOpen] = useS(false);
  const [sheet, setSheet] = useS(null);

  const filtered = window.EXAMS.filter(e => {
    if (district !== 'Tümü' && e.district !== district) return false;
    if (grade !== 'Tümü' && !e.eligibleGrades.includes(grade)) return false;
    if (onlyOpen && e.status !== 'open') return false;
    return true;
  }).sort((a,b) => {
    const featuredOrder = examFeaturedRank(a) - examFeaturedRank(b);
    if (featuredOrder !== 0) return featuredOrder;
    if (a.status === 'closed' && b.status !== 'closed') return 1;
    if (b.status === 'closed' && a.status !== 'closed') return -1;
    return new Date(a.examDate) - new Date(b.examDate);
  });

  const open = filtered.filter(e => e.status === 'open').length;
  const upcoming = filtered.filter(e => e.status === 'upcoming').length;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Sınavlar</div>
          <div className="page-sub">İzmir Özel Okul Burs Sınavları</div>
        </div>
        <div className="icon-btn" onClick={() => setSheet('filter')}><Icon name="sliders" /></div>
      </div>

      <div className="chip-row">
        <button className={'chip ' + (district === 'Tümü' ? 'on' : '')} onClick={() => setSheet('district')}>
          📍 {district === 'Tümü' ? 'Tüm İlçeler' : district} ▾
        </button>
        <button className={'chip ' + (grade === 'Tümü' ? '' : 'on')} onClick={() => setSheet('grade')}>
          🎓 {grade === 'Tümü' ? 'Tüm Sınıflar' : grade} ▾
        </button>
        <button className={'chip ' + (onlyOpen ? 'on' : '')} onClick={() => setOnlyOpen(v => !v)}>
          {onlyOpen ? '✓ ' : ''}Sadece Açık
        </button>
      </div>

      <div className="strip">
        <div className="strip-item"><div className="strip-value">{filtered.length}</div><div className="strip-label">Toplam</div></div>
        <div className="strip-divider" />
        <div className="strip-item"><div className="strip-value" style={{ color: 'var(--success)' }}>{open}</div><div className="strip-label">Başvuruya Açık</div></div>
        <div className="strip-divider" />
        <div className="strip-item"><div className="strip-value" style={{ color: 'var(--info)' }}>{upcoming}</div><div className="strip-label">Yakında</div></div>
      </div>

      <div className="exam-card-list" style={{ paddingTop: 14 }}>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Icon name="search" /></div>
            <div className="empty-title">Sınav Bulunamadı</div>
            <div className="empty-sub">Seçtiğin filtrelere uygun sınav yok. Farklı ilçe veya sınıf dene.</div>
          </div>
        ) : filtered.map(e => (
          <ExamCard key={e.id} exam={e} onOpen={id => go('exam', { id })}
                    fav={fav.includes(e.id)} rem={rem.includes(e.id)}
                    onFav={toggleFav} onRem={toggleRem} />
        ))}
      </div>

      <SelectSheet open={sheet === 'district'} title="İlçe Seç" options={window.IZMIR_DISTRICTS}
                   value={district} onSelect={setDistrict} onClose={() => setSheet(null)} />
      <SelectSheet open={sheet === 'grade'} title="Sınıf Seç" options={window.GRADES}
                   value={grade} onSelect={setGrade} onClose={() => setSheet(null)} />
    </div>
  );
}

function PlanScreen({ go, fav, rem, toggleFav, toggleRem }) {
  const [tab, setTab] = useS('reminders');
  const list = tab === 'favorites' ? fav : rem;
  const exams = list.map(id => window.getExam(id)).filter(Boolean)
    .sort((a,b) => new Date(a.examDate) - new Date(b.examDate));
  const remCount = rem.filter(id => window.getExam(id)).length;
  const favCount = fav.filter(id => window.getExam(id)).length;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Planım</div>
          <div className="page-sub">Hatırlatmalar ve favori sınavlar</div>
        </div>
        <div className="icon-btn" onClick={() => go('exams')}><Icon name="plus" /></div>
      </div>

      <div className="plan-tabs">
        <button className={'plan-tab ' + (tab === 'reminders' ? 'on' : '')} onClick={() => setTab('reminders')}>
          <span>🔔 Hatırlatmalar</span>
          <span className="count">{remCount}</span>
        </button>
        <button className={'plan-tab ' + (tab === 'favorites' ? 'on' : '')} onClick={() => setTab('favorites')}>
          <span>❤ Favoriler</span>
          <span className="count">{favCount}</span>
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><Icon name={tab === 'reminders' ? 'bell' : 'heart'} /></div>
          <div className="empty-title">{tab === 'reminders' ? 'Henüz hatırlatma yok' : 'Henüz favori yok'}</div>
          <div className="empty-sub">
            Sınavlar listesinden {tab === 'reminders' ? 'çan ikonuna' : 'kalp ikonuna'} dokunarak {tab === 'reminders' ? 'hatırlatma kur' : 'favorilere ekle'}.
          </div>
        </div>
      ) : (
        <div className="exam-card-list" style={{ paddingTop: 14 }}>
          {exams.map(e => (
            <ExamCard key={e.id} exam={e} onOpen={id => go('exam', { id })}
                      fav={fav.includes(e.id)} rem={rem.includes(e.id)}
                      onFav={toggleFav} onRem={toggleRem} />
          ))}
        </div>
      )}
    </div>
  );
}

function SchoolsScreen({ go }) {
  const [search, setSearch] = useS('');
  const [district, setDistrict] = useS('Tümü');

  const filtered = window.SCHOOLS.filter(s => {
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.district.toLowerCase().includes(search.toLowerCase());
    const md = district === 'Tümü' || s.district === district;
    return ms && md;
  }).sort((a, b) => schoolFeaturedRank(a) - schoolFeaturedRank(b) || a.name.localeCompare(b.name, 'tr'));
  const verified = window.SCHOOLS.filter(s => s.verified).length;

  const districts = ['Tümü', ...new Set(window.SCHOOLS.map(s => s.district))];

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Okullar</div>
          <div className="page-sub">{window.SCHOOLS.length} okul · {verified} doğrulanmış</div>
        </div>
      </div>
      <div className="search-bar">
        <Icon name="search" />
        <input placeholder="Okul veya ilçe ara..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="chip-row">
        {districts.map(d => (
          <button key={d} className={'chip ' + (district === d ? 'on' : '')} onClick={() => setDistrict(d)}>{d}</button>
        ))}
      </div>
      <div style={{ padding: '14px 16px 4px' }}>
        {filtered.map(s => <SchoolCard key={s.id} school={s} variant={isFeaturedSchool(s) ? 'featured' : 'standard'} onOpen={id => go('school', { id })} />)}
      </div>
    </div>
  );
}

function SchoolPackagesPanel({ school, auth, forceManage = false, adminMode = false, onSchoolUpdated, realtimeVersion = 0 }) {
  const [packages, setPackages] = useS([]);
  const [requests, setRequests] = useS([]);
  const [loading, setLoading] = useS(true);
  const [sending, setSending] = useS(null);
  const [message, setMessage] = useS('');
  const [error, setError] = useS('');
  const [editMessage, setEditMessage] = useS('');
  const [editError, setEditError] = useS('');
  const [savingProfile, setSavingProfile] = useS(false);
  const [uploadingImage, setUploadingImage] = useS(false);
  const [examFormOpen, setExamFormOpen] = useS(false);
  const [examMessage, setExamMessage] = useS('');
  const [examError, setExamError] = useS('');
  const [examRefreshKey, setExamRefreshKey] = useS(0);
  const [examForm, setExamForm] = useS({
    examName: '',
    examDate: '',
    applicationStartDate: '',
    applicationDeadline: '',
    eligibleGrades: '4. Sınıf, 5. Sınıf',
    examLocation: '',
    applicationUrl: '',
    notes: '',
  });
  const [profileForm, setProfileForm] = useS({
    description: school.description || '',
    phone: school.phone || '',
    website: school.website || '',
    instagram: school.instagram || '',
    campus: school.campus || '',
    registrationStartDate: school.registrationStartDate || '',
    registrationDeadline: school.registrationDeadline || '',
    heroColor: school.heroColor || school.logoColor || '#DB2777',
  });

  useE(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    Promise.all([
      auth.getSchoolPackages(school.id),
      auth.getSchoolPackageRequests(school.id),
    ])
      .then(([packageRows, requestRows]) => {
        if (!mounted) return;
        setPackages(packageRows || []);
        setRequests(uniquePackageRequests(requestRows || []));
      })
      .catch(() => {
        if (mounted) setError('Paket bilgileri şu anda yüklenemedi.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [school.id, auth.user?.id, realtimeVersion]);

  async function requestPackage(pkg) {
    setSending(pkg.type);
    setMessage('');
    setError('');
    try {
      await auth.createPackageRequest({
        schoolId: school.id,
        packageType: pkg.type,
        price: pkg.price,
        note: school.name + ' icin ' + pkg.name + ' talebi',
      });
      setMessage('Talebiniz alındı. Bilgilendirme maili BursRadar ekibine gönderildi.');
      const nextRequests = await auth.getSchoolPackageRequests(school.id);
      setRequests(uniquePackageRequests(nextRequests || []));
    } catch (err) {
      setError(err?.requestSaved
        ? 'Talep kaydedildi ancak mail bildirimi gönderilemedi: ' + err.message
        : 'Talep oluşturulamadı. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setSending(null);
    }
  }

  function activeStatus(pkg) {
    return packages.find(row => row.package_type === pkg.type && row.status === 'active');
  }

  const canManageProfile = forceManage || packages.some(row =>
    row.status === 'active' && ['profile_management', 'featured_school'].includes(row.package_type)
  );
  const canCustomizeProfileTheme = forceManage || packages.some(row =>
    row.status === 'active' && row.package_type === 'featured_school'
  );
  const canUploadProfileImage = canManageProfile;
  const canCreateExam = canManageProfile;
  const managedExams = window.getExamsBySchool(school.id)
    .sort((a, b) => new Date(a.examDate || 0) - new Date(b.examDate || 0));

  function latestRequest(pkg) {
    return requests.find(row => row.package_type === pkg.type);
  }

  function updateProfileField(key, value) {
    setProfileForm(current => ({ ...current, [key]: value }));
  }

  function updateExamField(key, value) {
    setExamForm(current => ({ ...current, [key]: value }));
  }

  async function handleProfileImageChange(event) {
    const file = event.target.files?.[0];
    if (!file || !canUploadProfileImage) return;
    setUploadingImage(true);
    setEditMessage('');
    setEditError('');
    try {
      const updated = await auth.uploadSchoolLogo(school.id, file);
      if (updated) {
        Object.assign(school, updated);
        window.SCHOOLS = window.SCHOOLS.map(item => item.id === school.id ? { ...item, ...updated } : item);
        onSchoolUpdated?.(updated);
      }
      setEditMessage('Profil görseli yüklendi.');
    } catch (err) {
      setEditError(err?.message || 'Profil görseli yüklenemedi.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  }

  async function createExam(event) {
    event.preventDefault();
    setExamMessage('');
    setExamError('');
    if (!canCreateExam) return;
    if (!examForm.examName || !examForm.examDate || !examForm.applicationDeadline) {
      setExamError('Sınav adı, sınav tarihi ve son başvuru tarihi zorunludur.');
      return;
    }

    setSending('create-exam');
    try {
      const exam = await auth.createSchoolExam(school.id, {
        ...examForm,
        eligibleGrades: examForm.eligibleGrades.split(',').map(item => item.trim()).filter(Boolean),
      });
      if (exam) window.EXAMS = [exam, ...window.EXAMS.filter(item => item.id !== exam.id)];
      setExamRefreshKey(key => key + 1);
      setExamMessage('Sınav eklendi. Yayın öncesi kontrol durumunda kaydedildi.');
      setExamForm({
        examName: '',
        examDate: '',
        applicationStartDate: '',
        applicationDeadline: '',
        eligibleGrades: '4. Sınıf, 5. Sınıf',
        examLocation: '',
        applicationUrl: '',
        notes: '',
      });
      setExamFormOpen(false);
    } catch (err) {
      setExamError(err?.message || 'Sınav kaydedilemedi.');
    } finally {
      setSending(null);
    }
  }

  async function deleteExam(exam) {
    setExamMessage('');
    setExamError('');
    setSending('delete-exam:' + exam.id);
    try {
      await auth.deleteSchoolExam(exam.id);
      window.EXAMS = window.EXAMS.filter(item => item.id !== exam.id);
      setExamRefreshKey(key => key + 1);
      setExamMessage('Sınav kaldırıldı.');
    } catch (err) {
      setExamError(err?.message || 'Sınav kaldırılamadı.');
    } finally {
      setSending(null);
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    setEditMessage('');
    setEditError('');
    try {
      const values = canCustomizeProfileTheme
        ? profileForm
        : (({ heroColor, ...rest }) => rest)(profileForm);
      const updated = await auth.updateSchoolProfile(school.id, values);
      if (updated) {
        Object.assign(school, updated);
        window.SCHOOLS = window.SCHOOLS.map(item => item.id === school.id ? { ...item, ...updated } : item);
        onSchoolUpdated?.(updated);
      }
      setEditMessage('Okul profil bilgileri güncellendi.');
    } catch (err) {
      setEditError(err?.message || 'Profil bilgileri güncellenemedi.');
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="package-panel">
      <div className="package-panel-head">
        <div>
          <div className="package-title">{adminMode ? 'Okul Yönetimi' : 'Okul Profilinizi Güçlendirin'}</div>
          <div className="package-sub">{adminMode ? 'Admin yetkisiyle okul profilini, görselini ve bursluluk sınavlarını yönetebilirsiniz.' : 'BursRadar’da okul profilinizi yönetebilir, kayıt ve bursluluk sınavı bilgilerinizi ailelere daha görünür şekilde sunabilirsiniz.'}</div>
        </div>
      </div>

      {loading && <div className="package-state">Paket durumu kontrol ediliyor...</div>}
      {error && <div className="package-error">{error}</div>}
      {message && <div className="package-message">{message}</div>}

      {!adminMode && <div className="package-grid">
        {SCHOOL_PACKAGE_DEFINITIONS.map(pkg => {
          const active = activeStatus(pkg);
          const request = latestRequest(pkg);
          const pending = request?.status === 'pending';
          const rejected = request?.status === 'rejected';
          const approved = request?.status === 'approved';
          return (
            <div key={pkg.type} className={'package-card ' + pkg.tone}>
              <div className="package-card-top">
                <div>
                  <div className="package-name">{pkg.name}</div>
                  <div className="package-price">{pkg.price.toLocaleString('tr-TR')} TL</div>
                </div>
                {active && <div className="package-status active">Aktif</div>}
              </div>
              {pending && <div className="package-status-line pending">Talebiniz inceleniyor.</div>}
              {approved && !active && <div className="package-status-line approved">Talebiniz onaylandı. Paket aktivasyonu kontrol ediliyor.</div>}
              {rejected && <div className="package-status-line rejected">Talebiniz reddedildi.{request.admin_note ? ' Not: ' + request.admin_note : ''}</div>}
              <ul className="package-features">
                {pkg.features.map(feature => <li key={feature}>{feature}</li>)}
              </ul>
              <button className="package-request" disabled={!!sending || !!active || pending} onClick={() => requestPackage(pkg)}>
                {active ? 'Paket Aktif' : pending ? 'Talep İncelemede' : sending === pkg.type ? 'Gönderiliyor...' : 'Paket Talebi Gönder'}
              </button>
            </div>
          );
        })}
      </div>}

      {canManageProfile && (
        <div className="school-edit-panel">
          <div className="school-edit-title">Profil Düzenleme Paneli</div>
          {canUploadProfileImage && (
            <div className="profile-image-editor">
              <SchoolLogo school={school} size={64} />
              <div>
                <label className="profile-image-label">
                  {uploadingImage ? 'Yükleniyor...' : 'Profil resmi / logo yükle'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingImage} onChange={handleProfileImageChange} />
                </label>
                <div className="profile-image-help">PNG veya JPG logo seçebilirsiniz.</div>
              </div>
            </div>
          )}
          {canCustomizeProfileTheme && <div className="hero-color-control">
            <div>
              <label>Profil arka plan rengi</label>
              <div className="profile-image-help">Öne Çıkan Okul paketi ile profil üst alanında kullanılır.</div>
            </div>
            <input
              type="color"
              value={profileForm.heroColor || school.heroColor || school.logoColor || '#DB2777'}
              onChange={e => updateProfileField('heroColor', e.target.value)}
            />
          </div>}
          <label>Açıklama</label>
          <textarea value={profileForm.description} onChange={e => updateProfileField('description', e.target.value)} />
          <label>Telefon</label>
          <input value={profileForm.phone} onChange={e => updateProfileField('phone', e.target.value)} />
          <label>Web sitesi</label>
          <input value={profileForm.website} onChange={e => updateProfileField('website', e.target.value)} />
          <label>Instagram</label>
          <input value={profileForm.instagram} onChange={e => updateProfileField('instagram', e.target.value)} />
          <label>Kampüs</label>
          <input value={profileForm.campus} onChange={e => updateProfileField('campus', e.target.value)} />
          <div className="school-edit-row">
            <div>
              <label>Kayıt başlangıcı</label>
              <input type="date" value={profileForm.registrationStartDate} onChange={e => updateProfileField('registrationStartDate', e.target.value)} />
            </div>
            <div>
              <label>Son kayıt</label>
              <input type="date" value={profileForm.registrationDeadline} onChange={e => updateProfileField('registrationDeadline', e.target.value)} />
            </div>
          </div>
          {editError && <div className="package-error">{editError}</div>}
          {editMessage && <div className="package-message">{editMessage}</div>}
          <button className="package-request" disabled={savingProfile} onClick={saveProfile}>
            {savingProfile ? 'Kaydediliyor...' : 'Profili Kaydet'}
          </button>

          {canCreateExam && (
            <div className="exam-create-panel">
              <div className="school-edit-title">Bursluluk Sınavı</div>
              <button className="secondary-action" onClick={() => setExamFormOpen(open => !open)}>
                {examFormOpen ? 'Sınav Formunu Kapat' : 'Sınav Ekle'}
              </button>
              {examMessage && <div className="package-message">{examMessage}</div>}
              {examError && <div className="package-error">{examError}</div>}
              {examFormOpen && (
                <form onSubmit={createExam}>
                  <label>Sınav adı</label>
                  <input value={examForm.examName} onChange={e => updateExamField('examName', e.target.value)} />
                  <div className="school-edit-row">
                    <div>
                      <label>Sınav tarihi</label>
                      <input type="date" value={examForm.examDate} onChange={e => updateExamField('examDate', e.target.value)} />
                    </div>
                    <div>
                      <label>Son başvuru</label>
                      <input type="date" value={examForm.applicationDeadline} onChange={e => updateExamField('applicationDeadline', e.target.value)} />
                    </div>
                  </div>
                  <label>Başvuru başlangıcı</label>
                  <input type="date" value={examForm.applicationStartDate} onChange={e => updateExamField('applicationStartDate', e.target.value)} />
                  <label>Uygun sınıflar</label>
                  <input value={examForm.eligibleGrades} onChange={e => updateExamField('eligibleGrades', e.target.value)} />
                  <label>Sınav yeri</label>
                  <input value={examForm.examLocation} onChange={e => updateExamField('examLocation', e.target.value)} />
                  <label>Başvuru Linki</label>
                  <input type="url" placeholder="https://okulwebsitesi.com/basvuru" value={examForm.applicationUrl} onChange={e => updateExamField('applicationUrl', e.target.value)} />
                  <label>Not</label>
                  <textarea value={examForm.notes} onChange={e => updateExamField('notes', e.target.value)} />
                  <button className="package-request" disabled={sending === 'create-exam'} type="submit">
                    {sending === 'create-exam' ? 'Kaydediliyor...' : 'Sınavı Kaydet'}
                  </button>
                </form>
              )}
              <div className="managed-exam-list">
                <div className="managed-exam-title">Mevcut Sınavlar</div>
                {managedExams.length === 0 ? (
                  <div className="package-state">Bu okul için kayıtlı sınav yok.</div>
                ) : managedExams.map(exam => (
                  <div key={exam.id} className="managed-exam-row">
                    <div>
                      <div className="managed-exam-name">{exam.examName}</div>
                      <div className="managed-exam-meta">
                        {window.formatDate(exam.examDate)} · {exam.verificationStatus === 'verified' ? 'Yayında' : 'Kontrol bekliyor'}
                      </div>
                    </div>
                    <button disabled={!!sending} onClick={() => deleteExam(exam)}>
                      {sending === 'delete-exam:' + exam.id ? 'Kaldırılıyor...' : 'Kaldır'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminSchoolEditPanel({ school, auth }) {
  const [saving, setSaving] = useS(false);
  const [message, setMessage] = useS('');
  const [error, setError] = useS('');
  const [form, setForm] = useS({
    description: school.description || '',
    phone: school.phone || '',
    website: school.website || '',
    instagram: school.instagram || '',
    campus: school.campus || '',
    registrationStartDate: school.registrationStartDate || '',
    registrationDeadline: school.registrationDeadline || '',
  });

  function updateField(key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await auth.updateSchoolProfile(school.id, form);
      if (updated) {
        Object.assign(school, updated);
        window.SCHOOLS = window.SCHOOLS.map(item => item.id === school.id ? { ...item, ...updated } : item);
      }
      setMessage('Okul profili admin yetkisiyle güncellendi.');
    } catch (err) {
      setError(err?.message || 'Okul profili güncellenemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="school-edit-panel admin-school-edit-panel">
      <div className="school-edit-title"><Icon name="shield" /> Admin Okul Düzenleme</div>
      <label>Açıklama</label>
      <textarea value={form.description} onChange={e => updateField('description', e.target.value)} />
      <label>Telefon</label>
      <input value={form.phone} onChange={e => updateField('phone', e.target.value)} />
      <label>Web sitesi</label>
      <input value={form.website} onChange={e => updateField('website', e.target.value)} />
      <label>Instagram</label>
      <input value={form.instagram} onChange={e => updateField('instagram', e.target.value)} />
      <label>Kampüs</label>
      <input value={form.campus} onChange={e => updateField('campus', e.target.value)} />
      <div className="school-edit-row">
        <div>
          <label>Kayıt başlangıcı</label>
          <input type="date" value={form.registrationStartDate} onChange={e => updateField('registrationStartDate', e.target.value)} />
        </div>
        <div>
          <label>Son kayıt</label>
          <input type="date" value={form.registrationDeadline} onChange={e => updateField('registrationDeadline', e.target.value)} />
        </div>
      </div>
      {error && <div className="package-error">{error}</div>}
      {message && <div className="package-message">{message}</div>}
      <button className="package-request" disabled={saving} onClick={save}>
        {saving ? 'Kaydediliyor...' : 'Okul Profilini Kaydet'}
      </button>
    </div>
  );
}

function DataTrustCard({ school, exams }) {
  const profileInfo = trustInfo(school.trust);
  const registrationInfo = trustInfo(school.registrationTrust);
  const examRows = (exams || []).slice(0, 3);

  return (
    <div className="data-trust-card">
      <div className="data-trust-head">
        <div>
          <div className="data-trust-title">Veri Güven Sistemi</div>
          <div className="data-trust-sub">Bilgilerin doğrulama durumunu buradan takip edebilirsiniz.</div>
        </div>
        <VerifyTag status={profileInfo.value} />
      </div>
      <div className="trust-row">
        <div>
          <div className="trust-row-title">Okul profili</div>
          <div className="trust-row-text">{profileInfo.text}</div>
          <div className="trust-row-meta">Kaynak: {sourceLabel(school.trust?.source)}</div>
        </div>
        <VerifyTag status={profileInfo.value} />
      </div>
      {school.registrationDeadline && (
        <div className="trust-row">
          <div>
            <div className="trust-row-title">Kayıt tarihi</div>
            <div className="trust-row-text">{registrationInfo.text}</div>
            <div className="trust-row-meta">Kaynak: {sourceLabel(school.registrationTrust?.source)}</div>
          </div>
          <VerifyTag status={registrationInfo.value} />
        </div>
      )}
      {examRows.map(exam => {
        const examInfo = trustInfo({ status: exam.verificationStatus, lastCheckedAt: exam.lastCheckedAt });
        return (
          <div key={exam.id} className="trust-row">
            <div>
              <div className="trust-row-title">{exam.examName}</div>
              <div className="trust-row-text">{examInfo.text}</div>
              <div className="trust-row-meta">Kaynak: {sourceLabel(exam.verificationSource)}</div>
            </div>
            <VerifyTag status={examInfo.value} />
          </div>
        );
      })}
    </div>
  );
}

function TrustForm({ title, value, onSave, busy }) {
  const hasAppUrl = value && 'applicationUrl' in value;
  const [form, setForm] = useS({
    status: value?.status || 'pending_review',
    source: value?.source || 'unknown',
    verifiedAt: trustDateValue(value?.verifiedAt),
    lastCheckedAt: trustDateValue(value?.lastCheckedAt),
    adminNote: value?.adminNote || '',
    ...(hasAppUrl ? { applicationUrl: value.applicationUrl || '' } : {}),
  });

  useE(() => {
    setForm({
      status: value?.status || 'pending_review',
      source: value?.source || 'unknown',
      verifiedAt: trustDateValue(value?.verifiedAt),
      lastCheckedAt: trustDateValue(value?.lastCheckedAt),
      adminNote: value?.adminNote || '',
      ...(hasAppUrl ? { applicationUrl: value.applicationUrl || '' } : {}),
    });
  }, [value?.status, value?.source, value?.verifiedAt, value?.lastCheckedAt, value?.adminNote, value?.applicationUrl]);

  function update(key, nextValue) {
    setForm(current => ({ ...current, [key]: nextValue }));
  }

  return (
    <div className="trust-admin-form">
      <div className="trust-admin-title">{title}</div>
      <label>Durum</label>
      <select value={form.status} onChange={e => update('status', e.target.value)}>
        {TRUST_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <label>Kaynak</label>
      <select value={form.source} onChange={e => update('source', e.target.value)}>
        {TRUST_SOURCE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <div className="school-edit-row">
        <div>
          <label>Doğrulama tarihi</label>
          <input type="date" value={form.verifiedAt} onChange={e => update('verifiedAt', e.target.value)} />
        </div>
        <div>
          <label>Son kontrol</label>
          <input type="date" value={form.lastCheckedAt} onChange={e => update('lastCheckedAt', e.target.value)} />
        </div>
      </div>
      <label>Admin notu</label>
      <textarea value={form.adminNote} onChange={e => update('adminNote', e.target.value)} />
      {hasAppUrl && (
        <>
          <label>Başvuru Linki</label>
          <input type="url" placeholder="https://okulwebsitesi.com/basvuru" value={form.applicationUrl} onChange={e => update('applicationUrl', e.target.value)} />
        </>
      )}
      <button className="package-request" disabled={busy} onClick={() => onSave(form)}>
        {busy ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  );
}

function AdminDataTrustPanel({ school, exams, auth }) {
  const [message, setMessage] = useS('');
  const [error, setError] = useS('');
  const [busy, setBusy] = useS('');

  async function saveSchoolTrust(values) {
    setBusy('school');
    setMessage('');
    setError('');
    try {
      const updated = await auth.updateSchoolTrust(school.id, values);
      if (updated) {
        Object.assign(school, updated);
        window.SCHOOLS = window.SCHOOLS.map(item => item.id === school.id ? { ...item, ...updated } : item);
      }
      setMessage('Okul profili güven durumu kaydedildi.');
    } catch (err) {
      setError(err?.message || 'Okul güven durumu kaydedilemedi.');
    } finally {
      setBusy('');
    }
  }

  async function saveRegistrationTrust(values) {
    setBusy('registration');
    setMessage('');
    setError('');
    try {
      const updated = await auth.updateRegistrationTrust(school.id, values);
      if (updated) {
        Object.assign(school, updated);
        window.SCHOOLS = window.SCHOOLS.map(item => item.id === school.id ? { ...item, ...updated } : item);
      }
      setMessage('Kayıt tarihi güven durumu kaydedildi.');
    } catch (err) {
      setError(err?.message || 'Kayıt tarihi güven durumu kaydedilemedi.');
    } finally {
      setBusy('');
    }
  }

  async function saveExamTrust(exam, values) {
    setBusy('exam:' + exam.id);
    setMessage('');
    setError('');
    try {
      const updated = await auth.updateExamTrust(exam.id, values);
      if (updated) {
        window.EXAMS = window.EXAMS.map(item => item.id === exam.id ? { ...item, ...updated } : item);
        Object.assign(exam, updated);
      }
      setMessage('Sınav güven durumu kaydedildi.');
    } catch (err) {
      setError(err?.message || 'Sınav güven durumu kaydedilemedi.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="admin-package-panel">
      <div className="admin-package-title"><Icon name="shield" /> Veri Güven Yönetimi</div>
      {error && <div className="package-error">{error}</div>}
      {message && <div className="package-message">{message}</div>}
      <TrustForm title="Okul profili" value={school.trust} busy={busy === 'school'} onSave={saveSchoolTrust} />
      <TrustForm title="Kayıt tarihi" value={school.registrationTrust} busy={busy === 'registration'} onSave={saveRegistrationTrust} />
      {exams.map(exam => (
        <TrustForm
          key={exam.id}
          title={'Sınav: ' + exam.examName}
          value={{
            status: exam.verificationStatus,
            source: exam.verificationSource,
            verifiedAt: exam.verifiedAt,
            lastCheckedAt: exam.lastCheckedAt,
            adminNote: exam.verificationAdminNote,
            applicationUrl: exam.applicationUrl || '',
          }}
          busy={busy === 'exam:' + exam.id}
          onSave={values => saveExamTrust(exam, values)}
        />
      ))}
    </div>
  );
}

function AdminSchoolPackagePanel({ school, auth }) {
  const [packages, setPackages] = useS([]);
  const [loading, setLoading] = useS(true);

  useE(() => {
    let mounted = true;
    setLoading(true);
    auth.getSchoolPackages(school.id)
      .then(rows => { if (mounted) setPackages(rows || []); })
      .catch(() => { if (mounted) setPackages([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [school.id, auth.user?.id]);

  return (
    <div className="admin-package-panel">
      <div className="admin-package-title"><Icon name="shield" /> Admin Paket Durumu</div>
      {loading ? (
        <div className="package-state">Paketler kontrol ediliyor...</div>
      ) : packages.length === 0 ? (
        <div className="package-state">Bu okul için kayıtlı paket yok.</div>
      ) : (
        packages.map(pkg => (
          <div key={pkg.id} className="admin-package-row">
            <span>{pkg.package_type}</span>
            <strong>{pkg.status}</strong>
          </div>
        ))
      )}
    </div>
  );
}

function AdminPackagesScreen({ auth, realtimeVersion = 0 }) {
  const [requests, setRequests] = useS([]);
  const [packages, setPackages] = useS([]);
  const [schools, setSchools] = useS([]);
  const [loading, setLoading] = useS(true);
  const [error, setError] = useS('');
  const [message, setMessage] = useS('');
  const [notes, setNotes] = useS({});
  const [manual, setManual] = useS({ schoolId: '', packageType: 'profile_management', price: 1000, expiresAt: '' });
  const [roleSearchEmail, setRoleSearchEmail] = useS('');
  const [roleUser, setRoleUser] = useS(null);
  const [roleForm, setRoleForm] = useS({ role: 'user', schoolId: '' });
  const [expiry, setExpiry] = useS({});
  const [busy, setBusy] = useS(null);

  async function loadAdminData() {
    setLoading(true);
    setError('');
    try {
      const [requestRows, packageRows, schoolRows] = await Promise.all([
        auth.getAdminPackageRequests(),
        auth.getAdminSchoolPackages(),
        auth.getAdminSchools(),
      ]);
      setRequests(uniquePackageRequests(requestRows || []));
      setPackages(packageRows || []);
      setSchools(schoolRows || []);
      if (!manual.schoolId && schoolRows?.[0]?.id) {
        setManual(current => ({ ...current, schoolId: schoolRows[0].id }));
      }
    } catch (err) {
      setError(err?.message || 'Admin paket verileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useE(() => { loadAdminData(); }, [auth.user?.id, realtimeVersion]);

  async function approveRequest(request) {
    setBusy(request.id + ':approve');
    setMessage('');
    setError('');
    try {
      await auth.approvePackageRequest({ requestId: request.id, note: notes[request.id] || null });
      setMessage('Talep onaylandı ve paket aktif edildi.');
      await loadAdminData();
    } catch (err) {
      setError(err?.message || 'Talep onaylanamadı.');
    } finally {
      setBusy(null);
    }
  }

  async function rejectRequest(request) {
    setBusy(request.id + ':reject');
    setMessage('');
    setError('');
    try {
      await auth.rejectPackageRequest({ requestId: request.id, note: notes[request.id] || null });
      setMessage('Talep reddedildi.');
      await loadAdminData();
    } catch (err) {
      setError(err?.message || 'Talep reddedilemedi.');
    } finally {
      setBusy(null);
    }
  }

  async function deactivatePackage(pkg, status) {
    setBusy(pkg.id + ':' + status);
    setMessage('');
    setError('');
    try {
      await auth.deactivateSchoolPackage({ packageId: pkg.id, status });
      setMessage(status === 'expired' ? 'Paket süresi doldu olarak işaretlendi.' : 'Paket pasife alındı.');
      await loadAdminData();
    } catch (err) {
      setError(err?.message || 'Paket güncellenemedi.');
    } finally {
      setBusy(null);
    }
  }

  async function assignPackage() {
    setBusy('manual-package');
    setMessage('');
    setError('');
    try {
      await auth.assignSchoolPackage({
        schoolId: manual.schoolId,
        packageType: manual.packageType,
        price: Number(manual.price) || (manual.packageType === 'featured_school' ? 5000 : 1000),
        expiresAt: manual.expiresAt || null,
      });
      setMessage('Manuel paket aktif edildi.');
      await loadAdminData();
    } catch (err) {
      setError(err?.message || 'Manuel paket atanamadı.');
    } finally {
      setBusy(null);
    }
  }

  async function findUserForRoleManagement() {
    setBusy('find-user-role');
    setMessage('');
    setError('');
    if (!roleSearchEmail.trim()) {
      setError('E-posta alanı boş olamaz.');
      setBusy(null);
      return;
    }
    try {
      const rows = await auth.findAdminUserByEmail(roleSearchEmail.trim());
      const user = rows?.[0] || null;
      if (!user) {
        setRoleUser(null);
        setError('Bu e-posta ile kayıtlı kullanıcı bulunamadı.');
        return;
      }
      setRoleUser(user);
      setRoleForm({
        role: user.role || 'user',
        schoolId: user.school_id || schools[0]?.id || '',
      });
    } catch (err) {
      setError(err?.message || 'Kullanıcı aranamadı.');
    } finally {
      setBusy(null);
    }
  }

  async function saveUserRole() {
    setBusy('save-user-role');
    setMessage('');
    setError('');
    if (!roleUser?.email) {
      setError('Önce bir kullanıcı bulun.');
      setBusy(null);
      return;
    }
    if (roleForm.role === 'school_user' && !roleForm.schoolId) {
      setError('School user rolü için okul seçimi zorunludur.');
      setBusy(null);
      return;
    }
    if (roleUser.email === auth.user?.email && roleForm.role !== 'admin') {
      setError('Kendi admin hesabınızı user veya school_user rolüne düşüremezsiniz.');
      setBusy(null);
      return;
    }
    if (roleForm.role === 'admin' && roleUser.role !== 'admin') {
      const ok = window.confirm(roleUser.email + ' kullanıcısına admin yetkisi verilecek. Devam edilsin mi?');
      if (!ok) {
        setBusy(null);
        return;
      }
    }
    try {
      const rows = await auth.updateAdminUserRole({
        email: roleUser.email,
        role: roleForm.role,
        schoolId: roleForm.role === 'school_user' ? roleForm.schoolId : null,
      });
      const updated = rows?.[0] || null;
      if (updated) {
        setRoleUser(updated);
        setRoleForm({ role: updated.role, schoolId: updated.school_id || schools[0]?.id || '' });
      }
      setMessage('Kullanıcı rolü güncellendi.');
    } catch (err) {
      setError(err?.message || 'Kullanıcı rolü güncellenemedi.');
    } finally {
      setBusy(null);
    }
  }

  async function updatePackageExpiry(pkg) {
    setBusy(pkg.id + ':expiry');
    setMessage('');
    setError('');
    try {
      await auth.updateSchoolPackageExpiry({ packageId: pkg.id, expiresAt: expiry[pkg.id] || null });
      setMessage('Paket bitiş tarihi güncellendi.');
      await loadAdminData();
    } catch (err) {
      setError(err?.message || 'Paket bitiş tarihi güncellenemedi.');
    } finally {
      setBusy(null);
    }
  }

  const activePackages = packages.filter(pkg => pkg.status === 'active');

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Admin</div>
          <div className="page-sub">Paket talepleri ve aktif paketler</div>
        </div>
      </div>

      {loading && <div className="package-state" style={{ margin: '0 16px 12px' }}>Admin verileri yükleniyor...</div>}
      {error && <div className="package-error" style={{ margin: '0 16px 12px' }}>{error}</div>}
      {message && <div className="package-message" style={{ margin: '0 16px 12px' }}>{message}</div>}

      <div className="admin-section">
        <div className="admin-section-title">Kullanıcı Rol Yönetimi</div>
        <div className="admin-request-card">
          <div className="admin-request-school">E-posta ile kullanıcı bul</div>
          <div className="admin-role-search">
            <input
              type="email"
              placeholder="kullanici@ornek.com"
              value={roleSearchEmail}
              onChange={e => setRoleSearchEmail(e.target.value)}
            />
            <button className="admin-expire" disabled={!!busy} onClick={findUserForRoleManagement}>
              {busy === 'find-user-role' ? 'Aranıyor...' : 'Kullanıcıyı Bul'}
            </button>
          </div>

          {roleUser && (
            <div className="admin-role-result">
              <div className="admin-role-summary">
                <div><strong>Email</strong><span>{roleUser.email}</span></div>
                <div><strong>Mevcut rol</strong><span>{roleUser.role || 'user'}</span></div>
                <div><strong>Bağlı okul</strong><span>{roleUser.school_name || roleUser.school_id || 'Yok'}</span></div>
              </div>
              <div className="admin-manual-grid">
                <select value={roleForm.role} onChange={e => setRoleForm(v => ({ ...v, role: e.target.value }))}>
                  <option value="user">user</option>
                  <option value="school_user">school_user</option>
                  <option value="admin">admin</option>
                </select>
                <select
                  value={roleForm.schoolId}
                  disabled={roleForm.role !== 'school_user'}
                  onChange={e => setRoleForm(v => ({ ...v, schoolId: e.target.value }))}
                >
                  <option value="">Okul seçin</option>
                  {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                </select>
              </div>
              <button className="package-request" disabled={!!busy} onClick={saveUserRole}>
                {busy === 'save-user-role' ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Paket Talepleri</div>
        {requests.length === 0 ? (
          <div className="package-state">Henüz paket talebi yok.</div>
        ) : requests.map(request => (
          <div key={request.id} className={'admin-request-card ' + request.status}>
            <div className="admin-request-head">
              <div>
                <div className="admin-request-school">{request.schools?.name || request.school_id}</div>
                <div className="admin-request-meta">{packageLabel(request.package_type)} · {request.price.toLocaleString('tr-TR')} TL · {formatDateTime(request.created_at)}</div>
              </div>
              <span className={'admin-status ' + request.status}>{requestStatusLabel(request.status)}</span>
            </div>
            {request.admin_note && <div className="admin-note-view">Admin notu: {request.admin_note}</div>}
            {request.status === 'pending' && (
              <>
                <textarea className="admin-note-input" placeholder="Admin notu" value={notes[request.id] || ''} onChange={e => setNotes(v => ({ ...v, [request.id]: e.target.value }))} />
                <div className="admin-actions">
                  <button className="admin-approve" disabled={!!busy} onClick={() => approveRequest(request)}>
                    {busy === request.id + ':approve' ? 'Onaylanıyor...' : 'Onayla'}
                  </button>
                  <button className="admin-reject" disabled={!!busy} onClick={() => rejectRequest(request)}>
                    {busy === request.id + ':reject' ? 'Reddediliyor...' : 'Reddet'}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Aktif Paketler</div>
        <div className="admin-request-card">
          <div className="admin-request-school">Manuel Paket Ata</div>
          <div className="admin-manual-grid">
            <select value={manual.schoolId} onChange={e => setManual(v => ({ ...v, schoolId: e.target.value }))}>
              {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
            <select value={manual.packageType} onChange={e => setManual(v => ({ ...v, packageType: e.target.value, price: e.target.value === 'featured_school' ? 5000 : 1000 }))}>
              <option value="profile_management">Profil Yönetimi</option>
              <option value="featured_school">Öne Çıkan Okul</option>
            </select>
            <input type="number" value={manual.price} onChange={e => setManual(v => ({ ...v, price: e.target.value }))} />
            <input type="date" value={manual.expiresAt} onChange={e => setManual(v => ({ ...v, expiresAt: e.target.value }))} />
          </div>
          <button className="package-request" disabled={!!busy || !manual.schoolId} onClick={assignPackage}>
            {busy === 'manual-package' ? 'Atanıyor...' : 'Manuel Paket Ata'}
          </button>
        </div>
        {activePackages.length === 0 ? (
          <div className="package-state">Aktif paket yok.</div>
        ) : activePackages.map(pkg => (
          <div key={pkg.id} className="admin-request-card active">
            <div className="admin-request-head">
              <div>
                <div className="admin-request-school">{pkg.schools?.name || pkg.school_id}</div>
                <div className="admin-request-meta">{packageLabel(pkg.package_type)} · {pkg.price.toLocaleString('tr-TR')} TL · Başlangıç {formatDateTime(pkg.started_at)}</div>
                <div className="admin-request-meta">Bitiş: {formatDateTime(pkg.expires_at)}</div>
              </div>
              <span className="admin-status approved">{packageStatusLabel(pkg.status)}</span>
            </div>
            <div className="admin-expiry-row">
              <input type="date" value={expiry[pkg.id] || ''} onChange={e => setExpiry(v => ({ ...v, [pkg.id]: e.target.value }))} />
              <button className="admin-expire" disabled={!!busy} onClick={() => updatePackageExpiry(pkg)}>
                {busy === pkg.id + ':expiry' ? 'Kaydediliyor...' : 'Bitiş Tarihi Güncelle'}
              </button>
            </div>
            <div className="admin-actions">
              <button className="admin-reject" disabled={!!busy} onClick={() => deactivatePackage(pkg, 'inactive')}>
                {busy === pkg.id + ':inactive' ? 'Güncelleniyor...' : 'Pasife Al'}
              </button>
              <button className="admin-expire" disabled={!!busy} onClick={() => deactivatePackage(pkg, 'expired')}>
                {busy === pkg.id + ':expired' ? 'Güncelleniyor...' : 'Expired Yap'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <div className="admin-section-title">Okul Yönetimi</div>
        {schools.slice(0, 30).map(school => (
          <div key={school.id} className="admin-request-card">
            <div className="admin-request-head">
              <div>
                <div className="admin-request-school">{school.name}</div>
                <div className="admin-request-meta">{school.district} · {school.is_premium ? 'Öne çıkan' : 'Standart'} · {school.is_verified ? 'Doğrulanmış' : 'Doğrulanmamış'}</div>
              </div>
              <VerifyTag status={school.verification_status || school.trust?.status || 'pending_review'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchoolDetailScreen({ id, go, fav, rem, toggleFav, toggleRem, auth, realtimeVersion = 0 }) {
  const school = window.getSchool(id);
  if (!school) return <div className="empty"><div className="empty-title">Okul bulunamadı</div></div>;
  const [, setSchoolRefreshKey] = useS(0);
  const [managedDetailExams, setManagedDetailExams] = useS(null);
  const showPackagePanel = schoolUserOwnsProfile(auth, school.id);
  const showAdminPackagePanel = userIsAdmin(auth);
  const canLoadManagedExams = showPackagePanel || showAdminPackagePanel;
  const exams = managedDetailExams || window.getExamsBySchool(id);
  const open = exams.filter(e => e.status === 'open').length;
  const isFeatured = isFeaturedSchool(school);

  useE(() => {
    let mounted = true;
    if (!canLoadManagedExams) {
      setManagedDetailExams(null);
      return () => { mounted = false; };
    }
    auth.getSchoolExams(school.id)
      .then(rows => {
        if (!mounted) return;
        if (rows?.length) {
          window.EXAMS = [
            ...rows,
            ...window.EXAMS.filter(exam => exam.schoolId !== school.id),
          ];
        }
        setManagedDetailExams(rows || []);
      })
      .catch(() => { if (mounted) setManagedDetailExams(null); });
    return () => { mounted = false; };
  }, [school.id, canLoadManagedExams, auth.user?.id, realtimeVersion]);

  return (
    <div className="page-enter">
      <div className="school-hero" style={{ background: school.heroColor || school.logoColor }}>
        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 5 }}>
          <div className="detail-back-btn" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => go('schools')}>
            <Icon name="arrow_left" />
          </div>
        </div>
        {school.profileImageUrl ? (
          <div className="big-logo big-logo-image">
            <img src={school.profileImageUrl} alt="" />
          </div>
        ) : (
          <div className="big-logo" style={{ color: school.logoColor }}>{window.schoolInitials(school.name)}</div>
        )}
        {school.verified && (
          <div className="verified-pill"><Icon name="check" /> Doğrulanmış Okul</div>
        )}
        {isFeatured && (
          <div className="featured-pill"><Icon name="star" /> Öne Çıkan Okul</div>
        )}
        <h1>{school.name}</h1>
        <div className="meta">📍 {school.district} · İzmir</div>
        {school.campus && <div className="campus">{school.campus}</div>}
      </div>

      <div style={{ display: 'flex', background: 'var(--surface)', padding: '14px 8px', borderBottom: '1px solid var(--border-light)', marginBottom: 14 }}>
        <div className="strip-item"><div className="strip-value">{exams.length}</div><div className="strip-label">Sınav</div></div>
        <div className="strip-divider" />
        <div className="strip-item"><div className="strip-value" style={{ color: open ? 'var(--success)' : 'var(--text-muted)' }}>{open}</div><div className="strip-label">Açık</div></div>
        <div className="strip-divider" />
        <div className="strip-item"><div className="strip-value">{school.verified ? '✓' : '⏳'}</div><div className="strip-label">Durum</div></div>
        <div className="strip-divider" />
        <div className="strip-item"><div className="strip-value">İzmir</div><div className="strip-label">Şehir</div></div>
      </div>

      <div className="detail-card">
        <div className="detail-card-title"><Icon name="school" /> Hakkında</div>
        <div className="detail-card-body">{school.description || 'İzmir bölgesinde özel eğitim veren okul.'}</div>
      </div>

      {school.registrationDeadline && (() => {
        const reg = window.registrationStatus(school);
        const dStart = window.daysUntil(school.registrationStartDate);
        const dEnd = window.daysUntil(school.registrationDeadline);
        return (
          <div className={'reg-card reg-card-' + reg.state}>
            <div className="reg-card-head">
              <div className={'reg-card-badge reg-' + reg.state}>
                <span className="reg-dot" />
                {reg.label}
              </div>
              <div className="reg-card-title">Okul Kayıt Dönemi</div>
            </div>
            <div className="reg-timeline">
              <div className="reg-stop">
                <div className="reg-stop-label">Başvuru Başlangıç</div>
                <div className="reg-stop-date">{window.formatDate(school.registrationStartDate)}</div>
                <div className="reg-stop-rel">{dStart > 0 ? dStart + ' gün sonra' : dStart === 0 ? 'Bugün' : Math.abs(dStart) + ' gün önce'}</div>
              </div>
              <div className="reg-track">
                <div className="reg-track-fill" style={{
                  width: reg.state === 'upcoming' ? '0%' : reg.state === 'closed' ? '100%' :
                    Math.min(100, Math.max(0, (1 - dEnd / (dEnd - dStart)) * 100)) + '%'
                }} />
              </div>
              <div className="reg-stop reg-stop-end">
                <div className="reg-stop-label">Son Kayıt Tarihi</div>
                <div className="reg-stop-date">{window.formatDate(school.registrationDeadline)}</div>
                <div className="reg-stop-rel">{dEnd > 0 ? dEnd + ' gün kaldı' : dEnd === 0 ? 'Bugün son gün' : Math.abs(dEnd) + ' gün önce kapandı'}</div>
              </div>
            </div>
            {reg.state === 'open' && (
              <div className="reg-cta">
                <Icon name="calendar" /> Şimdi kayıt için okulu arayın
              </div>
            )}
          </div>
        );
      })()}

      <div className="detail-card">
        <div className="detail-card-title"><Icon name="phone" /> İletişim</div>
        {school.phone && (
          <div className="contact-row" role="link" tabIndex={0}
               onClick={() => openLink(normalizePhoneUrl(school.phone))}
               onKeyDown={e => e.key === 'Enter' && openLink(normalizePhoneUrl(school.phone))}>
            <div className="ic"><Icon name="phone" /></div>
            <div className="label">{school.phone}</div>
            <div className="arr">↗</div>
          </div>
        )}
        {school.website && (
          <div className="contact-row" role="link" tabIndex={0}
               onClick={() => openLink(normalizeWebUrl(school.website))}
               onKeyDown={e => e.key === 'Enter' && openLink(normalizeWebUrl(school.website))}>
            <div className="ic"><Icon name="globe" /></div>
            <div className="label">{school.website}</div>
            <div className="arr">↗</div>
          </div>
        )}
        {school.instagram && (
          <div className="contact-row" role="link" tabIndex={0}
               onClick={() => openLink(normalizeInstagramUrl(school.instagram))}
               onKeyDown={e => e.key === 'Enter' && openLink(normalizeInstagramUrl(school.instagram))}>
            <div className="ic"><Icon name="insta" /></div>
            <div className="label">{school.instagram}</div>
            <div className="arr">↗</div>
          </div>
        )}
      </div>

      {showPackagePanel && <SchoolPackagesPanel school={school} auth={auth} realtimeVersion={realtimeVersion} onSchoolUpdated={() => setSchoolRefreshKey(key => key + 1)} />}
      {showAdminPackagePanel && (
        <>
          <SchoolPackagesPanel school={school} auth={auth} forceManage adminMode realtimeVersion={realtimeVersion} onSchoolUpdated={() => setSchoolRefreshKey(key => key + 1)} />
          <AdminDataTrustPanel school={school} exams={exams} auth={auth} />
          <AdminSchoolPackagePanel school={school} auth={auth} />
        </>
      )}

      <div className="section-head">
        <div className="section-title"><Icon name="list" /> Bu Okula Ait Sınavlar</div>
        <div className="section-sub">{exams.length}</div>
      </div>
      <div className="exam-card-list">
        {exams.map(e => (
          <ExamCard key={e.id} exam={e} onOpen={id => go('exam', { id })}
                    fav={fav.includes(e.id)} rem={rem.includes(e.id)}
                    onFav={toggleFav} onRem={toggleRem} />
        ))}
      </div>
    </div>
  );
}

function ExamDetailScreen({ id, go, fav, rem, toggleFav, toggleRem }) {
  const exam = window.getExam(id);
  if (!exam) return <div className="empty"><div className="empty-title">Sınav bulunamadı</div></div>;
  const school = window.getSchool(exam.schoolId);
  const dUntil = window.daysUntil(exam.examDate);
  const dDeadline = window.daysUntil(exam.applicationDeadline);
  const isFav = fav.includes(exam.id);
  const isRem = rem.includes(exam.id);

  return (
    <div className="page-enter">
      <div className="exam-hero">
        <div className="radar-bg">
          <div className="radar-sweep" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <div className="detail-back-btn" style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: 'white' }} onClick={() => go('exams')}>
            <Icon name="arrow_left" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="detail-back-btn" style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: isFav ? '#FB7185' : 'white' }} onClick={() => toggleFav(exam.id)}>
              <Icon name="heart" style={{ fill: isFav ? '#FB7185' : 'none' }} />
            </div>
          </div>
        </div>

        <div onClick={() => go('school', { id: school.id })} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, position: 'relative', zIndex: 2, cursor: 'pointer' }}>
          <SchoolLogo school={school} size={36} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.92 }}>{school.name}</div>
            <div style={{ fontSize: 11, opacity: 0.65 }}>📍 {exam.district} · İzmir</div>
          </div>
        </div>

        <h1>{exam.examName}</h1>

        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          <StatusTag status={exam.status} />
          <VerifyTag status={exam.verificationStatus} />
        </div>
      </div>

      <div className="countdown">
        <div>
          <div className="countdown-label">Sınava</div>
          <div className="countdown-big">{dUntil < 0 ? Math.abs(dUntil) : dUntil}</div>
          <div className="countdown-sub">{dUntil < 0 ? 'gün önce yapıldı' : dUntil === 0 ? 'bugün!' : 'gün kaldı'}</div>
        </div>
        <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.2)' }} />
        <div>
          <div className="countdown-label">Son başvuru</div>
          <div className="countdown-big" style={{ color: dDeadline <= 1 ? '#FCA5A5' : 'white' }}>{dDeadline < 0 ? 'Bitti' : dDeadline === 0 ? 'Bugün' : dDeadline + ' gün'}</div>
          <div className="countdown-sub">{window.formatDate(exam.applicationDeadline)}</div>
        </div>
        <button className="countdown-cta" onClick={() => toggleRem(exam.id)}>
          {isRem ? '🔔 Hatırlatılıyor' : 'Hatırlat'}
        </button>
      </div>

      <div style={{ height: 14 }} />

      <div className="detail-card">
        <div className="detail-card-title"><Icon name="calendar" /> Önemli Tarihler</div>
        <div className="timeline" style={{ padding: '6px 0 0' }}>
          {exam.applicationStartDate && (
            <div className="timeline-item">
              <div className="timeline-dot" style={{ borderColor: 'var(--success)' }} />
              <div className="timeline-date">Başvuru başlangıcı</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{window.formatLongDate(exam.applicationStartDate)}</div>
            </div>
          )}
          <div className="timeline-item">
            <div className={'timeline-dot ' + (window.urgency(exam.applicationDeadline) === 'urgent' ? 'urgent' : '')} />
            <div className="timeline-date">Son başvuru tarihi</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{window.formatLongDate(exam.applicationDeadline)}</div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot" style={{ borderColor: 'var(--primary-mid)' }} />
            <div className="timeline-date">Sınav günü</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{window.formatLongDate(exam.examDate)}</div>
            {exam.examLocation && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>📍 {exam.examLocation}</div>}
          </div>
        </div>
      </div>

      <div className="detail-card">
        <div className="detail-card-title"><Icon name="cap" /> Uygun Sınıflar</div>
        <div className="grades" style={{ marginBottom: 0 }}>
          {exam.eligibleGrades.map(g => <span key={g} className="grade-chip" style={{ fontSize: 12, padding: '5px 10px' }}>{g}</span>)}
        </div>
      </div>

      {exam.notes && (
        <div className="detail-card">
          <div className="detail-card-title"><Icon name="edit" /> Notlar</div>
          <div className="detail-card-body">{exam.notes}</div>
        </div>
      )}

      {exam.applicationUrl && (
        <div style={{ padding: '4px 16px 20px' }}>
          <button className="search-btn" onClick={() => openLink(normalizeWebUrl(exam.applicationUrl))}>
            Başvuru Sayfasını Aç →
          </button>
        </div>
      )}
    </div>
  );
}

const GOOGLE_SIGN_IN_ENABLED = false;

const THEME_OPTIONS = [
  { value: 'light',  label: 'Açık Tema',  hint: 'Beyaz arka plan, gündüz kullanım için' },
  { value: 'dark',   label: 'Koyu Tema',  hint: 'Radar Koyu — gece kullanım için' },
];

function ThemePicker({ theme, setTheme }) {
  if (typeof setTheme !== 'function') return null;
  const active = THEME_OPTIONS.some(o => o.value === theme) ? theme : 'light';
  return (
    <div className="theme-card">
      <div className="theme-card-title">Görünüm</div>
      <div className="theme-card-sub">Uygulamanın açık veya koyu temada görünmesini seçin.</div>
      <div className="theme-options" role="radiogroup" aria-label="Tema seçimi">
        {THEME_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active === opt.value}
            className={'theme-option ' + (active === opt.value ? 'on' : '')}
            onClick={() => setTheme(opt.value)}
          >
            <span className="theme-option-label">{opt.label}</span>
            <span className="theme-option-hint">{opt.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AccountScreen({ go, params, auth, theme, setTheme }) {
  const [mode, setMode] = useS('login');
  const [email, setEmail] = useS('');
  const [password, setPassword] = useS('');
  const [passwordConfirm, setPasswordConfirm] = useS('');
  const [submitting, setSubmitting] = useS(false);
  const [resending, setResending] = useS(false);
  const [message, setMessage] = useS('');
  const [confirmationEmail, setConfirmationEmail] = useS('');
  const [deleteConfirm, setDeleteConfirm] = useS(false);
  const [deleting, setDeleting] = useS(false);
  const returnTo = params?.returnTo || 'plan';
  const canOpenOwnSchool = auth.profile?.role === 'school_user' && !!auth.profile?.school_id;

  function openOwnSchool() {
    const schoolId = auth.profile?.school_id;
    if (!schoolId) return;
    if (!window.getSchool(schoolId)) {
      setMessage('Bağlı okul profili bulunamadı.');
      return;
    }
    setMessage('');
    go('school', { id: schoolId });
  }

  async function submitAuth(e) {
    e.preventDefault();
    if (!email.trim().includes('@') || (mode !== 'forgot' && password.length < 6)) return;
    if (mode === 'register' && password !== passwordConfirm) {
      setMessage('Şifreler eşleşmiyor.');
      return;
    }
    setSubmitting(true);
    setMessage('');

    try {
      if (mode === 'login') {
        await auth.signIn(email, password);
        go(returnTo);
      } else if (mode === 'register') {
        const session = await auth.signUp(email, password);
        if (session?.user) go(returnTo);
        else {
          setConfirmationEmail(email.trim());
          setMessage('Doğrulama bağlantısı e-posta adresinize gönderildi. Hesabınızı etkinleştirmek için gelen kutunuzu kontrol edin.');
        }
      } else {
        await auth.resetPassword(email);
        setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      }
    } catch (err) {
      setMessage(err?.message || 'İşlem tamamlanamadı. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setSubmitting(false);
    }
  }

  async function resendConfirmation() {
    const targetEmail = confirmationEmail || email.trim();
    if (!targetEmail) {
      setMessage('Doğrulama bağlantısını tekrar göndermek için e-posta adresinizi yazın.');
      return;
    }
    setResending(true);
    setMessage('');
    try {
      await auth.resendSignupConfirmation(targetEmail);
      setConfirmationEmail(targetEmail);
      setMessage('Doğrulama bağlantısı tekrar gönderildi. Gelen kutunuzu ve spam klasörünüzü kontrol edin.');
    } catch (err) {
      setMessage(err?.message || 'Doğrulama bağlantısı tekrar gönderilemedi. Lütfen biraz sonra deneyin.');
    } finally {
      setResending(false);
    }
  }

  function handleGoogleSignIn() {
    setMessage('');
    auth.signInWithGoogle();
  }

  if (auth.loading) {
    return (
      <div className="page-enter">
        <div className="empty">
          <div className="empty-icon"><Icon name="lock" /></div>
          <div className="empty-title">Oturum kontrol ediliyor</div>
        </div>
      </div>
    );
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await auth.deleteAccount(auth.session);
    } catch (err) {
      setDeleting(false);
      setDeleteConfirm(false);
      setMessage('Hesap silinemedi: ' + (err?.message || 'Bilinmeyen hata'));
    }
  }

  if (auth.user) {
    return (
      <div className="page-enter">
        <div className="page-header">
          <div>
            <div className="page-title">Hesabım</div>
            <div className="page-sub">Oturum bilgileriniz</div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-icon"><Icon name="user" /></div>
          <div className="auth-title">Oturum açık</div>
          <div className="auth-sub">{auth.user.email}</div>
          <button className="auth-primary" onClick={() => go('plan')}>Planıma git</button>
          {canOpenOwnSchool && (
            <>
              <button className="auth-secondary" onClick={openOwnSchool}>Okuluma Git</button>
              <div className="auth-hint">Kendi okul profilinizi görüntüleyin ve yönetin</div>
            </>
          )}
          {message && <div className="auth-message">{message}</div>}
          <button className="auth-secondary" onClick={auth.signOut}>Çıkış yap</button>
        </div>

        <ThemePicker theme={theme} setTheme={setTheme} />

        <div style={{ padding: '0 16px 32px' }}>
          {!deleteConfirm ? (
            <button className="delete-account-btn" onClick={() => setDeleteConfirm(true)}>
              Hesabı Sil
            </button>
          ) : (
            <div className="delete-account-confirm">
              <div className="delete-account-confirm-title">Hesabınız kalıcı olarak silinecek</div>
              <div className="delete-account-confirm-sub">Bu işlem geri alınamaz. Tüm verileriniz silinir.</div>
              <button className="delete-account-btn" disabled={deleting} onClick={handleDeleteAccount}>
                {deleting ? 'Siliniyor...' : 'Evet, hesabımı sil'}
              </button>
              <button className="auth-secondary" style={{ marginTop: 8 }} disabled={deleting} onClick={() => setDeleteConfirm(false)}>
                Vazgeç
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const title = mode === 'register' ? 'Hesap oluştur' : mode === 'forgot' ? 'Şifremi unuttum' : 'Giriş yap';
  const subtitle = mode === 'forgot' ? 'Şifre yenileme bağlantısı gönderin.' : 'Hesabınıza erişmek için oturum açın.';

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Hesap</div>
          <div className="page-sub">Giriş ve üyelik işlemleri</div>
        </div>
      </div>

      <form className="auth-card" onSubmit={submitAuth}>
        <div className="auth-icon"><Icon name={mode === 'forgot' ? 'bell' : 'lock'} /></div>
        <div className="auth-title">{title}</div>
        <div className="auth-sub">{subtitle}</div>

        {GOOGLE_SIGN_IN_ENABLED && mode !== 'forgot' && (
          <>
            <button type="button" className="auth-google" onClick={handleGoogleSignIn}>
              <span className="auth-google-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
                </svg>
              </span>
              Google ile devam et
            </button>
            <div className="auth-divider"><span>veya</span></div>
          </>
        )}

        <label className="auth-label">E-posta</label>
        <input className="auth-input" value={email} onChange={e => setEmail(e.target.value)}
               type="email" placeholder="ornek@mail.com" autoComplete="email" />

        {mode !== 'forgot' && (
          <>
            <label className="auth-label">Şifre</label>
            <input className="auth-input" value={password} onChange={e => setPassword(e.target.value)}
                   type="password" placeholder="En az 6 karakter" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {mode === 'register' && (
              <>
                <label className="auth-label">Şifre Doğrulama</label>
                <input className="auth-input" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                       type="password" placeholder="Şifrenizi tekrar yazın" autoComplete="new-password" />
              </>
            )}
          </>
        )}

        {message && <div className="auth-message">{message}</div>}

        {mode === 'register' && confirmationEmail && (
          <button type="button" className="auth-secondary" onClick={resendConfirmation} disabled={resending}>
            {resending ? 'Tekrar gönderiliyor...' : 'Doğrulama mailini tekrar gönder'}
          </button>
        )}

        <button className="auth-primary" disabled={submitting}>
          {submitting ? 'İşleniyor...' : mode === 'forgot' ? 'Bağlantı gönder' : title}
        </button>

        <div className="auth-links">
          {mode !== 'login' && <button type="button" onClick={() => { setMode('login'); setMessage(''); setPasswordConfirm(''); setConfirmationEmail(''); }}>Giriş yap</button>}
          {mode !== 'register' && <button type="button" onClick={() => { setMode('register'); setMessage(''); setPasswordConfirm(''); setConfirmationEmail(''); }}>Hesap oluştur</button>}
          {mode !== 'forgot' && <button type="button" onClick={() => { setMode('forgot'); setMessage(''); setPasswordConfirm(''); setConfirmationEmail(''); }}>Şifremi unuttum</button>}
        </div>
      </form>

      <ThemePicker theme={theme} setTheme={setTheme} />
    </div>
  );
}

Object.assign(window, { HomeScreen, ExamsScreen, PlanScreen, SchoolsScreen, AccountScreen, AdminPackagesScreen, SchoolDetailScreen, ExamDetailScreen });
