import { useCallback, useEffect, useState } from 'react';
import { Phone, Whatsapp, Trash, Check } from '../components/Icons.jsx';
import { adminApi } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { PageTitle, Empty } from './ui.jsx';

export default function Enquiries() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    adminApi.get(`/enquiries${filter ? `?status=${filter}` : ''}`).then(setRows).catch((e) => setError(e.message));
  }, [filter]);
  useEffect(load, [load]);

  const setStatus = async (e, status) => {
    try {
      const saved = await adminApi.patch(`/enquiries/${e.id}`, { status });
      setRows((rs) => (filter && filter !== status ? rs.filter((r) => r.id !== e.id) : rs.map((r) => (r.id === e.id ? saved : r))));
    } catch (err) { setError(err.message); }
  };

  const remove = async (e) => {
    if (!window.confirm(`Delete the enquiry from ${e.name}?`)) return;
    try { await adminApi.del(`/enquiries/${e.id}`); setRows((rs) => rs.filter((r) => r.id !== e.id)); } catch (err) { setError(err.message); }
  };

  return (
    <>
      <PageTitle title="Enquiries" sub="Leads from the quick enquiry form. Call or WhatsApp them, then mark as contacted." />
      <div className="seg seg--admin seg--inline">
        {[['', 'All'], ['new', 'New'], ['contacted', 'Contacted']].map(([v, l]) => (
          <button key={l} className={filter === v ? 'is-active' : ''} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      {error && <div className="alert alert--error">{error}</div>}
      {!rows ? <div className="a-empty"><span className="spinner" /></div> : !rows.length ? <Empty>No enquiries here yet.</Empty> : (
        <div className="leads">
          {rows.map((e) => (
            <article key={e.id} className={`lead-card ${e.status === 'new' ? 'is-new' : ''}`}>
              <div className="lead-card__top">
                <span className={`pill pill--${e.status === 'new' ? 'pending' : 'confirmed'}`}>{e.status}</span>
                <small>{formatDateTime(e.createdAt)}</small>
              </div>
              <h3>{e.topic}</h3>
              <p className="lead-card__who">
                <strong>{e.name}</strong> · +91 {e.phone}{e.city ? ` · ${e.city}` : ''}
              </p>
              <p className="lead-card__meta">
                {e.interest && <span className="chip">{e.interest}</span>}
                <span className="chip chip--muted">via {e.source}</span>
              </p>
              <div className="lead-card__actions">
                <a className="btn btn--dark btn--sm" href={`tel:+91${e.phone}`}><Phone size={15} /> Call</a>
                <a className="btn btn--rose btn--sm" target="_blank" rel="noreferrer"
                  href={`https://wa.me/91${e.phone}?text=${encodeURIComponent(`Hello ${e.name}, thank you for your enquiry about "${e.topic}" for Mr. Miss. & Mrs. India 2026.`)}`}>
                  <Whatsapp size={15} /> WhatsApp
                </a>
                {e.status === 'new'
                  ? <button className="btn btn--gold btn--sm" onClick={() => setStatus(e, 'contacted')}><Check size={15} /> Mark contacted</button>
                  : <button className="btn btn--ghost btn--sm" onClick={() => setStatus(e, 'new')}>Mark as new</button>}
                <button className="icon-btn icon-btn--dark" title="Delete" onClick={() => remove(e)}><Trash size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
