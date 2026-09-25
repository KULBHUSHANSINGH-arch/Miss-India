/** Age in whole years from a 'YYYY-MM-DD' date (empty string if not valid). */
export function ageFromDob(dob) {
  if (!dob) return '';
  const d = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age > 0 && age < 120 ? String(age) : '';
}

export const onlyDigits = (v, max = 10) => String(v || '').replace(/\D/g, '').slice(0, max);

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
