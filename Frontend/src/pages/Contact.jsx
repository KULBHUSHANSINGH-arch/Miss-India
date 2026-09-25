import { PageHero, Reveal } from '../components/Shared.jsx';
import { Phone, Whatsapp, MapPin, Calendar } from '../components/Icons.jsx';
import { EnquiryFlow } from '../components/EnquiryForm.jsx';
import { EVENT } from '../data/event.js';

export default function Contact() {
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
            <h2 className="h-display">Quick enquiry</h2>
            <p className="muted">Just pick your question — no typing needed. You get the answer instantly and our team calls you back.</p>
            <EnquiryFlow source="contact-page" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
