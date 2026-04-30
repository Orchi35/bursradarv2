export function daysUntil(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatLongDate(iso: string): string {
  const d = new Date(iso);
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} - ${days[d.getDay()]}`;
}

export function daysUntilLabel(iso: string): string {
  const n = daysUntil(iso);
  if (n < 0) return `${Math.abs(n)} gün geçti`;
  if (n === 0) return 'Bugün';
  if (n === 1) return 'Yarın';
  return `${n} gün kaldı`;
}

export function urgency(iso: string): 'past' | 'urgent' | 'soon' | 'normal' {
  const n = daysUntil(iso);
  if (n < 0) return 'past';
  if (n <= 1) return 'urgent';
  if (n <= 7) return 'soon';
  return 'normal';
}

export function registrationStatus(school: { registrationStartDate?: string; registrationDeadline?: string }): { state: 'open' | 'upcoming' | 'closed'; label: string } | null {
  if (!school.registrationStartDate || !school.registrationDeadline) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(school.registrationStartDate); start.setHours(0, 0, 0, 0);
  const end = new Date(school.registrationDeadline); end.setHours(0, 0, 0, 0);
  if (today < start) return { state: 'upcoming', label: 'Kayıt Yakında' };
  if (today > end) return { state: 'closed', label: 'Kayıt Kapandı' };
  return { state: 'open', label: 'Kayıtlar Açık' };
}

export function schoolInitials(name: string): string {
  const words = name.split(' ').filter((w) => w.toLocaleLowerCase('tr-TR') !== 'özel');
  return words.slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr-TR');
}
