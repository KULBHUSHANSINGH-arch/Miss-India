import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useRegistration } from '../components/RegistrationContext.jsx';
import { PageHero, Pic, Reveal, SectionHead, Lightbox, Countdown } from '../components/Shared.jsx';
import { Calendar, Crown, MapPin, Users, Rupee, Gift, Trophy, Star, Dress, Brush, Eye } from '../components/Icons.jsx';
import { EVENT, IMAGES, HIGHLIGHTS, WINNER_BENEFITS, RUNNER_UP_BENEFITS, GUESTS } from '../data/event.js';

const POSTERS = [IMAGES.posterMissMrs, IMAGES.posterBusinessIcon, IMAGES.posterInvitation, IMAGES.posterMrMrs];
const HIGHLIGHT_ICONS = [Star, Dress, Brush];

export default function EventPage() {
  const { openForm } = useRegistration();
  const { hash } = useLocation();
  const [lb, setLb] = useState(null);
  const close = useCallback(() => setLb(null), []);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  const details = [
    { icon: Users, label: 'Age Group', value: EVENT.ageGroup },
    { icon: Rupee, label: 'Registration Fee', value: `${EVENT.fee}/-` },
    { icon: Gift, label: 'Includes', value: EVENT.includes.join(', ') },
    { icon: Calendar, label: 'Live Audition / Grooming', value: EVENT.auditionDate },
    { icon: Crown, label: 'Grand Finale', value: EVENT.finaleDate },
    { icon: MapPin, label: 'Venue', value: `${EVENT.venue}, ${EVENT.city}` },
  ];

  return (
    <>
      <PageHero eyebrow={EVENT.subtitle} title="The" script="Pageant" text={EVENT.tagline} />

      <section className="section">
        <div className="container">
          <div className="event-top">
            <Reveal className="details-grid">
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
            <Reveal className="event-count card--dark" delay={100}>
              <span className="eyebrow">Grand Finale in</span>
              <Countdown target={EVENT.finaleISO} />
              <p>{EVENT.finaleDate} · {EVENT.venue}, {EVENT.city}</p>
              <button className="btn btn--gold btn--block" onClick={openForm}><Crown size={18} /> Reserve Your Spot Today</button>
            </Reveal>
          </div>

          <Reveal className="notice">
            <MapPin size={22} />
            <p><strong>Note:</strong> {EVENT.tourNote}</p>
          </Reveal>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <SectionHead eyebrow="Competition highlights" title="Two rounds. One crown." />
          <div className="highlights">
            {HIGHLIGHTS.map((h, i) => {
              const Icon = HIGHLIGHT_ICONS[i];
              return (
                <Reveal key={h.title} className="highlight card--dark" delay={i * 100}>
                  <span className="highlight__num">0{i + 1}</span>
                  <span className="highlight__icon"><Icon size={28} /></span>
                  <h3>{h.title}</h3>
                  <p>{h.text}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="benefits">
        <div className="container">
          <SectionHead eyebrow="Rewards" title="Benefits & guests" />
          <div className="benefits">
            <Reveal className="benefit benefit--winner">
              <div className="benefit__head">
                <span className="benefit__icon"><Trophy size={28} /></span>
                <div><span className="eyebrow">For the winner</span><h3>Winner Benefits</h3></div>
              </div>
              <ul className="benefit__list benefit__list--cols">
                {WINNER_BENEFITS.map((b) => <li key={b}><Crown size={16} /> {b}</li>)}
              </ul>
            </Reveal>
            <div className="benefits__side">
              <Reveal className="benefit" delay={100}>
                <div className="benefit__head">
                  <span className="benefit__icon benefit__icon--rose"><Gift size={24} /></span>
                  <h3>Runner-Up Benefits</h3>
                </div>
                <ul className="benefit__list">
                  {RUNNER_UP_BENEFITS.map((b) => <li key={b}><Star size={16} /> {b}</li>)}
                </ul>
              </Reveal>
              {GUESTS.map((g, i) => (
                <Reveal key={g.label} className="guest" delay={160 + i * 60}>
                  <span className="guest__avatar"><Crown size={26} /></span>
                  <div>
                    <span className="guest__label">{g.label}</span>
                    <strong>{g.role}</strong>
                    <small>{g.name}</small>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal className="experience-strip experience-strip--light">
            {EVENT.experiences.map((x) => <span key={x}><Star size={16} /> {x}</span>)}
          </Reveal>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <SectionHead eyebrow="Official posters" title="Event posters" text="Tap any poster to view it in full size." />
          <div className="posters">
            {POSTERS.map((img, i) => (
              <Reveal key={img.src} delay={i * 80}>
                <button className="poster" onClick={() => setLb(i)} aria-label={`View ${img.alt}`}>
                  <Pic img={img} />
                  <span className="poster__zoom"><Eye size={20} /> View</span>
                </button>
              </Reveal>
            ))}
          </div>
          <Reveal className="fee-note">
            <strong>Note:</strong> {EVENT.feeNote}
          </Reveal>
        </div>
      </section>

      <Lightbox items={POSTERS} index={lb} onClose={close} onIndex={setLb} />
    </>
  );
}
