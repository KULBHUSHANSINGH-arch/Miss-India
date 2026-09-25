import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegistration } from '../components/RegistrationContext.jsx';
import { Pic, Reveal, SectionHead, Countdown, BlogCard } from '../components/Shared.jsx';
import { Crown, Calendar, MapPin, Users, Rupee, Star, Dress, Brush, Trophy, Arrow, Gift, Sparkle } from '../components/Icons.jsx';
import { EVENT, IMAGES, HIGHLIGHTS, WINNER_BENEFITS, RUNNER_UP_BENEFITS, GUESTS, TIMELINE } from '../data/event.js';
import { api } from '../lib/api.js';

const HIGHLIGHT_ICONS = [Star, Dress, Brush];

export default function Home() {
  const { openForm } = useRegistration();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.get('/api/posts?limit=3').then(setPosts).catch(() => setPosts([]));
  }, []);

  const facts = [
    { icon: Users, label: 'Age Group', value: EVENT.ageGroup },
    { icon: Rupee, label: 'Registration Fee', value: EVENT.fee },
    { icon: Calendar, label: 'Live Audition / Grooming', value: EVENT.auditionDate },
    { icon: Crown, label: 'Grand Finale', value: EVENT.finaleDate },
    { icon: MapPin, label: 'Venue', value: `${EVENT.venue}, ${EVENT.city}` },
  ];

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero__lights" aria-hidden="true" />
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="hero__presented">Presented by <strong>{EVENT.presentedBy}</strong></span>
            <h1 className="hero__title">
              <span className="hero__global">Global</span>
              India's Biggest <span className="gold-text">Beauty Pageant</span>
            </h1>
            <p className="hero__script script">Mr. Miss. &amp; Mrs. India 2026</p>
            <p className="hero__lead">{EVENT.tagline}.</p>

            <div className="hero__actions">
              <button className="btn btn--gold" onClick={openForm}><Crown size={18} /> Register Now</button>
              <Link to="/event" className="btn btn--ghost">Explore the Pageant <Arrow size={18} /></Link>
            </div>

            <div className="hero__countdown">
              <span className="hero__countdown-label">Grand Finale countdown · {EVENT.finaleDate}</span>
              <Countdown target={EVENT.finaleISO} />
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__arch">
              <Pic img={IMAGES.runwayBlue} eager fetchpriority="high" />
            </div>
            <div className="hero__float hero__float--a"><Pic img={IMAGES.runwayBlush} eager /></div>
            <div className="hero__float hero__float--b"><Pic img={IMAGES.runwayWine} eager /></div>
            <div className="hero__badge">
              <span className="script">Be the Next</span>
              <strong>Queen</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- KEY FACTS ---------- */}
      <section className="facts">
        <div className="container">
          <div className="facts__grid">
            {facts.map(({ icon: Icon, label, value }, i) => (
              <Reveal key={label} className="fact" delay={i * 70}>
                <span className="fact__icon"><Icon size={22} /></span>
                <span className="fact__label">{label}</span>
                <strong className="fact__value">{value}</strong>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ABOUT SNIPPET ---------- */}
      <section className="section">
        <div className="container split">
          <Reveal className="split__media">
            <div className="frame-gold">
              <Pic img={IMAGES.sashQueen} />
            </div>
            <div className="split__stamp">
              <strong>2</strong>
              <span>Exciting<br />Rounds</span>
            </div>
          </Reveal>
          <Reveal className="split__copy" delay={120}>
            <span className="eyebrow">About the pageant</span>
            <h2 className="h-display">Where dreams meet <span className="script gold-text-rose">opportunity</span></h2>
            <p>
              {EVENT.title} — <strong>{EVENT.subtitle}</strong> — is a premium beauty pageant and fashion show
              for freshers and professional models aged {EVENT.ageGroup.toLowerCase()}. Presented by{' '}
              {EVENT.presentedBy}, it celebrates beauty, talent, confidence and grace.
            </p>
            <p>Your registration includes everything you need to shine on the ramp:</p>
            <ul className="includes">
              {EVENT.includes.map((x) => <li key={x}><Sparkle size={16} /> {x}</li>)}
            </ul>
            <div className="split__actions">
              <Link to="/about" className="btn btn--dark">Our Story <Arrow size={18} /></Link>
              <button className="btn btn--rose" onClick={openForm}>Reserve Your Spot</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- HIGHLIGHTS ---------- */}
      <section className="section section--dark">
        <div className="container">
          <SectionHead eyebrow="Competition highlights" title="Designed for the spotlight"
            text="Every contestant gets a professional stage experience — outfits and makeup are provided by the organizers." />
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
          <Reveal className="experience-strip">
            {EVENT.experiences.map((x) => <span key={x}><Star size={16} /> {x}</span>)}
          </Reveal>
        </div>
      </section>

      {/* ---------- BENEFITS ---------- */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Rewards" title="Winner & runner-up benefits"
            text="The crown is just the beginning — winners walk away with career-launching opportunities." />
          <div className="benefits">
            <Reveal className="benefit benefit--winner">
              <div className="benefit__head">
                <span className="benefit__icon"><Trophy size={28} /></span>
                <div>
                  <span className="eyebrow">For the winner</span>
                  <h3>Winner Benefits</h3>
                </div>
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
        </div>
      </section>

      {/* ---------- JOURNEY ---------- */}
      <section className="section section--cream">
        <div className="container">
          <SectionHead eyebrow="Your journey" title="From registration to the crown" />
          <ol className="timeline">
            {TIMELINE.map((t, i) => (
              <Reveal as="li" key={t.title} className="timeline__item" delay={i * 90}>
                <span className="timeline__dot"><Crown size={18} /></span>
                <span className="timeline__date">{t.date}</span>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal className="heritage">
            <div className="heritage__icon"><MapPin size={26} /></div>
            <div>
              <h3>A royal heritage tour</h3>
              <p>{EVENT.tourNote}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- GALLERY PREVIEW ---------- */}
      <section className="section section--dark">
        <div className="container">
          <SectionHead eyebrow="Gallery" title="Glimpses of glamour" />
          <div className="mini-gallery">
            {[IMAGES.runwayWine, IMAGES.posterMissMrs, IMAGES.runwayBlush, IMAGES.posterInvitation].map((img, i) => (
              <Reveal key={img.src} className="mini-gallery__item" delay={i * 80}>
                <Link to="/gallery"><Pic img={img} /></Link>
              </Reveal>
            ))}
          </div>
          <div className="center-row">
            <Link to="/gallery" className="btn btn--ghost">View Full Gallery <Arrow size={18} /></Link>
          </div>
        </div>
      </section>

      {/* ---------- BLOG ---------- */}
      {posts.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead eyebrow="From the blog" title="News, stories & updates" />
            <div className="blog-grid">
              {posts.map((p, i) => <Reveal key={p.id} delay={i * 90}><BlogCard post={p} /></Reveal>)}
            </div>
            <div className="center-row">
              <Link to="/blog" className="btn btn--dark">All Stories <Arrow size={18} /></Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
