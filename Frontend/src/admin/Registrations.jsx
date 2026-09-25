import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, Badge, Award, Trash, Phone, Whatsapp, Mail, Eye } from '../components/Icons.jsx';
import { adminApi, adminBlob, saveBlob } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { IdCardStudio, CertificateStudio } from '../components/CardStudio.jsx';
import { Modal, PageTitle, StatusPill, PrivateFile, Empty } from './ui.jsx';

const CATEGORIES = ['Miss India', 'Mrs. India', 'Mr. India'];
const AWARDS = ['Participation', 'Winner', '1st Runner-Up', '2nd Runner-Up', 'Special Award'];

export default function Registrations() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState(params.get('q') || '');
  const [openId, setOpenId] = useState(null);
  const [studio, setStudio] = useState(null); // { kind: 'card' | 'cert', reg }
  const status = params.get('status') || '';
  const category = params.get('category') || '';

  const query = useCallback(() => {
    const sp = new URLSearchParams();
    if (status) sp.set('status', status);
    if (category) sp.set('category', category);
    if (params.get('q')) sp.set('q', params.get('q'));
    return sp.toString();
  }, [status, category, params]);

  const load = useCallback(() => {
    setError('');
    adminApi.get(`/registrations?${query()}`).then(setRows).catch((e) => setError(e.message));
  }, [query]);

  useEffect(load, [load]);

  // Debounced search box → URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') || '') === q) return;
      const next = new URLSearchParams(params);
      if (q) next.set('q', q); else next.delete('q');
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const exportCsv = async () => {
    try {
      saveBlob(await adminBlob(`/registrations.csv?${query()}`), `registrations-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      setError(err.message);
    }
  };

  const updated = (reg) => setRows((rs) => rs.map((r) => (r.id === reg.id ? reg : r)));
  const removed = (id) => { setRows((rs) => rs.filter((r) => r.id !== id)); setOpenId(null); };
  const current = rows?.find((r) => r.id === openId);

  return (
    <>
      <PageTitle title="Registrations" sub="All applicants with their full form data, documents, ID cards and certificates.">
        <button className="btn btn--dark btn--sm" onClick={exportCsv}><Download size={16} /> Export Excel (CSV)</button>
      </PageTitle>

      <div className="filters">
        <label className="search">
          <Search size={18} />
          <input className="input" placeholder="Search name, Reg ID, mobile, email, city…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="select" value={status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="select" value={category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {!rows ? <div className="a-empty"><span className="spinner" /></div> : !rows.length ? <Empty>No registrations match these filters.</Empty> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Applicant</th><th>Reg ID</th><th>Category</th><th>Mobile</th><th>City</th>
                <th>Profile</th><th>Status</th><th>Registered</th><th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => setOpenId(r.id)} className="is-clickable">
                  <td data-label="Applicant">
                    <span className="person">
                      <span className="person__avatar">{r.photo ? <img src={r.photo} alt="" /> : r.fullName[0]}</span>
                      <span><strong>{r.fullName}</strong><small>{r.email}</small></span>
                    </span>
                  </td>
                  <td data-label="Reg ID"><code>{r.regId}</code></td>
                  <td data-label="Category">{r.category || '—'}</td>
                  <td data-label="Mobile">{r.phone}</td>
                  <td data-label="City">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</td>
                  <td data-label="Profile">
                    {r.missing.length ? <span className="pill pill--warn">{r.missing.length} missing</span> : <span className="pill pill--confirmed">Complete</span>}
                  </td>
                  <td data-label="Status"><StatusPill status={r.status} /></td>
                  <td data-label="Registered">{formatDateTime(r.createdAt)}</td>
                  <td className="table__actions" onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn icon-btn--dark" title="View details" onClick={() => setOpenId(r.id)}><Eye size={17} /></button>
                    <button className="icon-btn icon-btn--dark" title="ID card" onClick={() => setStudio({ kind: 'card', reg: r })}><Badge size={17} /></button>
                    <button className="icon-btn icon-btn--dark" title="Certificate" onClick={() => setStudio({ kind: 'cert', reg: r })}><Award size={17} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="table-count">{rows.length} registration{rows.length === 1 ? '' : 's'}</p>
        </div>
      )}

      {current && (
        <Detail reg={current} onClose={() => setOpenId(null)} onUpdated={updated} onDeleted={removed}
          onStudio={(kind) => setStudio({ kind, reg: current })} />
      )}

      {studio && (
        <Modal wide title={studio.kind === 'card' ? `ID Card · ${studio.reg.fullName}` : `Certificate · ${studio.reg.fullName}`} onClose={() => setStudio(null)}>
          {studio.kind === 'card' ? (
            <>
              {studio.reg.missing.length > 0 && (
                <div className="alert alert--warn">Profile incomplete — missing: {studio.reg.missing.map((m) => m.label).join(', ')}. The card is still generated with what is available.</div>
              )}
              <IdCardStudio data={{ kind: 'contestant', ...studio.reg }} />
            </>
          ) : (
            <>
              {studio.reg.status !== 'confirmed' && (
                <div className="alert alert--warn">This registration is <strong>{studio.reg.status}</strong>. Contestants can download their own certificate only after you confirm them.</div>
              )}
              <CertificateStudio data={{ fullName: studio.reg.fullName, category: studio.reg.category, regId: studio.reg.regId, award: studio.reg.award }} />
            </>
          )}
        </Modal>
      )}
    </>
  );
}

function Detail({ reg, onClose, onUpdated, onDeleted, onStudio }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const patch = async (body, label) => {
    setBusy(label);
    setError('');
    try { onUpdated(await adminApi.patch(`/registrations/${reg.id}`, body)); } catch (err) { setError(err.message); } finally { setBusy(''); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${reg.fullName} (${reg.regId}) permanently? This also deletes their uploaded files.`)) return;
    setBusy('delete');
    try { await adminApi.del(`/registrations/${reg.id}`); onDeleted(reg.id); } catch (err) { setError(err.message); setBusy(''); }
  };

  const sections = [
    ['1. Applicant details', [
      ['Full name', reg.fullName], ['Category', reg.category], ['Date of birth', reg.dob], ['Age', reg.age],
      ['Gender', reg.gender], ['Mobile', reg.phone], ['WhatsApp', reg.whatsapp], ['Email', reg.email],
      ['City', reg.city], ['State', reg.state],
    ]],
    ['2. Personal details', [
      ['Full address', reg.address], ['Height', reg.height], ['Profession', reg.occupation],
      ['Instagram', reg.instagram], ['Facebook', reg.facebook], ['Experience', reg.experience],
      ['Experience details', reg.experienceDetails],
    ]],
    ['4. Pageant information', [
      ['Why participate', reg.whyParticipate], ['Strengths / qualities', reg.strengths],
      ['Fashion show / TV / web experience', reg.mediaExperience], ['Comfortable with grooming', reg.comfortableGrooming],
    ]],
    ['5. Registration & payment', [
      ['Fee acknowledged', reg.feeAcknowledged ? 'Yes' : 'No'], ['Payment reference', reg.paymentRef],
    ]],
    ['8. Parent / guardian', [
      ['Name', reg.guardianName], ['Relationship', reg.guardianRelation], ['Mobile', reg.guardianPhone],
      ['Consent given', reg.guardianConsent ? 'Yes' : 'No'],
    ]],
  ];

  return (
    <Modal wide title={`${reg.fullName} · ${reg.regId}`} onClose={onClose}>
      <div className="detail">
        <div className="detail__side">
          <div className="detail__photo">{reg.photo ? <img src={reg.photo} alt={`${reg.fullName}`} /> : <span>{reg.fullName[0]}</span>}</div>
          <div className="detail__contact">
            <a href={`tel:+91${reg.phone}`} className="btn btn--dark btn--sm"><Phone size={15} /> Call</a>
            <a href={`https://wa.me/91${reg.whatsapp || reg.phone}`} target="_blank" rel="noreferrer" className="btn btn--rose btn--sm"><Whatsapp size={15} /> WhatsApp</a>
            <a href={`mailto:${reg.email}`} className="btn btn--ghost btn--sm"><Mail size={15} /> Email</a>
          </div>

          <div className="detail__box">
            <span className="detail__label">Status</span>
            <div className="seg seg--admin">
              {['pending', 'confirmed', 'rejected'].map((s) => (
                <button key={s} className={reg.status === s ? `is-active is-${s}` : ''} disabled={!!busy} onClick={() => patch({ status: s }, s)}>
                  {busy === s ? <span className="spinner" /> : s}
                </button>
              ))}
            </div>
            <label className="detail__label" htmlFor="award">Certificate type / award</label>
            <select id="award" className="select" value={reg.award} disabled={!!busy} onChange={(e) => patch({ award: e.target.value }, 'award')}>
              {AWARDS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div className="detail__box">
            <span className="detail__label">Generate</span>
            <button className="btn btn--gold btn--block btn--sm" onClick={() => onStudio('card')}><Badge size={16} /> ID Card (front & back)</button>
            <button className="btn btn--dark btn--block btn--sm" onClick={() => onStudio('cert')}><Award size={16} /> Certificate</button>
            {reg.missing.length > 0 && <small className="muted">Missing for ID card: {reg.missing.map((m) => m.label).join(', ')}</small>}
          </div>

          <div className="detail__box">
            <span className="detail__label">3. Documents (private)</span>
            <PrivateFile name={reg.photoFull} label="Full-length photo" />
            <PrivateFile name={reg.idProof} label="ID / DOB proof" />
            <PrivateFile name={reg.paymentProof} label="Payment proof" />
          </div>

          {error && <div className="alert alert--error">{error}</div>}
          <button className="btn btn--sm detail__delete" onClick={remove} disabled={!!busy}><Trash size={15} /> Delete registration</button>
          <small className="muted">Registered {formatDateTime(reg.createdAt)}</small>
        </div>

        <div className="detail__main">
          {sections.map(([title, fields]) => (
            <section key={title} className="detail__section">
              <h3>{title}</h3>
              <dl>
                {fields.map(([k, v]) => (
                  <div key={k} className={String(v || '').length > 60 ? 'is-wide' : ''}>
                    <dt>{k}</dt>
                    <dd>{v === '' || v == null ? <span className="muted">—</span> : String(v)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}
