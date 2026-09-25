import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Upload, Check, Badge, Award, Arrow, Phone, Whatsapp, FileText, Calendar, MapPin } from '../components/Icons.jsx';
import { api } from '../lib/api.js';
import { ageFromDob, onlyDigits, isEmail } from '../lib/format.js';
import { EVENT, STATES, CATEGORIES } from '../data/event.js';

const DRAFT_KEY = 'mi_registration_draft';

const EMPTY = {
  category: '', fullName: '', dob: '', age: '', gender: '',
  phone: '', whatsapp: '', sameWhatsapp: true, email: '', city: '', state: '',
  address: '', heightFt: '', heightIn: '', occupation: '', instagram: '', facebook: '',
  experience: '', experienceDetails: '',
  whyParticipate: '', strengths: '', mediaExperience: '', comfortableGrooming: '',
  feeAcknowledged: false, paymentRef: '',
  guardianName: '', guardianRelation: '', guardianPhone: '', guardianConsent: false,
  agree: false,
};

const FILES = {
  photo: { label: 'Recent close-up photograph', hint: 'Front-facing, plain background. Used on your ID card.', accept: 'image/jpeg,image/png,image/webp' },
  photoFull: { label: 'Full-length photograph', hint: 'Head-to-toe, standing straight.', accept: 'image/jpeg,image/png,image/webp' },
  idProof: { label: 'ID / Date-of-birth proof', hint: 'Aadhaar, PAN, passport or birth certificate. Image or PDF.', accept: 'image/jpeg,image/png,image/webp,application/pdf' },
  paymentProof: { label: 'Payment screenshot / proof', hint: 'Image or PDF.', accept: 'image/jpeg,image/png,image/webp,application/pdf' },
};

const STEPS = [
  { title: 'Applicant', sub: 'Contact & basic details' },
  { title: 'Profile', sub: 'Personal details' },
  { title: 'Photos', sub: 'Photographs & ID' },
  { title: 'Pageant', sub: 'About you' },
  { title: 'Submit', sub: 'Payment & consent' },
];

// Fields the ID card needs — drives the "profile completeness" meter.
const CARD_KEYS = ['fullName', 'phone', 'email', 'address', 'category', 'gender', 'dob', 'city', 'state'];

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    return saved ? { ...EMPTY, ...saved, agree: false } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(loadDraft);
  const [files, setFiles] = useState({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const topRef = useRef(null);

  // Save typed answers (not files) so a refresh doesn't lose them.
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, agree: false })); } catch { /* storage blocked */ }
  }, [form]);

  useEffect(() => () => Object.values(files).forEach((f) => f?.preview && URL.revokeObjectURL(f.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = 'Register · Miss India 2026';
    return () => { document.title = "Miss India 2026 · Global India's Biggest Beauty Pageant"; };
  }, []);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'dob') next.age = ageFromDob(value);
      if (key === 'category') next.gender = CATEGORIES.find((c) => c.value === value)?.gender || f.gender;
      if (key === 'phone' || key === 'whatsapp' || key === 'guardianPhone') next[key] = onlyDigits(value);
      return next;
    });
    setErrors((er) => ({ ...er, [key]: '' }));
  };
  const choose = (key, value) => set(key)({ target: { value, type: 'radio' } });

  const pickFile = (key) => (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors((er) => ({ ...er, [key]: 'File must be under 5 MB' })); return; }
    setErrors((er) => ({ ...er, [key]: '' }));
    setFiles((fs) => {
      if (fs[key]?.preview) URL.revokeObjectURL(fs[key].preview);
      return { ...fs, [key]: { file, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '' } };
    });
  };
  const removeFile = (key) => setFiles((fs) => {
    if (fs[key]?.preview) URL.revokeObjectURL(fs[key].preview);
    const next = { ...fs };
    delete next[key];
    return next;
  });

  const age = Number(form.age);
  const minor = form.age !== '' && age < 18;

  const completeness = useMemo(() => {
    const have = CARD_KEYS.filter((k) => String(form[k] || '').trim()).length + (files.photo ? 1 : 0);
    return Math.round((have / (CARD_KEYS.length + 1)) * 100);
  }, [form, files.photo]);

  function validate(upTo) {
    const er = {};
    if (upTo >= 0) {
      if (!form.fullName.trim()) er.fullName = 'Please enter your full name';
      if (form.phone.length !== 10) er.phone = 'Enter a valid 10-digit mobile number';
      if (!isEmail(form.email)) er.email = 'Enter a valid email address';
      if (form.address.trim().length < 5) er.address = 'Please enter your full address';
      if (!form.sameWhatsapp && form.whatsapp && form.whatsapp.length !== 10) er.whatsapp = 'Enter a valid 10-digit number';
      if (form.age !== '' && (age < 15 || age > 45)) er.dob = `Age must be between 15 and 45 years (you are ${form.age})`;
    }
    if (upTo >= 4 && !form.agree) er.agree = 'Please accept the declaration to submit';
    return er;
  }

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const goTo = (target) => {
    if (target > step) {
      const er = validate(0);
      if (Object.keys(er).length) {
        setErrors(er);
        setStep(0);
        scrollTop();
        return;
      }
    }
    setError('');
    setStep(target);
    scrollTop();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) return goTo(step + 1);
    const er = validate(4);
    setErrors(er);
    if (Object.keys(er).length) {
      if (!er.agree) { setStep(0); scrollTop(); }
      return;
    }

    const body = new FormData();
    const { heightFt, heightIn, sameWhatsapp, ...rest } = form;
    Object.entries(rest).forEach(([k, v]) => body.append(k, String(v)));
    body.set('whatsapp', sameWhatsapp ? form.phone : form.whatsapp);
    body.append('height', heightFt ? `${heightFt}'${heightIn || 0}"` : '');
    Object.entries(files).forEach(([k, f]) => body.append(k, f.file));

    setBusy(true);
    setError('');
    try {
      const res = await api.post('/api/registrations', body);
      setDone(res);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* storage blocked */ }
      scrollTop();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) return <Success reg={done} onIdCard={() => navigate('/id-card', { state: { regId: done.regId, phone: done.phone } })} />;

  const fieldErr = (k) => errors[k] && <span className="field__error" role="alert">{errors[k]}</span>;

  return (
    <section className="register" ref={topRef}>
      <div className="register__bg" aria-hidden="true" />
      <div className="container register__grid">
        {/* ---------- Side panel ---------- */}
        <aside className="register__side">
          <div className="register__brand">
            <span className="eyebrow">Application form</span>
            <h1>Mr. Miss. &amp; Mrs. <span className="gold-text">India 2026</span></h1>
            <p>{EVENT.tagline}</p>
          </div>

          <ol className="stepper" aria-label="Form steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`stepper__item ${i === step ? 'is-current' : ''} ${i < step ? 'is-done' : ''}`}>
                <button type="button" onClick={() => goTo(i)} aria-current={i === step ? 'step' : undefined}>
                  <span className="stepper__dot">{i < step ? <Check size={16} /> : i + 1}</span>
                  <span className="stepper__text"><strong>{s.title}</strong><small>{s.sub}</small></span>
                </button>
              </li>
            ))}
          </ol>

          <div className="meter">
            <div className="meter__head">
              <span>ID card readiness</span>
              <strong>{completeness}%</strong>
            </div>
            <div className="meter__bar"><span style={{ width: `${completeness}%` }} /></div>
            <small>Fill category, gender, date of birth, city, state and a close-up photo to unlock your ID card instantly.</small>
          </div>

          <ul className="register__facts">
            <li><Calendar size={16} /> Audition / Grooming · <strong>{EVENT.auditionDate}</strong></li>
            <li><Crown size={16} /> Grand Finale · <strong>{EVENT.finaleDate}</strong></li>
            <li><MapPin size={16} /> {EVENT.venue}, {EVENT.city}</li>
            <li><Phone size={16} /> {EVENT.phones.join(' · ')}</li>
          </ul>
        </aside>

        {/* ---------- Form ---------- */}
        <form className="register__card" onSubmit={submit} noValidate>
          <div className="register__progress" aria-hidden="true">
            <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <header className="register__head">
            <span className="register__count">Step {step + 1} of {STEPS.length}</span>
            <h2>{['Applicant Details', 'Personal Details', 'Photograph & Profile', 'Pageant Information', 'Registration & Consent'][step]}</h2>
            {step === 0 && <p>Fields marked <span className="req">*</span> are required. Everything else is optional — but a complete profile unlocks your ID card.</p>}
          </header>

          {step === 0 && (
            <div className="register__body">
              <fieldset className="fs">
                <legend>Category</legend>
                <div className="cat-picker">
                  {CATEGORIES.map((c) => (
                    <label key={c.value} className={`cat-picker__opt cat-picker__opt--${c.value.split(/[.\s]/)[0].toLowerCase()} ${form.category === c.value ? 'is-active' : ''}`}>
                      <input type="radio" name="category" value={c.value} checked={form.category === c.value} onChange={set('category')} />
                      <Crown size={26} />
                      <strong>{c.value}</strong>
                      <small>{c.note}</small>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="field">
                <label htmlFor="r-name">Full name <span className="req">*</span></label>
                <input id="r-name" className={`input ${errors.fullName ? 'is-invalid' : ''}`} value={form.fullName} onChange={set('fullName')} autoComplete="name" placeholder="As on your ID proof" />
                {fieldErr('fullName')}
              </div>

              <div className="grid-3">
                <div className="field">
                  <label htmlFor="r-dob">Date of birth</label>
                  <input id="r-dob" type="date" className={`input ${errors.dob ? 'is-invalid' : ''}`} value={form.dob} onChange={set('dob')} max={new Date().toISOString().slice(0, 10)} />
                </div>
                <div className="field">
                  <label htmlFor="r-age">Age</label>
                  <input id="r-age" className="input" value={form.age ? `${form.age} years` : ''} readOnly placeholder="Auto" tabIndex={-1} />
                </div>
                <div className="field">
                  <span className="field__label">Gender</span>
                  <div className="pills" role="radiogroup" aria-label="Gender">
                    {['Female', 'Male', 'Other'].map((g) => (
                      <button type="button" key={g} role="radio" aria-checked={form.gender === g} className={`pill-opt ${form.gender === g ? 'is-active' : ''}`} onClick={() => choose('gender', g)}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
              {fieldErr('dob')}

              <div className="grid-2">
                <div className="field">
                  <label htmlFor="r-phone">Mobile number <span className="req">*</span></label>
                  <div className={`input-group ${errors.phone ? 'is-invalid' : ''}`}>
                    <span>+91</span>
                    <input id="r-phone" type="tel" inputMode="numeric" className="input" value={form.phone} onChange={set('phone')} autoComplete="tel-national" placeholder="10-digit mobile" />
                  </div>
                  {fieldErr('phone')}
                </div>
                <div className="field">
                  <label htmlFor="r-email">Email ID <span className="req">*</span></label>
                  <input id="r-email" type="email" className={`input ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" />
                  {fieldErr('email')}
                </div>
              </div>

              <div className="field">
                <label className="check check--inline">
                  <input type="checkbox" checked={form.sameWhatsapp} onChange={set('sameWhatsapp')} />
                  <span>My WhatsApp number is the same as my mobile number</span>
                </label>
                {!form.sameWhatsapp && (
                  <div className={`input-group ${errors.whatsapp ? 'is-invalid' : ''}`}>
                    <span><Whatsapp size={16} /></span>
                    <input type="tel" inputMode="numeric" className="input" aria-label="WhatsApp number" value={form.whatsapp} onChange={set('whatsapp')} placeholder="WhatsApp number" />
                  </div>
                )}
                {fieldErr('whatsapp')}
              </div>

              <div className="field">
                <label htmlFor="r-addr">Full address <span className="req">*</span></label>
                <textarea id="r-addr" className={`textarea ${errors.address ? 'is-invalid' : ''}`} rows={3} value={form.address} onChange={set('address')} autoComplete="street-address" placeholder="House no., street, locality, PIN code" />
                {fieldErr('address')}
              </div>

              <div className="grid-2">
                <div className="field">
                  <label htmlFor="r-city">City</label>
                  <input id="r-city" className="input" value={form.city} onChange={set('city')} autoComplete="address-level2" />
                </div>
                <div className="field">
                  <label htmlFor="r-state">State</label>
                  <select id="r-state" className="select" value={form.state} onChange={set('state')}>
                    <option value="">Select state…</option>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="register__body">
              <div className="grid-2">
                <div className="field">
                  <span className="field__label">Height</span>
                  <div className="grid-2 grid-2--tight">
                    <select className="select" aria-label="Height feet" value={form.heightFt} onChange={set('heightFt')}>
                      <option value="">Feet</option>
                      {[4, 5, 6, 7].map((n) => <option key={n} value={n}>{n} ft</option>)}
                    </select>
                    <select className="select" aria-label="Height inches" value={form.heightIn} onChange={set('heightIn')} disabled={!form.heightFt}>
                      <option value="">Inches</option>
                      {Array.from({ length: 12 }, (_, n) => <option key={n} value={n}>{n} in</option>)}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="r-occ">Profession / Occupation</label>
                  <input id="r-occ" className="input" value={form.occupation} onChange={set('occupation')} placeholder="Student, model, professional…" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="r-ig">Instagram ID</label>
                  <input id="r-ig" className="input" value={form.instagram} onChange={set('instagram')} placeholder="@yourhandle" />
                </div>
                <div className="field">
                  <label htmlFor="r-fb">Facebook profile / page</label>
                  <input id="r-fb" className="input" value={form.facebook} onChange={set('facebook')} placeholder="facebook.com/…" />
                </div>
              </div>
              <div className="field">
                <span className="field__label">Previous modelling / pageant experience</span>
                <div className="choice-cards">
                  {[['Fresher', 'New to the ramp — we will groom you'], ['Experienced', 'I have walked / modelled before']].map(([v, note]) => (
                    <button type="button" key={v} className={`choice-card ${form.experience === v ? 'is-active' : ''}`} aria-pressed={form.experience === v} onClick={() => choose('experience', v)}>
                      <strong>{v}</strong><small>{note}</small>
                    </button>
                  ))}
                </div>
              </div>
              {form.experience === 'Experienced' && (
                <div className="field">
                  <label htmlFor="r-expd">Experience details</label>
                  <textarea id="r-expd" className="textarea" rows={3} value={form.experienceDetails} onChange={set('experienceDetails')} placeholder="Shows, pageants, brands, titles…" />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="register__body">
              <div className="uploads">
                {['photo', 'photoFull', 'idProof'].map((k) => (
                  <FileTile key={k} name={k} meta={FILES[k]} value={files[k]} onPick={pickFile(k)} onRemove={() => removeFile(k)} error={errors[k]} />
                ))}
              </div>
              <p className="hint">JPG, PNG or WEBP up to 5 MB each (ID proof can also be a PDF). ID proof and full-length photo are seen only by the organizers.</p>
            </div>
          )}

          {step === 3 && (
            <div className="register__body">
              <div className="field">
                <label htmlFor="r-why">Why do you want to participate in Mr. Miss. &amp; Mrs. India 2026?</label>
                <textarea id="r-why" className="textarea" rows={4} value={form.whyParticipate} onChange={set('whyParticipate')} maxLength={2000} />
              </div>
              <div className="field">
                <label htmlFor="r-str">What are your strengths / personality qualities?</label>
                <textarea id="r-str" className="textarea" rows={4} value={form.strengths} onChange={set('strengths')} maxLength={2000} />
              </div>
              <YesNo label="Previous fashion show / pageant / TV / web-series / music-video experience?" value={form.mediaExperience} onChange={(v) => choose('mediaExperience', v)} />
              <YesNo label="Comfortable with professional grooming, makeup and designer outfits?" value={form.comfortableGrooming} onChange={(v) => choose('comfortableGrooming', v)} />
            </div>
          )}

          {step === 4 && (
            <div className="register__body">
              <div className="fee-card">
                <div>
                  <span className="fee-card__label">Registration fee</span>
                  <strong className="fee-card__value">{EVENT.fee}</strong>
                </div>
                <ul>
                  {EVENT.includes.map((x) => <li key={x}><Check size={14} /> {x}</li>)}
                </ul>
              </div>
              <label className="check">
                <input type="checkbox" checked={form.feeAcknowledged} onChange={set('feeAcknowledged')} />
                <span>I understand that a registration fee is applicable ({EVENT.fee}) and will be confirmed by the organizers.</span>
              </label>
              <div className="field">
                <label htmlFor="r-pay">Payment reference / Transaction ID</label>
                <input id="r-pay" className="input" value={form.paymentRef} onChange={set('paymentRef')} placeholder="UPI / bank transaction ID (if paid)" />
              </div>
              <FileTile name="paymentProof" meta={FILES.paymentProof} value={files.paymentProof} onPick={pickFile('paymentProof')} onRemove={() => removeFile('paymentProof')} error={errors.paymentProof} compact />

              <fieldset className={`fs fs--box ${minor ? 'is-required' : ''}`}>
                <legend>Parent / Guardian consent {minor ? <span className="chip chip--warn">Required — you are under 18</span> : <small>(only for participants below 18)</small>}</legend>
                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="r-gname">Parent / guardian name</label>
                    <input id="r-gname" className="input" value={form.guardianName} onChange={set('guardianName')} />
                  </div>
                  <div className="field">
                    <label htmlFor="r-grel">Relationship with applicant</label>
                    <select id="r-grel" className="select" value={form.guardianRelation} onChange={set('guardianRelation')}>
                      <option value="">Select…</option>
                      {['Father', 'Mother', 'Legal Guardian', 'Other'].map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="r-gphone">Parent / guardian mobile</label>
                  <input id="r-gphone" type="tel" inputMode="numeric" className="input" value={form.guardianPhone} onChange={set('guardianPhone')} />
                </div>
                <label className="check">
                  <input type="checkbox" checked={form.guardianConsent} onChange={set('guardianConsent')} />
                  <span>I am the parent / legal guardian of the applicant and consent to their participation in the event.</span>
                </label>
              </fieldset>

              <div className="declaration">
                <h3><FileText size={18} /> Declaration &amp; consent</h3>
                <p>I hereby declare that the information provided by me in this application form is true and correct to the best of my knowledge. I understand that submission of this form does not by itself guarantee selection as a finalist. I agree to follow the rules, guidelines and decisions of the organizers.</p>
                <p>I understand that the registration fee, once the registration is confirmed, is non-refundable and non-transferable, subject to the official terms and conditions communicated by the organizers.</p>
                <label className={`check check--strong ${errors.agree ? 'is-invalid' : ''}`}>
                  <input type="checkbox" checked={form.agree} onChange={set('agree')} />
                  <span>I agree to the above Declaration and Terms &amp; Conditions. <span className="req">*</span></span>
                </label>
                {fieldErr('agree')}
              </div>
            </div>
          )}

          {error && <div className="alert alert--error register__alert" role="alert">{error}</div>}

          <footer className="register__foot">
            {step > 0 ? (
              <button type="button" className="btn btn--ghost" onClick={() => goTo(step - 1)}>← Back</button>
            ) : <span />}
            {step < STEPS.length - 1 ? (
              <button type="submit" className="btn btn--rose">Continue <Arrow size={18} /></button>
            ) : (
              <button type="submit" className="btn btn--gold" disabled={busy}>
                {busy ? <><span className="spinner" /> Submitting…</> : <><Crown size={18} /> Submit Application</>}
              </button>
            )}
          </footer>
          {step > 0 && step < STEPS.length - 1 && (
            <button type="button" className="register__skip" onClick={() => goTo(STEPS.length - 1)}>
              Skip optional steps and go to submit →
            </button>
          )}
        </form>
      </div>
    </section>
  );
}

function YesNo({ label, value, onChange }) {
  return (
    <div className="field yesno">
      <span className="field__label">{label}</span>
      <div className="pills" role="radiogroup" aria-label={label}>
        {['Yes', 'No'].map((v) => (
          <button type="button" key={v} role="radio" aria-checked={value === v} className={`pill-opt ${value === v ? 'is-active' : ''}`} onClick={() => onChange(v)}>{v}</button>
        ))}
      </div>
    </div>
  );
}

function FileTile({ name, meta, value, onPick, onRemove, error, compact = false }) {
  const id = `file-${name}`;
  return (
    <div className={`file-tile ${value ? 'has-file' : ''} ${compact ? 'file-tile--compact' : ''} ${error ? 'is-invalid' : ''}`}>
      <label htmlFor={id} className="file-tile__drop">
        {value?.preview ? (
          <img src={value.preview} alt="" />
        ) : value ? (
          <span className="file-tile__doc"><FileText size={30} /><small>{value.file.name}</small></span>
        ) : (
          <span className="file-tile__empty"><Upload size={26} /><small>Tap to upload</small></span>
        )}
      </label>
      <input id={id} type="file" accept={meta.accept} onChange={onPick} className="sr-only" />
      <div className="file-tile__meta">
        <strong>{meta.label}</strong>
        <small>{meta.hint}</small>
        {value && <button type="button" className="linklike file-tile__remove" onClick={onRemove}>Remove</button>}
        {error && <span className="field__error">{error}</span>}
      </div>
    </div>
  );
}

function Success({ reg, onIdCard }) {
  const ready = !reg.missing.length;
  const wa = `https://wa.me/${EVENT.whatsapp}?text=${encodeURIComponent(`Hello, I have registered for ${EVENT.subtitle}.\nRegistration ID: ${reg.regId}\nName: ${reg.fullName}`)}`;
  return (
    <section className="register register--done">
      <div className="register__bg" aria-hidden="true" />
      <div className="container">
        <div className="success card">
          <div className="success__icon"><Check size={40} /></div>
          <p className="script success__script">Welcome, {reg.fullName.split(' ')[0]}!</p>
          <h1>Your application has been received</h1>
          <p className="muted">
            {reg.category ? <>You are registered for <strong>{reg.category}</strong>. </> : null}
            Save your Registration ID — you will need it with your mobile number for your ID card and certificate.
          </p>
          <div className="success__id">
            <span>Registration ID</span>
            <strong>{reg.regId}</strong>
          </div>
          {!ready && (
            <div className="alert alert--warn">
              Your ID card needs: {reg.missing.map((m) => m.label).join(', ')}. You can add them on the ID Card page.
            </div>
          )}
          <div className="success__actions">
            <button className="btn btn--gold" onClick={onIdCard}><Badge size={18} /> {ready ? 'Download ID Card' : 'Complete profile & get ID Card'}</button>
            <a className="btn btn--rose" href={wa} target="_blank" rel="noreferrer"><Whatsapp size={18} /> Send ID on WhatsApp</a>
            <Link className="btn btn--ghost" to="/certificate"><Award size={18} /> Certificate</Link>
          </div>
          <p className="success__note">Our team will call you on <strong>+91 {reg.phone}</strong> to confirm your slot. {EVENT.feeNote}</p>
        </div>
      </div>
    </section>
  );
}
