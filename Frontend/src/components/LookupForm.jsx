import { useState } from 'react';
import { api } from '../lib/api.js';
import { Arrow } from './Icons.jsx';

/** "Find my registration": mobile number + (Registration ID or email). */
export default function LookupForm({ onFound, submitLabel = 'Find my registration' }) {
  const [mode, setMode] = useState('regId');
  const [form, setForm] = useState({ regId: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const body = { phone: form.phone, ...(mode === 'regId' ? { regId: form.regId } : { email: form.email }) };
    setBusy(true);
    try {
      const reg = await api.post('/api/registrations/lookup', body);
      onFound(reg, body);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="lookup" onSubmit={submit}>
      <div className="seg" role="tablist" aria-label="Find by">
        <button type="button" role="tab" aria-selected={mode === 'regId'} className={mode === 'regId' ? 'is-active' : ''} onClick={() => setMode('regId')}>
          Registration ID
        </button>
        <button type="button" role="tab" aria-selected={mode === 'email'} className={mode === 'email' ? 'is-active' : ''} onClick={() => setMode('email')}>
          Forgot ID? Use email
        </button>
      </div>
      {mode === 'regId' ? (
        <div className="field">
          <label htmlFor="lk-reg">Registration ID</label>
          <input id="lk-reg" className="input input--caps" placeholder="MI26-0001" value={form.regId} onChange={set('regId')} required />
        </div>
      ) : (
        <div className="field">
          <label htmlFor="lk-email">Email used while registering</label>
          <input id="lk-email" type="email" className="input" value={form.email} onChange={set('email')} required autoComplete="email" />
        </div>
      )}
      <div className="field">
        <label htmlFor="lk-phone">Registered mobile number</label>
        <input id="lk-phone" type="tel" inputMode="numeric" maxLength={14} className="input" placeholder="10-digit mobile"
          value={form.phone} onChange={set('phone')} required autoComplete="tel" />
      </div>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      <button className="btn btn--rose btn--block" disabled={busy}>
        {busy ? <><span className="spinner" /> Searching…</> : <>{submitLabel} <Arrow size={18} /></>}
      </button>
    </form>
  );
}
