import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHero, Reveal } from '../components/Shared.jsx';
import LookupForm from '../components/LookupForm.jsx';
import { IdCardStudio } from '../components/CardStudio.jsx';
import { Badge, Check, Upload, Crown } from '../components/Icons.jsx';
import { api } from '../lib/api.js';
import { CATEGORIES, STATES } from '../data/event.js';
import { ageFromDob } from '../lib/format.js';

export default function IdCard() {
  const { state } = useLocation();
  const [reg, setReg] = useState(null);
  const [creds, setCreds] = useState(null);
  const [error, setError] = useState('');

  // Coming straight from the registration form: look the record up automatically.
  useEffect(() => {
    if (!state?.regId || !state?.phone) return;
    const body = { regId: state.regId, phone: state.phone };
    api.post('/api/registrations/lookup', body)
      .then((r) => { setReg(r); setCreds(body); })
      .catch((e) => setError(e.message));
  }, [state]);

  const found = (r, body) => { setReg(r); setCreds(body); };

  return (
    <>
      <PageHero eyebrow="Contestants" title="Your Official" script="ID Card"
        text="Print-quality contestant ID card (front & back). Available once your registration form is fully filled." />
      <section className="section">
        <div className="container">
          {!reg ? (
            <div className="lookup-wrap">
              <Reveal className="lookup-intro">
                <span className="lookup-intro__icon"><Badge size={30} /></span>
                <h2 className="h-display">Download your ID card</h2>
                <p>Enter your registered mobile number with your Registration ID (or email). Your card is generated in HD — ready to download or print.</p>
                <ul className="ticks">
                  <li><Check size={16} /> Front & back, CR80 (54 × 85.6 mm)</li>
                  <li><Check size={16} /> Your photo, category & Registration ID</li>
                  <li><Check size={16} /> Key dates, venue & helpline on the back</li>
                </ul>
              </Reveal>
              <Reveal className="card lookup-card" delay={100}>
                {error && <div className="alert alert--error">{error}</div>}
                <LookupForm onFound={found} submitLabel="Get my ID card" />
              </Reveal>
            </div>
          ) : reg.missing.length ? (
            <CompleteProfile reg={reg} creds={creds} onDone={setReg} onReset={() => setReg(null)} />
          ) : (
            <div className="result">
              <ResultHead reg={reg} onReset={() => setReg(null)} />
              <IdCardStudio data={{ kind: 'contestant', ...reg }} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export function ResultHead({ reg, onReset }) {
  return (
    <div className="result__head">
      <div>
        <span className="eyebrow">{reg.regId}</span>
        <h2 className="h-display">{reg.fullName}</h2>
        <p className="muted">
          {reg.category || 'Category not set'} · Status:{' '}
          <span className={`pill pill--${reg.status}`}>{reg.status}</span>
        </p>
      </div>
      <button className="btn btn--ghost btn--sm" onClick={onReset}>Look up another</button>
    </div>
  );
}

/** Shown when the ID card still needs details — asks only for what's missing. */
function CompleteProfile({ reg, creds, onDone, onReset }) {
  const missing = new Set(reg.missing.map((m) => m.key));
  const [form, setForm] = useState({ category: '', gender: '', dob: '', city: '', state: '', address: '' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError('Photo must be under 5 MB');
    setError('');
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const body = new FormData();
    Object.entries(creds).forEach(([k, v]) => body.append(k, v));
    Object.entries(form).forEach(([k, v]) => v && body.append(k, v));
    if (form.dob) body.append('age', ageFromDob(form.dob));
    if (photo) body.append('photo', photo);
    setBusy(true);
    try {
      onDone(await api.post('/api/registrations/complete', body));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="complete">
      <ResultHead reg={reg} onReset={onReset} />
      <div className="complete__grid">
        <div className="complete__info card--dark">
          <Crown size={34} />
          <h3>Almost there!</h3>
          <p>Your ID card needs a few more details. Fill them once and your card will be generated instantly.</p>
          <ul className="complete__list">
            {reg.missing.map((m) => <li key={m.key}>{m.label}</li>)}
          </ul>
        </div>
        <form className="card complete__form" onSubmit={submit}>
          {missing.has('photo') && (
            <div className="photo-pick">
              <label className="photo-pick__box">
                {preview ? <img src={preview} alt="Your photo preview" /> : <><Upload size={22} /><span>Photo</span></>}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} hidden />
              </label>
              <p><strong>Recent close-up photograph</strong><br />Front-facing, good light, plain background. JPG/PNG up to 5 MB.</p>
            </div>
          )}
          {missing.has('category') && (
            <div className="field">
              <label htmlFor="cp-cat">Category</label>
              <select id="cp-cat" className="select" value={form.category} onChange={set('category')} required>
                <option value="">Choose…</option>
                {CATEGORIES.map((c) => <option key={c.value}>{c.value}</option>)}
              </select>
            </div>
          )}
          <div className="grid-2">
            {missing.has('gender') && (
              <div className="field">
                <label htmlFor="cp-gender">Gender</label>
                <select id="cp-gender" className="select" value={form.gender} onChange={set('gender')} required>
                  <option value="">Choose…</option>
                  <option>Female</option><option>Male</option><option>Other</option>
                </select>
              </div>
            )}
            {missing.has('dob') && (
              <div className="field">
                <label htmlFor="cp-dob">Date of birth</label>
                <input id="cp-dob" type="date" className="input" value={form.dob} onChange={set('dob')} required />
              </div>
            )}
            {missing.has('city') && (
              <div className="field">
                <label htmlFor="cp-city">City</label>
                <input id="cp-city" className="input" value={form.city} onChange={set('city')} required />
              </div>
            )}
            {missing.has('state') && (
              <div className="field">
                <label htmlFor="cp-state">State</label>
                <select id="cp-state" className="select" value={form.state} onChange={set('state')} required>
                  <option value="">Choose…</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
          {missing.has('address') && (
            <div className="field">
              <label htmlFor="cp-addr">Full address</label>
              <textarea id="cp-addr" className="textarea" rows={3} value={form.address} onChange={set('address')} required />
            </div>
          )}
          {error && <div className="alert alert--error" role="alert">{error}</div>}
          <button className="btn btn--rose btn--block" disabled={busy || (missing.has('photo') && !photo)}>
            {busy ? <><span className="spinner" /> Saving…</> : <><Badge size={18} /> Save & generate ID card</>}
          </button>
        </form>
      </div>
    </div>
  );
}
