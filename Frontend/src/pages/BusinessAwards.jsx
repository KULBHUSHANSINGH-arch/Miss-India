import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useRegistration } from '../components/RegistrationContext.jsx';
import { PageHero, Pic, Reveal, SectionHead, Lightbox } from '../components/Shared.jsx';
import { Calendar, Crown, MapPin, Users, Rupee, Trophy, Star, Award, Check, Eye, Phone, Mail, Globe, Gift } from '../components/Icons.jsx';
import { EVENT } from '../data/event.js';
import {
  AWARDS, ABOUT_AWARDS, PACKAGES, PRIZES, WE_PROVIDE, AWARD_TITLES, NOMINATION_CATEGORIES,
  RECENT_EVENT_TEXT, RECENT_EVENT_PICS,
} from '../data/awards.js';

export default function BusinessAwards() {
  const { openEnquiry } = useRegistration();
  const { hash } = useLocation();
  const [lb, setLb] = useState(null);
  const close = useCallback(() => setLb(null), []);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  const details = [
    { icon: Calendar, label: 'Date', value: AWARDS.date },
    { icon: MapPin, label: 'Venue', value: `${AWARDS.venue}, ${AWARDS.city}` },
    { icon: Users, label: 'Presented By', value: AWARDS.presentedBy },
    { icon: Star, label: 'Chief Guests', value: AWARDS.chiefGuests },
  ];

  return (
    <>
      <PageHero
        eyebrow={`Presented by ${AWARDS.presentedBy}`}
        title="International Business Icon"
        script="Awards 2026"
        text={`${AWARDS.city} · ${AWARDS.date} · ${AWARDS.venue}`}
      />

      {/* About */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="About the event" title="Honouring India's business achievers" />
          <div className="benefits">
            <Reveal className="benefit">
              <div className="benefit__head">
                <span className="benefit__icon"><Trophy size={28} /></span>
                <h3>About the Awards</h3>
              </div>
              <ul className="benefit__list">
                {ABOUT_AWARDS.map((t) => <li key={t}><Crown size={16} /> {t}</li>)}
              </ul>
            </Reveal>
            <Reveal className="details-grid awards-details" delay={100}>
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="detail">
                  <span className="detail__icon"><Icon size={22} /></span>
                  <div>
                    <span className="detail__label">{label}</span>
                    <strong>{value}</strong>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Registration fee / packages */}
      <section className="section section--dark" id="registration-fee">
        <div className="container">
          <SectionHead
            eyebrow="Registration Fee"
            title="Registration & sponsorship packages"
            text="Register for any one package to become our sponsor or event partner. Each package offers different benefits."
          />
          <div className="packages">
            {PACKAGES.map((p, i) => (
              <Reveal key={p.name} className={`package card--dark ${p.featured ? 'package--featured' : ''}`} delay={i * 80}>
                <h3>{p.name}</h3>
                <div className="package__price"><Rupee size={22} /> {p.price}<small>INR</small></div>
                <span className="chip">{p.note}</span>
                <ul className="benefit__list package__list">
                  {p.points.map((pt) => <li key={pt}><Check size={16} /> {pt}</li>)}
                </ul>
              </Reveal>
            ))}
          </div>
          <Reveal className="center-row">
            <button className="btn btn--gold" onClick={openEnquiry}><Phone size={18} /> Enquire About Packages</button>
          </Reveal>
        </div>
      </section>

      {/* Prize money */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Prize money" title="Prizes & rewards" />
          <div className="prizes">
            {PRIZES.map((p, i) => (
              <Reveal key={p.title} className={`prize ${i === 0 ? 'prize--winner' : ''}`} delay={i * 80}>
                <span className="benefit__icon"><Trophy size={26} /></span>
                <span className="detail__label">{p.title}</span>
                <strong className="prize__amount">₹{p.amount}/-</strong>
              </Reveal>
            ))}
          </div>
          <Reveal className="benefit awards-provide">
            <div className="benefit__head">
              <span className="benefit__icon benefit__icon--rose"><Gift size={24} /></span>
              <h3>We Provide</h3>
            </div>
            <ul className="benefit__list benefit__list--cols">
              {WE_PROVIDE.map((b) => <li key={b}><Star size={16} /> {b}</li>)}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Award titles */}
      <section className="section section--cream">
        <div className="container">
          <SectionHead eyebrow="Award titles" title="Awards you can win" text="Awards are given as trophies and monuments that suit the title the winner holds." />
          <div className="award-titles">
            {AWARD_TITLES.map((a, i) => (
              <Reveal key={a.title} className="detail" delay={(i % 3) * 60}>
                <span className="detail__icon"><Award size={22} /></span>
                <div>
                  <strong>{a.title}</strong>
                  {a.text && <p className="award-titles__text">{a.text}</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Nomination categories */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Nominations open" title="Nomination categories" text="Companies, entrepreneurs and service providers from every segment of business can apply." />
          <div className="nominations">
            {NOMINATION_CATEGORIES.map((c, i) => (
              <Reveal key={c.name} className="benefit" delay={(i % 3) * 80}>
                <h3 className="nominations__title">{c.name}</h3>
                <ul className="benefit__list">
                  {c.items.map((it) => <li key={it}><Check size={16} /> {it}</li>)}
                </ul>
              </Reveal>
            ))}
          </div>
          <Reveal className="notice">
            <Star size={22} />
            <p><strong>Note:</strong> If your business does not fit any category above, get in touch with us — we will help you file your nomination.</p>
          </Reveal>
        </div>
      </section>

      {/* Recent event pics */}
      <section className="section section--cream" id="recent-events">
        <div className="container">
          <SectionHead eyebrow="Gallery" title="Our Recent Event Pics" text={RECENT_EVENT_TEXT} />
          <div className="event-pics">
            {RECENT_EVENT_PICS.map((img, i) => (
              <Reveal key={img.src} delay={(i % 4) * 60}>
                <button className="poster event-pics__item" onClick={() => setLb(i)} aria-label={`View ${img.alt}`}>
                  <Pic img={img} />
                  <span className="poster__zoom"><Eye size={20} /> View</span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="section section--dark">
        <div className="container">
          <SectionHead
            eyebrow="Contact us"
            title="Register as sponsor or event partner"
            text="For registration, queries or doubts, reach us at the numbers and email below."
          />
          <Reveal className="awards-contact">
            {EVENT.phones.map((p) => (
              <a key={p} className="detail" href={`tel:${p.replace(/\s/g, '')}`}>
                <span className="detail__icon"><Phone size={22} /></span>
                <div><span className="detail__label">Call</span><strong>{p}</strong></div>
              </a>
            ))}
            <a className="detail" href={`mailto:${AWARDS.email}`}>
              <span className="detail__icon"><Mail size={22} /></span>
              <div><span className="detail__label">Email</span><strong>{AWARDS.email}</strong></div>
            </a>
            <a className="detail" href={`https://${AWARDS.website}`} target="_blank" rel="noopener noreferrer">
              <span className="detail__icon"><Globe size={22} /></span>
              <div><span className="detail__label">Website</span><strong>{AWARDS.website}</strong></div>
            </a>
          </Reveal>
        </div>
      </section>

      <Lightbox items={RECENT_EVENT_PICS} index={lb} onClose={close} onIndex={setLb} />
    </>
  );
}
