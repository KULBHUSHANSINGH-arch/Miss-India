import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Shield } from '../components/Icons.jsx';
import { api, auth } from '../lib/api.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Admin Login · Miss India 2026';
    if (auth.token) navigate('/admin', { replace: true });
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { token } = await api.post('/api/auth/login', form);
      auth.set(token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="a-login">
      <div className="a-login__glow" aria-hidden="true" />
      <form className="a-login__card" onSubmit={submit}>
        <span className="a-login__mark"><Crown size={40} /></span>
        <p className="script a-login__script">Miss India 2026</p>
        <h1>Admin Panel</h1>
        <p className="a-login__sub">Registrations · ID cards · Certificates · Blog &amp; News</p>
        <div className="field">
          <label htmlFor="a-user">Username</label>
          <input id="a-user" className="input" value={form.username} autoComplete="username" autoFocus
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
        </div>
        <div className="field">
          <label htmlFor="a-pass">Password</label>
          <input id="a-pass" type="password" className="input" value={form.password} autoComplete="current-password"
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
        </div>
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <button className="btn btn--gold btn--block" disabled={busy}>
          {busy ? <><span className="spinner" /> Signing in…</> : <><Shield size={18} /> Sign in</>}
        </button>
        <a className="a-login__back" href="/">← Back to website</a>
      </form>
    </div>
  );
}
