import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegistration } from './RegistrationContext.jsx';
import { Close, Crown, Check, Phone, Whatsapp, Arrow, Calendar, MapPin, Users, Sparkle } from './Icons.jsx';
import { api } from '../lib/api.js';
import { onlyDigits } from '../lib/format.js';
import { EVENT, IMAGES, ENQUIRY_TOPICS, ENQUIRY_INTERESTS } from '../data/event.js';

const EMPTY = { topic: '', interest: '', name: '', phone: '', city: '' };

/**
 * Lead form in the style of a Meta (Facebook/Instagram) instant form:
 * intro → pick your question (no typing) → contact info → review → thank-you with answer + contacts.
 */
export function EnquiryFlow({ source = 'website', onClose }) {
  const { openForm } = useRegistration();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === 'phone' ? onlyDigits(e.target.value) : e.target.value }));
  const topic = ENQUIRY_TOPICS.find((t) => t.topic === form.topic);

  const next = () => {
    setError('');
    if (step === 1 && !form.topic) return setError('Please choose what you would like to know.');
    if (step === 2) {
      if (!form.name.trim()) return setError('Please enter your name.');
      if (form.phone.length !== 10) return setError('Please enter a valid 10-digit mobile number.');
    }
    setStep((s) => s + 1);
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/api/enquiries', { ...form, source });
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setForm(EMPTY); setStep(0); };
  const waText = encodeURIComponent(`Hello, I am ${form.name || 'interested'}. I would like to know about: ${form.topic || EVENT.subtitle}.`);

  return (
    <div className="lead">
      {step < 4 && (
        <div className="lead__progress" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => <span key={i} className={i <= step ? 'is-on' : ''} />)}
        </div>
      )}

      {step === 0 && (
        <div className="lead__step">
          <div className="lead__cover">
            <img src={IMAGES.posterMissMrs.src} alt="" />
            <span className="lead__avatar"><Crown size={30} /></span>
          </div>
          <div className="lead__pad">
            <p className="lead__org">{EVENT.presentedBy}</p>
            <h3 className="lead__title">Get complete details of {EVENT.subtitle}</h3>
            <ul className="lead__bullets">
              <li><Users size={16} /> Age {EVENT.ageGroup} · Freshers &amp; professionals</li>
              <li><Sparkle size={16} /> {EVENT.includes.join(', ')} included</li>
              <li><Calendar size={16} /> Grand Finale · {EVENT.finaleDate}</li>
              <li><MapPin size={16} /> {EVENT.venue}, {EVENT.city}</li>
            </ul>
            <button className="btn btn--rose btn--block" onClick={next}>Continue <Arrow size={18} /></button>
            <p className="lead__fine">Takes less than 30 seconds · No typing needed for your question</p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="lead__step lead__pad">
          <h3 className="lead__q">What would you like to know?</h3>
          <div className="lead__options" role="radiogroup" aria-label="What would you like to know?">
            {ENQUIRY_TOPICS.map((t) => (
              <button type="button" key={t.topic} role="radio" aria-checked={form.topic === t.topic}
                className={`lead__option ${form.topic === t.topic ? 'is-active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, topic: t.topic }))}>
                <span className="lead__radio" />{t.topic}
              </button>
            ))}
          </div>
          <h3 className="lead__q lead__q--sm">I am interested in</h3>
          <div className="pills" role="radiogroup" aria-label="I am interested in">
            {ENQUIRY_INTERESTS.map((i) => (
              <button type="button" key={i} role="radio" aria-checked={form.interest === i}
                className={`pill-opt ${form.interest === i ? 'is-active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, interest: i }))}>{i}</button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="lead__step lead__pad">
          <h3 className="lead__q">Contact information</h3>
          <p className="lead__fine lead__fine--left">So our team can share the details with you.</p>
          <div className="field">
            <label htmlFor={`lq-name-${source}`}>Full name</label>
            <input id={`lq-name-${source}`} className="input" value={form.name} onChange={set('name')} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor={`lq-phone-${source}`}>Phone number</label>
            <div className="input-group">
              <span>+91</span>
              <input id={`lq-phone-${source}`} type="tel" inputMode="numeric" className="input" value={form.phone} onChange={set('phone')} autoComplete="tel-national" />
            </div>
          </div>
          <div className="field">
            <label htmlFor={`lq-city-${source}`}>City <small className="muted">(optional)</small></label>
            <input id={`lq-city-${source}`} className="input" value={form.city} onChange={set('city')} autoComplete="address-level2" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="lead__step lead__pad">
          <h3 className="lead__q">Review your info</h3>
          <dl className="lead__review">
            <div><dt>Question</dt><dd>{form.topic}</dd></div>
            {form.interest && <div><dt>Interested in</dt><dd>{form.interest}</dd></div>}
            <div><dt>Full name</dt><dd>{form.name}</dd></div>
            <div><dt>Phone number</dt><dd>+91 {form.phone}</dd></div>
            {form.city && <div><dt>City</dt><dd>{form.city}</dd></div>}
          </dl>
          <p className="lead__fine lead__fine--left">
            By submitting, you agree that {EVENT.presentedBy} may contact you on this number by call or WhatsApp about {EVENT.subtitle}.
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="lead__step lead__pad lead__done">
          <span className="lead__check"><Check size={30} /></span>
          <h3 className="lead__title">Thanks, {form.name.split(' ')[0]}!</h3>
          <p className="lead__fine">Our team will contact you on +91 {form.phone} shortly. Here's a quick answer:</p>
          {topic && (
            <div className="lead__answer">
              <strong>{topic.topic}</strong>
              <ul>{topic.answer.map((a) => <li key={a}><Check size={14} /> {a}</li>)}</ul>
            </div>
          )}
          <div className="lead__contacts">
            {EVENT.phones.map((p) => (
              <a key={p} className="btn btn--dark btn--sm" href={`tel:${p.replace(/\s/g, '')}`}><Phone size={16} /> {p}</a>
            ))}
            <a className="btn btn--rose btn--sm" href={`https://wa.me/${EVENT.whatsapp}?text=${waText}`} target="_blank" rel="noreferrer">
              <Whatsapp size={16} /> WhatsApp us
            </a>
          </div>
          <div className="lead__foot-actions">
            <button className="btn btn--gold btn--block" onClick={() => { onClose?.(); openForm(); }}><Crown size={18} /> Register Now</button>
            <button className="linklike" onClick={reset}>Ask something else</button>
          </div>
        </div>
      )}

      {error && <div className="alert alert--error lead__error" role="alert">{error}</div>}

      {step > 0 && step < 4 && (
        <div className="lead__nav">
          <button className="btn btn--ghost btn--sm" onClick={() => { setError(''); setStep((s) => s - 1); }}>Back</button>
          {step < 3 ? (
            <button className="btn btn--rose btn--sm" onClick={next}>Next</button>
          ) : (
            <button className="btn btn--gold btn--sm" onClick={submit} disabled={busy}>
              {busy ? <><span className="spinner" /> Sending…</> : 'Submit'}
            </button>
          )}
        </div>
      )}
      {step === 4 && <p className="lead__fine">Want more? <Link to="/event" onClick={onClose}>See full event details</Link></p>}
    </div>
  );
}

/** Floating "Enquire" button + modal, mounted once in the site layout. */
export default function EnquiryModal() {
  const { enquiryOpen, openEnquiry, closeEnquiry } = useRegistration();

  useEffect(() => {
    if (!enquiryOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && closeEnquiry();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [enquiryOpen, closeEnquiry]);

  return (
    <>
      <button className="fab" onClick={openEnquiry} aria-label="Quick enquiry">
        <Phone size={20} /><span>Enquire</span>
      </button>
      {enquiryOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Enquiry form">
          <div className="modal__backdrop" onClick={closeEnquiry} />
          <div className="modal__panel modal__panel--lead">
            <button className="modal__close icon-btn" onClick={closeEnquiry} aria-label="Close"><Close /></button>
            <EnquiryFlow source="popup" onClose={closeEnquiry} />
          </div>
        </div>
      )}
    </>
  );
}
