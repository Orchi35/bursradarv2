// BursRadar — shared UI components
const { useState, useEffect, useRef } = React;

// Score badge with conic ring
function ScoreBadge({ score }) {
  const cls = score >= 80 ? '' : score >= 60 ? 'score-mid' : 'score-low';
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)';
  return (
    <div className={'score-badge ' + cls} style={{ '--p': score }}>
      <div className="score-ring" />
      <span style={{ color, position: 'relative', zIndex: 2 }}>{score}</span>
    </div>
  );
}

function SchoolLogo({ school, size }) {
  const initials = window.schoolInitials(school.name);
  const w = size || 42;
  if (school.profileImageUrl) {
    return (
      <div className="school-logo school-logo-image" style={{ width: w, height: w }}>
        <img src={school.profileImageUrl} alt="" />
      </div>
    );
  }
  return (
    <div className="school-logo" style={{
      width: w, height: w,
      background: school.logoColor + '1f',
      color: school.logoColor,
      fontSize: w >= 60 ? 18 : 13
    }}>{initials}</div>
  );
}

function VerifyTag({ status, size }) {
  const map = {
    verified: { label: 'Resmi doğrulandı', cls: 'verified' },
    official_verified: { label: 'Resmi doğrulandı', cls: 'verified' },
    pending: { label: 'Kontrol bekliyor', cls: 'pending' },
    pending_review: { label: 'Kontrol bekliyor', cls: 'pending' },
    outdated: { label: 'Eski Olabilir', cls: 'outdated' },
    possibly_outdated: { label: 'Eski Olabilir', cls: 'outdated' },
  };
  const m = map[status] || map.verified;
  return (
    <span className={'verify-tag ' + m.cls}>
      <span className="dot" />
      {m.label}
    </span>
  );
}

function StatusTag({ status }) {
  const map = {
    open: 'Başvuru Açık',
    upcoming: 'Yakında',
    closed: 'Kapandı',
  };
  return <span className={'status-tag ' + status}>{map[status]}</span>;
}

function ExamCard({ exam, compact, onOpen, fav, rem, onFav, onRem }) {
  const school = window.getSchool(exam.schoolId);
  const isClosed = exam.status === 'closed';
  const urg = window.urgency(exam.applicationDeadline);
  const schoolFeatured = !!school?.isPremium;

  return (
    <div className={'exam-card ' + (compact ? 'compact ' : '') + (isClosed ? 'closed' : '')}
         onClick={() => onOpen && onOpen(exam.id)}>
      <div className="exam-head">
        <SchoolLogo school={school} />
        <div className="school-info">
          <div className="school-name">{school.name}</div>
          <div className="school-district">
            <Icon name="pin" style={{ width: 10, height: 10 }} /> {exam.district}
          </div>
        </div>
        <ScoreBadge score={exam.scholarshipScore} />
      </div>

      <div className="exam-name">{exam.examName}</div>

      {!compact && (
        <div className="dates-row">
          <div className="date-item">
            <div className="date-label">Sınav</div>
            <div className="date-value">{window.formatDate(exam.examDate)}</div>
          </div>
          <div className="date-sep" />
          <div className="date-item">
            <div className="date-label">Son Başvuru</div>
            <div className={'date-value ' + (urg === 'urgent' ? 'urgent' : urg === 'soon' ? 'soon' : '')}>
              {window.formatDate(exam.applicationDeadline)}
            </div>
          </div>
          <div className="date-sep" />
          <div className="date-item">
            <div className="date-label">Süre</div>
            <div className={'date-value ' + (urg === 'urgent' ? 'urgent' : '')}>
              {isClosed ? 'Bitti' : window.daysUntilLabel(exam.examDate)}
            </div>
          </div>
        </div>
      )}

      <div className="grades">
        {exam.eligibleGrades.slice(0, 4).map(g => <span key={g} className="grade-chip">{g}</span>)}
        {exam.eligibleGrades.length > 4 && (
          <span className="grade-chip" style={{ background: 'var(--border-light)', color: 'var(--text-muted)' }}>
            +{exam.eligibleGrades.length - 4}
          </span>
        )}
      </div>

      <div className="tag-row">
        {schoolFeatured && <span className="featured-tag"><Icon name="star" /> Öne Çıkan Okul</span>}
        <StatusTag status={exam.status} />
        <VerifyTag status={exam.verificationStatus} />
      </div>

      {!compact && (
        <div className="actions" onClick={e => e.stopPropagation()}>
          <button className={'action-btn fav ' + (fav ? 'on' : '')} onClick={() => onFav(exam.id)}>
            <Icon name="heart" />
            {fav ? 'Favoride' : 'Favori'}
          </button>
          <button className={'action-btn rem ' + (rem ? 'on' : '')} onClick={() => onRem(exam.id)}>
            <Icon name="bell" />
            {rem ? 'Hatırlatma' : 'Hatırlat'}
          </button>
          <button className="action-btn detail" onClick={() => onOpen && onOpen(exam.id)}>
            Detay <Icon name="arrow" />
          </button>
        </div>
      )}
    </div>
  );
}

function SchoolCard({ school, onOpen, variant }) {
  const exams = window.getExamsBySchool(school.id);
  const open = exams.filter(e => e.status === 'open').length;
  const reg = window.registrationStatus && window.registrationStatus(school);
  const schoolFeatured = !!school?.isPremium;
  const cardVariant = variant || (schoolFeatured ? 'featured' : 'standard');
  const schoolThemeColor = school.heroColor || school.logoColor;
  return (
    <div
      className={'school-card ' + (cardVariant === 'featured' ? 'featured' : '')}
      style={cardVariant === 'featured' ? { '--school-theme': schoolThemeColor } : undefined}
      onClick={() => onOpen && onOpen(school.id)}
    >
      {schoolFeatured && <div className="featured-tag school-featured-top"><Icon name="star" /> Öne Çıkan Okul</div>}
      <div className="head">
        <SchoolLogo school={school} size={schoolFeatured ? 54 : 46} />
        <div className="info">
          <div className="name">{school.name}</div>
          <div className="meta">
            <Icon name="pin" style={{ width: 11, height: 11 }} /> {school.district} · İzmir
          </div>
        </div>
        {school.verified && (
          <div className="verified-tick"><Icon name="check" /></div>
        )}
      </div>
      {schoolFeatured && <div className="featured-tag school-featured"><Icon name="star" /> Öne Çıkan Okul</div>}
      {school.description && <div className="desc">{school.description}</div>}
      {reg && school.registrationDeadline && (
        <div className={'reg-pill reg-' + reg.state}>
          <span className="reg-dot" />
          <span className="reg-label">{reg.label}</span>
          <span className="reg-sep">·</span>
          <span className="reg-date">
            {reg.state === 'upcoming'
              ? window.formatDate(school.registrationStartDate) + ' başlıyor'
              : reg.state === 'open'
                ? 'Son ' + window.formatDate(school.registrationDeadline)
                : window.formatDate(school.registrationDeadline) + ' bitti'}
          </span>
        </div>
      )}
      <div className="footer-row">
        <div className="stat"><div className="stat-num">{exams.length}</div><div className="stat-lbl">Sınav</div></div>
        <div className="stat"><div className={'stat-num ' + (open ? 'green' : '')}>{open}</div><div className="stat-lbl">Açık</div></div>
        <div className="stat"><div className="stat-num">{school.verified ? 'Evet' : 'Hayır'}</div><div className="stat-lbl">Doğrulu</div></div>
      </div>
    </div>
  );
}

function SelectSheet({ open, title, options, value, onSelect, onClose }) {
  if (!open) return null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="sheet-title">{title}</div>
          <span className="sheet-close" onClick={onClose}>×</span>
        </div>
        <div className="sheet-body">
          {options.map(o => (
            <div key={o} className={'sheet-option ' + (o === value ? 'on' : '')} onClick={() => { onSelect(o); onClose(); }}>
              <div className="sheet-option-text">{o}</div>
              {o === value && <span className="check"><Icon name="check" style={{ width: 16, height: 16 }} /></span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Toast({ msg }) {
  return (
    <div className="toast" key={msg}>
      <Icon name="check" />
      {msg}
    </div>
  );
}

Object.assign(window, { ScoreBadge, SchoolLogo, VerifyTag, StatusTag, ExamCard, SchoolCard, SelectSheet, Toast });
