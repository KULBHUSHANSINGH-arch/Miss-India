import { useState } from 'react';
import { PageHero, Reveal } from '../components/Shared.jsx';
import LookupForm from '../components/LookupForm.jsx';
import { CertificateStudio } from '../components/CardStudio.jsx';
import { ResultHead } from './IdCard.jsx';
import { Award, Check, Phone } from '../components/Icons.jsx';
import { EVENT } from '../data/event.js';

export default function Certificate() {
  const [reg, setReg] = useState(null);

  return (
    <>
      <PageHero eyebrow="Contestants" title="Your" script="Certificate"
        text="A4, 300 dpi certificate with your name — ready to download or print." />
      <section className="section">
        <div className="container">
          {!reg ? (
            <div className="lookup-wrap">
              <Reveal className="lookup-intro">
                <span className="lookup-intro__icon"><Award size={30} /></span>
                <h2 className="h-display">Download your certificate</h2>
                <p>Certificates unlock once the organizers confirm your registration. Winners and runners-up automatically receive a Certificate of Achievement.</p>
                <ul className="ticks">
                  <li><Check size={16} /> A4 landscape, 3508 × 2480 px (300 dpi)</li>
                  <li><Check size={16} /> Participation / Achievement / Excellence</li>
                  <li><Check size={16} /> Unique certificate number</li>
                </ul>
              </Reveal>
              <Reveal className="card lookup-card" delay={100}>
                <LookupForm onFound={setReg} submitLabel="Get my certificate" />
              </Reveal>
            </div>
          ) : reg.status !== 'confirmed' ? (
            <div className="result">
              <ResultHead reg={reg} onReset={() => setReg(null)} />
              <div className="locked card">
                <span className="locked__icon"><Award size={34} /></span>
                <h3>Your certificate is not unlocked yet</h3>
                <p>
                  It becomes available as soon as the organizers confirm your registration (after payment verification).
                  Your ID card is available on the ID Card page meanwhile.
                </p>
                <div className="locked__actions">
                  {EVENT.phones.map((p) => (
                    <a key={p} className="btn btn--dark btn--sm" href={`tel:${p.replace(/\s/g, '')}`}><Phone size={16} /> {p}</a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="result">
              <ResultHead reg={reg} onReset={() => setReg(null)} />
              <CertificateStudio data={{ fullName: reg.fullName, category: reg.category, regId: reg.regId, award: reg.award }} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
