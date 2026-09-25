import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Check, Inbox, FileText, Badge, Plus, Arrow, Crown } from '../components/Icons.jsx';
import { adminApi } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { PageTitle, StatusPill, Empty } from './ui.jsx';
import { CATEGORY_THEME } from '../lib/cards.js';

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get('/stats').then(setS).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!s) return <div className="a-empty"><span className="spinner" /></div>;

  const tiles = [
    { label: 'Registrations', value: s.registrations, sub: `${s.pending} pending`, icon: Users, to: '/admin/registrations', tone: 'rose' },
    { label: 'Confirmed', value: s.confirmed, sub: 'Certificates unlocked', icon: Check, to: '/admin/registrations?status=confirmed', tone: 'green' },
    { label: 'Enquiries', value: s.enquiries, sub: `${s.newEnquiries} new`, icon: Inbox, to: '/admin/enquiries', tone: 'gold' },
    { label: 'Blog & News', value: s.posts, sub: `${s.published} published · ${s.drafts} drafts`, icon: FileText, to: '/admin/posts', tone: 'plum' },
    { label: 'Team members', value: s.team, sub: 'Team ID cards', icon: Badge, to: '/admin/team', tone: 'teal' },
  ];
  const max = Math.max(1, ...Object.values(s.byCategory));

  return (
    <>
      <PageTitle title="Dashboard" sub="Everything happening with Mr. Miss. & Mrs. India 2026 at a glance.">
        <Link to="/admin/posts/new" className="btn btn--gold btn--sm"><Plus size={16} /> New post</Link>
      </PageTitle>

      <div className="tiles">
        {tiles.map(({ label, value, sub, icon: Icon, to, tone }) => (
          <Link key={label} to={to} className={`tile tile--${tone}`}>
            <span className="tile__icon"><Icon size={22} /></span>
            <span className="tile__label">{label}</span>
            <strong className="tile__value">{value}</strong>
            <small>{sub}</small>
          </Link>
        ))}
      </div>

      <div className="a-grid">
        <section className="panel">
          <h2 className="panel__title">Registrations by category</h2>
          <div className="bars">
            {Object.entries(s.byCategory).map(([cat, n]) => {
              const t = CATEGORY_THEME[cat];
              return (
                <div key={cat} className="bars__row">
                  <span className="bars__label">{cat}</span>
                  <span className="bars__track">
                    <span style={{ width: `${(n / max) * 100}%`, background: `linear-gradient(90deg, ${t.from}, ${t.to})` }} />
                  </span>
                  <strong>{n}</strong>
                </div>
              );
            })}
          </div>
          <div className="quick">
            <Link to="/admin/registrations" className="quick__item"><Badge size={20} /> Generate ID cards</Link>
            <Link to="/admin/registrations?status=confirmed" className="quick__item"><Crown size={20} /> Issue certificates</Link>
            <Link to="/admin/posts/new?type=news" className="quick__item"><FileText size={20} /> Post news</Link>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Latest registrations</h2>
            <Link to="/admin/registrations" className="linkish">View all <Arrow size={14} /></Link>
          </div>
          {s.recentRegistrations.length ? (
            <ul className="recent">
              {s.recentRegistrations.map((r) => (
                <li key={r.id}>
                  <span className="recent__avatar">{r.photo ? <img src={r.photo} alt="" /> : r.fullName[0]}</span>
                  <div>
                    <strong>{r.fullName}</strong>
                    <small>{r.regId} · {r.category || '—'} · {formatDateTime(r.createdAt)}</small>
                  </div>
                  <StatusPill status={r.status} />
                </li>
              ))}
            </ul>
          ) : <Empty>No registrations yet.</Empty>}
        </section>
      </div>
    </>
  );
}
