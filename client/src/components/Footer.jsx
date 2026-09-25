import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useRegistration } from './RegistrationContext.jsx';
import { Calendar, MapPin, Phone, Whatsapp, Instagram, Facebook, Youtube, Crown, Arrow } from './Icons.jsx';
import { EVENT } from '../data/event.js';

export default function Footer() {
  const { openForm } = useRegistration();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-cta">
          <div>
            <p className="footer-cta__script script">Be the Next Queen</p>
            <h3 className="footer-cta__title">Your journey to the crown begins here.</h3>
            <p className="footer-cta__text">Age {EVENT.ageGroup} · Freshers & Professionals · Grooming, outfits, makeup & food included</p>
          </div>
          <button className="btn btn--dark" onClick={openForm}>Reserve Your Spot <Arrow size={18} /></button>
        </div>
      </div>

      <div className="footer__main">
        <div className="container footer__grid">
          <div className="footer__brand">
            <Logo />
            <p>{EVENT.title} — {EVENT.subtitle}. {EVENT.tagline}.</p>
            <p className="footer__presented">
              Presented by <strong>{EVENT.presentedBy}</strong>
            </p>
            <div className="footer__social">
              <a href="#" aria-label="Instagram"><Instagram /></a>
              <a href="#" aria-label="Facebook"><Facebook /></a>
              <a href="#" aria-label="YouTube"><Youtube /></a>
              <a href={`https://wa.me/${EVENT.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Whatsapp /></a>
            </div>
          </div>

          <div>
            <h4 className="footer__title">Explore</h4>
            <ul className="footer__links">
              <li><Link to="/about">About the Pageant</Link></li>
              <li><Link to="/event">Rounds & Benefits</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/blog">Blog & News</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer__title">Contestants</h4>
            <ul className="footer__links">
              <li><button className="linklike" onClick={openForm}>Register Online</button></li>
              <li><Link to="/id-card">Download ID Card</Link></li>
              <li><Link to="/certificate">Participation Certificate</Link></li>
              <li><Link to="/event#benefits">Winner Benefits</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer__title">Event Details</h4>
            <ul className="footer__info">
              <li><Calendar size={17} /><span>Audition / Grooming<br /><strong>{EVENT.auditionDate}</strong></span></li>
              <li><Crown size={17} /><span>Grand Finale<br /><strong>{EVENT.finaleDate}</strong></span></li>
              <li><MapPin size={17} /><span>{EVENT.venue}<br /><strong>{EVENT.city}</strong></span></li>
              <li>
                <Phone size={17} />
                <span>{EVENT.phones.map((p) => <a key={p} href={`tel:${p.replace(/\s/g, '')}`}>{p}<br /></a>)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <span>© {year} {EVENT.presentedBy}. All rights reserved.</span>
          <span className="footer__exp">{EVENT.experiences.join('  ·  ')}</span>
        </div>
      </div>
    </footer>
  );
}
