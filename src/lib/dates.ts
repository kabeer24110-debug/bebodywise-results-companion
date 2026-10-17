export const todayKey = (d = new Date()) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
export const parseDay = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const daysBetween = (a: string, b: string) => Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86400000);
export const addDays = (s: string, n: number) => { const d = parseDay(s); d.setDate(d.getDate() + n); return todayKey(d); };
export const fmtDate = (s: string) => parseDay(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtShort = (s: string) => parseDay(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
export const uid = () => Math.random().toString(36).slice(2, 10);
