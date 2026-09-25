import { useRegistration } from '../components/RegistrationContext.jsx';
import { PageHero, Pic, Reveal, SectionHead } from '../components/Shared.jsx';
import { Crown, Star, Sparkle, Instagram, Facebook, Youtube, Users } from '../components/Icons.jsx';
import { EVENT, IMAGES } from '../data/event.js';

const VALUES = [
  { title: 'Dream', text: 'A stage for every aspiring model — freshers and professionals alike — to dream bigger.' },
  { title: 'Dare', text: 'Grooming, mentoring and two competitive rounds that build real confidence.' },
  { title: 'Achieve', text: 'Crowns, contracts, portfolio shoots, web series and more for our winners.' },
];

export default function About() {
  const { openForm } = useRegistration();
  return (
    <>
      <PageHero eyebrow="About us" title="Beauty with a" script="Purpose"
        text={`${EVENT.title} — ${EVENT.subtitle}, presented by ${EVENT.presentedBy}.`} />

      <section className="section">
        <div className="container split">
          <Reveal className="split__media">
            <div className="frame-gold frame-gold--arch"><Pic img={IMAGES.runwayBlush} /></div>
          </Reveal>
          <Reveal className="split__copy" delay={120}>
            <span className="eyebrow">Our story</span>
            <h2 className="h-display">A premium pageant for <span className="script gold-text-rose">every dreamer</span></h2>
            <p>
              {EVENT.subtitle} is a premium beauty pageant and fashion show built for fresher's and professional
              models between {EVENT.ageGroup.toLowerCase()}. It is presented by <strong>{EVENT.presentedBy}</strong> in
              collaboration with <strong>{EVENT.partner}</strong>.
            </p>
            <p>
              From live auditions and grooming on <strong>{EVENT.auditionDate}</strong> to the Grand Finale on{' '}
              <strong>{EVENT.finaleDate}</strong> at the {EVENT.venue}, {EVENT.city}, we give every contestant a
              professional stage — designer outfits, professional makeup, grooming and food included.
            </p>
            <p>{EVENT.tourNote}</p>
            <button className="btn btn--rose" onClick={openForm}><Crown size={18} /> Become a Contestant</button>
          </Reveal>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <SectionHead eyebrow="What we stand for" title="Dream · Dare · Achieve" />
          <div className="highlights">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} className="highlight card--dark" delay={i * 100}>
                <span className="highlight__num">0{i + 1}</span>
                <span className="highlight__icon"><Sparkle size={26} /></span>
                <h3 className="script value-title">{v.title}</h3>
                <p>{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Organizers" title="The people behind the crown" />
          <div className="org-grid">
            <Reveal className="org card">
              <span className="org__icon"><Crown size={30} /></span>
              <span className="chip">Presented by</span>
              <h3>{EVENT.presentedBy}</h3>
              <p>The foundation leading {EVENT.subtitle} — creating opportunities in fashion, entertainment and social impact.</p>
            </Reveal>
            <Reveal className="org card" delay={100}>
              <span className="org__icon"><Star size={28} /></span>
              <span className="chip">Collaboration partner</span>
              <h3>{EVENT.partner}</h3>
              <p>Education partner supporting the pageant and the International Business Icon Awards 2026.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container creators">
          <Reveal className="creators__copy">
            <span className="eyebrow">All creators invited</span>
            <h2 className="h-display">Instagram, Facebook &amp; YouTube creators</h2>
            <p>
              {EVENT.presentedBy} and {EVENT.partner} invite all social media creators to collaborate.
              If you would like to work with us, call us on our contact numbers — we would love to create together.
            </p>
            <p className="creators__hi">
              वैभव जन समृद्धि फाउंडेशन और Nbosecsm एजुकेशन फाउंडेशन की तरफ से आप सभी सोशल मीडिया क्रिएटर को
              इनवाइट किया जाता है। जो भी हमारे साथ काम करना चाहते हैं, वह हमारे कॉन्टैक्ट नंबर पर बात कर सकते हैं।
            </p>
            <div className="creators__phones">
              {EVENT.phones.map((p) => <a key={p} className="btn btn--dark btn--sm" href={`tel:${p.replace(/\s/g, '')}`}>{p}</a>)}
            </div>
          </Reveal>
          <Reveal className="creators__icons" delay={120}>
            <span><Instagram size={34} /></span>
            <span><Facebook size={34} /></span>
            <span><Youtube size={34} /></span>
            <span><Users size={34} /></span>
          </Reveal>
        </div>
      </section>
    </>
  );
}
