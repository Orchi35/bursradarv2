// BursRadar — screen components
const { useState: useS, useEffect: useE, useMemo: useM } = React;

function HomeScreen({ go, fav, rem, toggleFav, toggleRem }) {
  const [district, setDistrict] = useS('Tümü');
  const [grade, setGrade] = useS('Tümü');
  const [sheet, setSheet] = useS(null);

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = window.EXAMS.filter(e => {
    const d = new Date(e.examDate); d.setHours(0,0,0,0);
    return d >= today && e.status !== 'closed' && (district === 'Tümü' || e.district === district);
  }).sort((a,b) => new Date(a.examDate) - new Date(b.examDate));

  const featured = window.EXAMS.filter(e => e.isFeatured && e.status === 'open');

  // Öne çıkan okullar — doğrulanmış + açık sınavı olanlar; açık sınav sayısına göre sıralı
  const featuredSchools = window.SCHOOLS
    .filter(s => s.verified)
    .map(s => {
      const exams = window.getExamsBySchool(s.id);
      return { school: s, exams, openCount: exams.filter(e => e.status === 'open').length, totalCount: exams.length };
    })
    .filter(x => x.openCount > 0)
    .sort((a, b) => b.openCount - a.openCount)
    .slice(0, 3);

  // Okul kayıt dönemleri — açık olanlar önce, sonra yaklaşanlar
  const regSchools = window.SCHOOLS
    .map(s => ({ school: s, reg: window.registrationStatus(s) }))
    .filter(x => x.reg && x.reg.state !== 'closed')
    .sort((a, b) => {
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
              <div className="featured-school-cover" style={{ background: school.logoColor }}>
                <div className="featured-school-monogram">{window.schoolInitials(school.name)}</div>
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
  });
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
        {filtered.map(s => <SchoolCard key={s.id} school={s} onOpen={id => go('school', { id })} />)}
      </div>
    </div>
  );
}

function SchoolDetailScreen({ id, go, fav, rem, toggleFav, toggleRem }) {
  const school = window.getSchool(id);
  if (!school) return <div className="empty"><div className="empty-title">Okul bulunamadı</div></div>;
  const exams = window.getExamsBySchool(id);
  const open = exams.filter(e => e.status === 'open').length;
  const initials = window.schoolInitials(school.name);

  return (
    <div className="page-enter">
      <div className="school-hero" style={{ background: school.logoColor }}>
        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 5 }}>
          <div className="detail-back-btn" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => go('schools')}>
            <Icon name="arrow_left" />
          </div>
        </div>
        <div className="big-logo" style={{ color: school.logoColor }}>{initials}</div>
        {school.verified && (
          <div className="verified-pill"><Icon name="check" /> Doğrulanmış Okul</div>
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
        {school.phone && <div className="contact-row"><div className="ic"><Icon name="phone" /></div><div className="label">{school.phone}</div><div className="arr">↗</div></div>}
        {school.website && <div className="contact-row"><div className="ic"><Icon name="globe" /></div><div className="label">{school.website}</div><div className="arr">↗</div></div>}
        {school.instagram && <div className="contact-row"><div className="ic"><Icon name="insta" /></div><div className="label">{school.instagram}</div><div className="arr">↗</div></div>}
      </div>

      <div className="premium">
        <h3><Icon name="star" /> Öne Çıkarma Paketi</h3>
        <p>Okulunuzu BursRadar'da öne çıkarın. Burs sınavınız daha fazla veliye ve öğrenciye ulaşsın.</p>
        <button>Daha Fazla Bilgi →</button>
      </div>

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

      <div className="detail-card">
        <div className="detail-card-title"><Icon name="sparkle" /> Burs Skoru</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ScoreBadge score={exam.scholarshipScore} />
          <div style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Tarih yakınlığı, sınıf eşleşmesi, başvuru durumu ve doğrulama bilgilerine göre hesaplanmış öncelik skoru.
          </div>
        </div>
      </div>

      {exam.notes && (
        <div className="detail-card">
          <div className="detail-card-title"><Icon name="edit" /> Notlar</div>
          <div className="detail-card-body">{exam.notes}</div>
        </div>
      )}

      <div style={{ padding: '4px 16px 20px' }}>
        <button className="search-btn" onClick={() => alert('Başvuru sayfasına yönlendirilecek (demo)')}>
          Başvuru Sayfasını Aç →
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, ExamsScreen, PlanScreen, SchoolsScreen, SchoolDetailScreen, ExamDetailScreen });
