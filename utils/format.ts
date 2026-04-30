export function schoolInitials(name: string): string {
  const words = name.split(' ').filter((w) => w.toLocaleLowerCase('tr-TR') !== 'özel');
  return words.slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr-TR');
}
