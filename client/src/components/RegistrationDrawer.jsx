import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegistration } from './RegistrationContext.jsx';
import { Close, Crown, Upload, Check, Badge, Award } from './Icons.jsx';
import { api } from '../lib/api.js';
import { EVENT, STATES } from '../data/event.js';

const CATEGORIES = [
  { value: 'Miss India', note: 'Unmarried women' },
  { value: 'Mrs. India', note: 'Married women' },
  { value: 'Mr. India', note: 'Men' },
];

const initial = {
  category: 'Miss India', fullName: '', guardianName: '', gender: 'Female', dob: '', age: '',
  phone: '', whatsapp: '', email: '', city: '', state: 'Uttar Pradesh', address: '',
  height: '', experience: 'Fresher', occupation: '', instagram: '', agree: false,
};

const ageFromDob = (dob) => {
  if (!dob) return '';
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age > 0 && age < 120 ? String(age) : '';
};

export default function RegistrationDrawer() {
  const { open, closeForm } = useRegistration();
  const [form, setForm] = useState(initial);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && closeForm();
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, closeForm]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'dob') next.age = ageFromDob(value);
      if (key === 'category') next.gender = value === 'Mr. India' ? 'Male' : 'Female';
      return next;
    });
  };

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB'); return; }
    setError('');
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const age = Number(form.age);
    if (!(age >= 15 && age <= 45)) return setError('Age must be between 15 and 45 years.');
    if (form.phone.replace(/\D/g, '').length < 10) return setError('Please enter a valid 10-digit mobile number.');
    if (!form.agree) return setError('Please accept the terms to continue.');

    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, String(v)));
    if (photo) body.append('photo', photo);

    setBusy(true);
    try {
      const res = await api.post('/api/registrations', body);
      setDone({ ...res, phone: form.phone.replace(/\D/g, '').slice(-10) });
      setForm(initial);
      setPhoto(null);
      setPreview('');
      panelRef.current?.scrollTo(0, 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const close = () => { closeForm(); setTimeout(() => setDone(null), 400); };

  const lookupQuery = done ? `?reg=${encodeURIComponent(done.regId)}&phone=${done.phone}` : '';

  return (
    <div className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="drawer__backdrop" onClick={close} />
      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="reg-title" tabIndex={-1} ref={panelRef}>
        <div className="drawer__head">
          <div>
            <p className="drawer__eyebrow"><Crown size={16} /> {EVENT.subtitle}</p>
            <h2 id="reg-title">{done ? 'Registration Successful' : 'Registration Form'}</h2>
          </div>
          <button className="icon-btn icon-btn--light" onClick={close} aria-label="Close registration form"><Close /></button>
        </div>

        {done ? (
          <div className="drawer__body reg-done">
            <div className="reg-done__icon"><Check size={34} /></div>
            <p className="script reg-done__script">Welcome, {done.fullName.split(' ')[0]}!</p>
            <p>You are registered for <strong>{done.category}</strong>. Save your Registration ID — you'll need it with your mobile number for your ID card and certificate.</p>
            <div className="reg-done__id">
              <span>Registration ID</span>
              <strong>{done.regId}</strong>
            </div>
            <div className="reg-done__actions">
              <Link className="btn btn--gold btn--block" to={`/id-card${lookupQuery}`} onClick={close}><Badge size={18} /> Download ID Card</Link>
              <Link className="btn btn--ghost btn--block" to={`/certificate${lookupQuery}`} onClick={close}><Award size={18} /> Participation Certificate</Link>
            </div>
            <p className="reg-done__note">Our team will call you on your mobile number to confirm your slot. {EVENT.feeNote}</p>
          </div>
        ) : (
          <form className="drawer__body reg-form" onSubmit={submit} noValidate>
            <fieldset className="reg-form__group">
              <legend>Choose your category</legend>
              <div className="cat-picker">
                {CATEGORIES.map((c) => (
                  <label key={c.value} className={`cat-picker__opt ${form.category === c.value ? 'is-active' : ''}`}>
                    <input type="radio" name="category" value={c.value} checked={form.category === c.value} onChange={set('category')} />
                    <strong>{c.value}</strong>
                    <small>{c.note}</small>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="reg-form__group">
              <legend>Personal details</legend>
              <div className="photo-pick">
                <label className="photo-pick__box">
                  {preview ? <img src={preview} alt="Your photo preview" /> : <><Upload size={22} /><span>Photo</span></>}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} hidden />
                </label>
                <p>Upload a clear, front-facing photo (JPG/PNG, max 5 MB). It will appear on your ID card.</p>
              </div>
              <div className="field">
                <label htmlFor="r-name">Full name <span className="req">*</span></label>
                <input id="r-name" className="input" value={form.fullName} onChange={set('fullName')} required autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="r-guardian">Father's / Husband's name</label>
                <input id="r-guardian" className="input" value={form.guardianName} onChange={set('guardianName')} />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="r-dob">Date of birth <span className="req">*</span></label>
                  <input id="r-dob" type="date" className="input" value={form.dob} onChange={set('dob')} required />
                </div>
                <div className="field">
                  <label htmlFor="r-age">Age (15–45) <span className="req">*</span></label>
                  <input id="r-age" type="number" min="15" max="45" className="input" value={form.age} onChange={set('age')} required />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="r-height">Height</label>
                  <input id="r-height" className="input" placeholder={`e.g. 5'6"`} value={form.height} onChange={set('height')} />
                </div>
                <div className="field">
                  <label htmlFor="r-exp">Experience</label>
                  <select id="r-exp" className="select" value={form.experience} onChange={set('experience')}>
                    <option>Fresher</option>
                    <option>Professional</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="r-occ">Occupation</label>
                <input id="r-occ" className="input" placeholder="Student, model, professional…" value={form.occupation} onChange={set('occupation')} />
              </div>
            </fieldset>

            <fieldset className="reg-form__group">
              <legend>Contact</legend>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="r-phone">Mobile number <span className="req">*</span></label>
                  <input id="r-phone" type="tel" inputMode="numeric" className="input" placeholder="10-digit mobile" value={form.phone} onChange={set('phone')} required autoComplete="tel" />
                </div>
                <div className="field">
                  <label htmlFor="r-wa">WhatsApp number</label>
                  <input id="r-wa" type="tel" inputMode="numeric" className="input" placeholder="If different" value={form.whatsapp} onChange={set('whatsapp')} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="r-email">Email</label>
                <input id="r-email" type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="r-ig">Instagram handle</label>
                <input id="r-ig" className="input" placeholder="@yourhandle" value={form.instagram} onChange={set('instagram')} />
              </div>
            </fieldset>

            <fieldset className="reg-form__group">
              <legend>Address</legend>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="r-city">City <span className="req">*</span></label>
                  <input id="r-city" className="input" value={form.city} onChange={set('city')} required autoComplete="address-level2" />
                </div>
                <div className="field">
                  <label htmlFor="r-state">State</label>
                  <select id="r-state" className="select" value={form.state} onChange={set('state')}>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="r-addr">Full address</label>
                <textarea id="r-addr" className="textarea" rows={2} style={{ minHeight: 70 }} value={form.address} onChange={set('address')} />
              </div>
            </fieldset>

            <div className="reg-form__fee">
              <span>Registration Fee: <strong>{EVENT.fee}</strong></span>
              <span>Includes {EVENT.includes.join(', ')}</span>
            </div>

            <label className="check">
              <input type="checkbox" checked={form.agree} onChange={set('agree')} />
              <span>I confirm the details are correct and I understand that {EVENT.feeNote.charAt(0).toLowerCase() + EVENT.feeNote.slice(1)}</span>
            </label>

            {error && <div className="alert alert--error" role="alert">{error}</div>}

            <button className="btn btn--rose btn--block" disabled={busy}>
              {busy ? <><span className="spinner" /> Submitting…</> : <>Submit Registration</>}
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
