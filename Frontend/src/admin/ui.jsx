import { useEffect, useRef, useState } from 'react';
import { Close, FileText, Eye } from '../components/Icons.jsx';
import { adminBlob } from '../lib/api.js';

// Modals can stack (e.g. certificate over a registration), so track how many are open.
const stack = [];

export function Modal({ title, onClose, children, wide = false }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const token = {};
    stack.push(token);
    document.body.style.overflow = 'hidden';
    // Only the top-most modal reacts to Escape.
    const onKey = (e) => e.key === 'Escape' && stack[stack.length - 1] === token && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      stack.splice(stack.indexOf(token), 1);
      if (!stack.length) document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal__backdrop" onClick={onClose} />
      <div className={`modal__panel modal__panel--admin ${wide ? 'modal__panel--wide' : ''}`}>
        <header className="modal__head">
          <h2>{title}</h2>
          <button className="icon-btn icon-btn--dark" onClick={onClose} aria-label="Close"><Close /></button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export function StatusPill({ status }) {
  return <span className={`pill pill--${status}`}>{status}</span>;
}

export function PageTitle({ title, sub, children }) {
  return (
    <div className="a-title">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="a-title__actions">{children}</div>}
    </div>
  );
}

/** Opens a private (admin-only) document in a new tab via an authenticated fetch. */
export function PrivateFile({ name, label }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!name) return <span className="doc doc--empty"><FileText size={18} /> {label}: not uploaded</span>;
  const open = async () => {
    // Open the tab synchronously so pop-up blockers allow it, then load the file into it.
    const win = window.open('', '_blank');
    setBusy(true);
    setError('');
    try {
      const blob = await adminBlob(`/files/${encodeURIComponent(name)}`);
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url; else window.location.assign(url);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      win?.close();
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" className="doc" onClick={open} disabled={busy}>
      {busy ? <span className="spinner" /> : <Eye size={18} />} {label}
      {error && <small className="field__error"> {error}</small>}
    </button>
  );
}

export function Empty({ children }) {
  return <div className="a-empty">{children}</div>;
}
