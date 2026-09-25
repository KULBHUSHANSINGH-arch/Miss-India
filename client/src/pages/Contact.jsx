import { useState } from 'react';
import { PageHero, Reveal } from '../components/Shared.jsx';
import { Phone, Whatsapp, MapPin, Calendar } from '../components/Icons.jsx';
import { EVENT } from '../data/event.js';

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Sends the enquiry straight to the organizers' WhatsApp.
  const submit = (e) => {
    e.preventDefault();
    const text = `Hello, I have an enquiry about Miss India 2026.\n\nName: ${form.name}\nPhone: ${form.phone}\n\n${form.message}`;
    window.open(`https://wa.me/${EVENT.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  return (
    <>
      <PageHero eyebrow="Contact" title="Let's talk" script="Crowns" text="Registration, enquiries, sponsorships or creator collaborations — we're a call away." />
      <section className="section">
        <div className="container contact">
          <div className="contact__cards">
            <Reveal className="contact-card">
              <span className="contact-card__icon"><Phone size={22} /></span>
              <div>
                <span className="contact-card__label">Registration / Enquiry</span>
                {EVENT.phones.map((p) => <a key={p} href={`tel:${p.replace(/\s/g, '')}`}>{p}</a>)}
              </div>
            </Reveal>
            <Reveal className="contact-card" delay={80}>
              <span className="contact-card__icon"><Whatsapp size={22} /></span>
              <div>
                <span className="contact-card__label">WhatsApp</span>
                <a href={`https://wa.me/${EVENT.whatsapp}`} target="_blank" rel="noreferrer">Chat with us</a>
              </div>
            </Reveal>
            <Reveal className="contact-card" delay={160}>
              <span className="contact-card__icon"><MapPin size={22} /></span>
              <div>
                <span className="contact-card__label">Venue</span>
                <strong>{EVENT.venue}</strong>
                <span>{EVENT.city}, Uttar Pradesh</span>
              </div>
            </Reveal>
            <Reveal className="contact-card" delay={240}>
              <span className="contact-card__icon"><Calendar size={22} /></span>
              <div>
                <span className="contact-card__label">Key dates</span>
                <span>Audition: <strong>{EVENT.auditionDate}</strong></span>
                <span>Finale: <strong>{EVENT.finaleDate}</strong></span>
              </div>
            </Reveal>
          </div>

          <Reveal className="card contact__form-card" delay={100}>
            <h2 className="h-display">Send an enquiry</h2>
            <p className="muted">Your message opens in WhatsApp, ready to send to our team.</p>
            <form onSubmit={submit} className="stack">
              <div className="field">
                <label htmlFor="c-name">Your name</label>
                <input id="c-name" className="input" value={form.name} onChange={set('name')} required />
              </div>
              <div className="field">
                <label htmlFor="c-phone">Mobile number</label>
                <input id="c-phone" type="tel" className="input" value={form.phone} onChange={set('phone')} required />
              </div>
              <div className="field">
                <label htmlFor="c-msg">Message</label>
                <textarea id="c-msg" className="textarea" value={form.message} onChange={set('message')} required />
              </div>
              <button className="btn btn--rose"><Whatsapp size={18} /> Send on WhatsApp</button>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}
