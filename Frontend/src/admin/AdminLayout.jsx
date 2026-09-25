import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Crown, Grid, Users, Inbox, FileText, Badge, Logout, Menu, Close, External } from '../components/Icons.jsx';
import { api, auth } from '../lib/api.js';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: Grid, end: true },
  { to: '/admin/registrations', label: 'Registrations', icon: Users },
  { to: '/admin/enquiries', label: 'Enquiries', icon: Inbox },
  { to: '/admin/posts', label: 'Blog & News', icon: FileText },
  { to: '/admin/team', label: 'Team ID Cards', icon: Badge },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.title = 'Admin · Miss India 2026';
    if (!auth.token) { navigate('/admin/login', { replace: true }); return; }
    api.get('/api/auth/me', { admin: true }).then((u) => setUser(u.username)).catch(() => {});
  }, [navigate]);

  useEffect(() => setOpen(false), [pathname]);

  const logout = () => {
    auth.clear();
    navigate('/admin/login', { replace: true });
  };

  if (!auth.token) return null;

  return (
    <div className="admin">
      <aside className={`a-side ${open ? 'is-open' : ''}`}>
        <div className="a-side__brand">
          <span className="a-side__mark"><Crown size={26} /></span>
          <div>
            <strong>Miss India</strong>
            <small>Admin · 2026</small>
          </div>
          <button className="a-side__close" onClick={() => setOpen(false)} aria-label="Close menu"><Close size={22} /></button>
        </div>
        <nav className="a-side__nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="a-side__link"><Icon size={19} /> {label}</NavLink>
          ))}
        </nav>
        <div className="a-side__foot">
          <a className="a-side__link" href="/" target="_blank" rel="noopener"><External size={19} /> View website</a>
          <button className="a-side__link" onClick={logout}><Logout size={19} /> Log out</button>
        </div>
      </aside>
      {open && <div className="a-scrim" onClick={() => setOpen(false)} />}

      <div className="a-main">
        <header className="a-top">
          <button className="a-top__menu" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <span className="a-top__title">Mr. Miss. &amp; Mrs. India 2026</span>
          <span className="a-top__user"><span className="a-top__avatar">{(user || 'A')[0].toUpperCase()}</span> {user || 'admin'}</span>
        </header>
        <div className="a-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
