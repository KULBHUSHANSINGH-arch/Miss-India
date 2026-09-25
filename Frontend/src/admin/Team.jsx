import { useEffect, useState } from 'react';
import { Plus, Edit, Trash, Badge, Upload } from '../components/Icons.jsx';
import { adminApi } from '../lib/api.js';
import { IdCardStudio } from '../components/CardStudio.jsx';
import { Modal, PageTitle, Empty } from './ui.jsx';

const EMPTY = { name: '', designation: '', department: '', phone: '', bloodGroup: '', validTill: '2026-12-31' };

export default function Team() {
  const [team, setTeam] = useState(null);
  const [editing, setEditing] = useState(null); // member object or {} for new
  const [card, setCard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get('/team').then(setTeam).catch((e) => setError(e.message));
  }, []);

  const saved = (m) => {
    setTeam((t) => (t.some((x) => x.id === m.id) ? t.map((x) => (x.id === m.id ? m : x)) : [m, ...t]));
    setEditing(null);
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name} from the team?`)) return;
    try { await adminApi.del(`/team/${m.id}`); setTeam((t) => t.filter((x) => x.id !== m.id)); } catch (err) { setError(err.message); }
  };

  return (
    <>
      <PageTitle title="Team ID Cards" sub="Organizing team, volunteers, crew — generate their official ID cards.">
        <button className="btn btn--gold btn--sm" onClick={() => setEditing({})}><Plus size={16} /> Add member</button>
      </PageTitle>
      {error && <div className="alert alert--error">{error}</div>}
      {!team ? <div className="a-empty"><span className="spinner" /></div> : !team.length ? <Empty>No team members yet.</Empty> : (
        <div className="team-grid">
          {team.map((m) => (
            <article key={m.id} className="team-card">
              <div className="team-card__photo">{m.photo ? <img src={m.photo} alt="" /> : <span>{m.name[0]}</span>}</div>
              <strong>{m.name}</strong>
              <span className="team-card__role">{m.designation}</span>
              <small className="muted">{m.teamId}{m.department ? ` · ${m.department}` : ''}</small>
              <div className="team-card__actions">
                <button className="btn btn--gold btn--sm" onClick={() => setCard(m)}><Badge size={15} /> ID Card</button>
                <button className="icon-btn icon-btn--dark" onClick={() => setEditing(m)} title="Edit"><Edit size={16} /></button>
                <button className="icon-btn icon-btn--dark icon-btn--danger" onClick={() => remove(m)} title="Delete"><Trash size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && <MemberForm member={editing} onClose={() => setEditing(null)} onSaved={saved} />}
      {card && (
        <Modal wide title={`Team ID Card · ${card.name}`} onClose={() => setCard(null)}>
          <IdCardStudio data={{ kind: 'team', ...card }} />
        </Modal>
      )}
    </>
  );
}

function MemberForm({ member, onClose, onSaved }) {
  const [form, setForm] = useState({ ...EMPTY, ...member });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(member.photo || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const body = new FormData();
    Object.keys(EMPTY).forEach((k) => body.append(k, form[k] || ''));
    if (photo) body.append('photo', photo);
    setBusy(true);
    try {
      onSaved(member.id ? await adminApi.put(`/team/${member.id}`, body) : await adminApi.post('/team', body));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Modal title={member.id ? `Edit ${member.name}` : 'Add team member'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="photo-pick">
          <label className="photo-pick__box">
            {preview ? <img src={preview} alt="" /> : <><Upload size={22} /><span>Photo</span></>}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} hidden />
          </label>
          <p>Front-facing photo for the ID card (max 5 MB).</p>
        </div>
        <div className="grid-2">
          <div className="field"><label htmlFor="t-name">Name *</label><input id="t-name" className="input" value={form.name} onChange={set('name')} required /></div>
          <div className="field"><label htmlFor="t-des">Designation *</label><input id="t-des" className="input" value={form.designation} onChange={set('designation')} placeholder="Event Manager" required /></div>
          <div className="field"><label htmlFor="t-dep">Department</label><input id="t-dep" className="input" value={form.department} onChange={set('department')} placeholder="Operations" /></div>
          <div className="field"><label htmlFor="t-ph">Mobile</label><input id="t-ph" className="input" inputMode="numeric" value={form.phone} onChange={set('phone')} /></div>
          <div className="field">
            <label htmlFor="t-bg">Blood group</label>
            <select id="t-bg" className="select" value={form.bloodGroup} onChange={set('bloodGroup')}>
              <option value="">—</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="t-vt">Valid till</label><input id="t-vt" type="date" className="input" value={form.validTill} onChange={set('validTill')} /></div>
        </div>
        {error && <div className="alert alert--error">{error}</div>}
        <button className="btn btn--gold" disabled={busy}>{busy ? <span className="spinner" /> : null} Save member</button>
      </form>
    </Modal>
  );
}
