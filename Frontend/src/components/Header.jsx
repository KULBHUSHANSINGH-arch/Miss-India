import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useRegistration } from './RegistrationContext.jsx';
import { Calendar, MapPin, Phone, Menu, Close, Crown, Shield } from './Icons.jsx';
import { EVENT } from '../data/event.js';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/event', label: 'The Pageant' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/blog', label: 'Blog & News' },
  { to: '/certificate', label: 'Certificate' },
  { to: '/id-card', label: 'ID Card' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const { openForm, openEnquiry } = useRegistration();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const register = () => { setMenuOpen(false); openForm(); };

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <span className="topbar__item"><Calendar size={15} /> Grand Finale · {EVENT.finaleDate}</span>
          <span className="topbar__item topbar__hide-sm"><MapPin size={15} /> {EVENT.venue}, {EVENT.city}</span>
          <span className="topbar__item topbar__phones">
            <Phone size={15} />
            {EVENT.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/\s/g, '')}`}>{p}</a>
            ))}
          </span>
        </div>
      </div>

      <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
        <div className="container header__inner">
          <Logo />
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className="nav__link">{n.label}</NavLink>
            ))}
          </nav>
          <div className="header__actions">
            <button className="btn btn--gold header__cta" onClick={register}>
              <Crown size={18} /> Register Now
            </button>
            <a className="header__admin" href="/admin" target="_blank" rel="noopener" title="Admin panel (opens in new tab)" aria-label="Open admin panel in a new tab">
              <Shield size={20} />
            </a>
            <button className="header__burger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu size={26} />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-nav ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-nav__backdrop" onClick={() => setMenuOpen(false)} />
        <aside className="mobile-nav__panel">
          <div className="mobile-nav__head">
            <Logo onClick={() => setMenuOpen(false)} />
            <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu"><Close /></button>
          </div>
          <nav className="mobile-nav__links">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className="mobile-nav__link">{n.label}</NavLink>
            ))}
          </nav>
          <button className="btn btn--gold btn--block" onClick={register}><Crown size={18} /> Register Now</button>
          <button className="btn btn--ghost btn--block" onClick={() => { setMenuOpen(false); openEnquiry(); }}><Phone size={18} /> Quick Enquiry</button>
          <div className="mobile-nav__contact">
            {EVENT.phones.map((p) => <a key={p} href={`tel:${p.replace(/\s/g, '')}`}><Phone size={15} /> {p}</a>)}
          </div>
        </aside>
      </div>
    </>
  );
}
