export const MONTHS: { key: string; label: string }[] = [
  { key: '2026-12', label: 'Dec 2026' },
  { key: '2027-01', label: 'Jan 2027' },
  { key: '2027-02', label: 'Feb 2027' },
  { key: '2027-03', label: 'Mar 2027' },
  { key: '2027-04', label: 'Apr 2027' },
  { key: '2027-05', label: 'May 2027' },
  { key: '2027-06', label: 'Jun 2027' },
  { key: '2027-07', label: 'Jul 2027' },
  { key: '2027-08', label: 'Aug 2027' },
];

export const MONTH_KEYS = MONTHS.map((m) => m.key);

export function getMonthLabel(key: string): string {
  return MONTHS.find((m) => m.key === key)?.label ?? key;
}

export function getCurrentMonthKey(): string {
  const today = new Date();
  const thisKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  if (MONTH_KEYS.includes(thisKey)) return thisKey;
  if (thisKey < MONTH_KEYS[0]) return MONTH_KEYS[0];
  return MONTH_KEYS[MONTH_KEYS.length - 1];
}

export function getUserIdentifier(email: string): 'oded' | 'tomer' | null {
  const odedEmail = process.env.NEXT_PUBLIC_ODED_EMAIL;
  const tomerEmail = process.env.NEXT_PUBLIC_TOMER_EMAIL;
  if (odedEmail && email === odedEmail) return 'oded';
  if (tomerEmail && email === tomerEmail) return 'tomer';
  // Fallback: check email prefix
  const prefix = email.split('@')[0].toLowerCase();
  if (prefix.includes('oded')) return 'oded';
  if (prefix.includes('tomer')) return 'tomer';
  return null;
}

export const USER_DISPLAY_NAMES: Record<string, string> = {
  oded: 'Oded',
  tomer: 'Tomer',
};
