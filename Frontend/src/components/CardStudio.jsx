import { useEffect, useRef, useState } from 'react';
import { Download, Printer } from './Icons.jsx';
import {
  drawCertificate, drawIdCardFront, drawIdCardBack, downloadCanvas, printCanvases, PRINT_SIZES,
  CERT_W, CERT_H, CARD_W, CARD_H,
} from '../lib/cards.js';

/** Draws a canvas whenever `data` changes and mounts it (scaled by CSS) inside a frame. */
function useDrawn(draw, data) {
  const [state, setState] = useState({ canvas: null, error: '' });
  const key = JSON.stringify(data);
  useEffect(() => {
    let alive = true;
    setState({ canvas: null, error: '' });
    draw(data)
      .then((canvas) => alive && setState({ canvas, error: '' }))
      .catch((err) => alive && setState({ canvas: null, error: err.message || 'Could not draw' }));
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

function CanvasFrame({ canvas, width, height, label, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (canvas) {
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', label);
      host.replaceChildren(canvas);
    } else {
      host.replaceChildren();
    }
  }, [canvas, label]);
  return (
    <div className={`studio__frame ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <div ref={ref} className="studio__canvas" />
      {!canvas && <div className="studio__loading"><span className="spinner" /> Preparing high-resolution file…</div>}
    </div>
  );
}

const fileSafe = (s) => String(s || 'card').replace(/[^\w-]+/g, '_');

export function IdCardStudio({ data }) {
  const front = useDrawn(drawIdCardFront, data);
  const back = useDrawn(drawIdCardBack, data);
  const [busy, setBusy] = useState('');
  const id = data.kind === 'team' ? data.teamId : data.regId;
  const ready = front.canvas && back.canvas;

  const run = (label, fn) => async () => {
    setBusy(label);
    try { await fn(); } finally { setBusy(''); }
  };

  return (
    <div className="studio">
      <div className="studio__cards">
        <figure>
          <CanvasFrame canvas={front.canvas} width={CARD_W} height={CARD_H} label="ID card front" className="studio__frame--card" />
          <figcaption>Front</figcaption>
        </figure>
        <figure>
          <CanvasFrame canvas={back.canvas} width={CARD_W} height={CARD_H} label="ID card back" className="studio__frame--card" />
          <figcaption>Back</figcaption>
        </figure>
      </div>
      {(front.error || back.error) && <div className="alert alert--error">{front.error || back.error}</div>}
      <div className="studio__actions">
        <button className="btn btn--gold" disabled={!ready || !!busy}
          onClick={run('front', () => downloadCanvas(front.canvas, `${fileSafe(id)}-ID-Card-Front.png`))}>
          {busy === 'front' ? <span className="spinner" /> : <Download size={18} />} Front (PNG)
        </button>
        <button className="btn btn--gold" disabled={!ready || !!busy}
          onClick={run('back', () => downloadCanvas(back.canvas, `${fileSafe(id)}-ID-Card-Back.png`))}>
          {busy === 'back' ? <span className="spinner" /> : <Download size={18} />} Back (PNG)
        </button>
        <button className="btn btn--dark" disabled={!ready || !!busy}
          onClick={run('print', () => printCanvases([front.canvas, back.canvas], PRINT_SIZES.card))}>
          {busy === 'print' ? <span className="spinner" /> : <Printer size={18} />} Print / Save PDF
        </button>
      </div>
      <p className="studio__note">
        {CARD_W} × {CARD_H} px · CR80 size (54 × 85.6 mm) · print-ready. In the print dialog choose
        “Actual size / 100%” and turn off headers & footers.
      </p>
    </div>
  );
}

export function CertificateStudio({ data }) {
  const cert = useDrawn(drawCertificate, data);
  const [busy, setBusy] = useState('');

  const run = (label, fn) => async () => {
    setBusy(label);
    try { await fn(); } finally { setBusy(''); }
  };

  return (
    <div className="studio">
      <CanvasFrame canvas={cert.canvas} width={CERT_W} height={CERT_H} label="Certificate preview" className="studio__frame--cert" />
      {cert.error && <div className="alert alert--error">{cert.error}</div>}
      <div className="studio__actions">
        <button className="btn btn--gold" disabled={!cert.canvas || !!busy}
          onClick={run('png', () => downloadCanvas(cert.canvas, `${fileSafe(data.regId)}-Certificate.png`))}>
          {busy === 'png' ? <span className="spinner" /> : <Download size={18} />} Download PNG (HD)
        </button>
        <button className="btn btn--ghost" disabled={!cert.canvas || !!busy}
          onClick={run('jpg', () => downloadCanvas(cert.canvas, `${fileSafe(data.regId)}-Certificate.jpg`, 'image/jpeg'))}>
          {busy === 'jpg' ? <span className="spinner" /> : <Download size={18} />} JPG (smaller)
        </button>
        <button className="btn btn--dark" disabled={!cert.canvas || !!busy}
          onClick={run('print', () => printCanvases([cert.canvas], PRINT_SIZES.certificate))}>
          {busy === 'print' ? <span className="spinner" /> : <Printer size={18} />} Print / Save PDF
        </button>
      </div>
      <p className="studio__note">
        {CERT_W} × {CERT_H} px · A4 landscape @ 300 dpi · print-ready. In the print dialog choose A4 Landscape,
        “Actual size / 100%”, margins “None”.
      </p>
    </div>
  );
}
