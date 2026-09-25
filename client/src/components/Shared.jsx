import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Close, Crown, Calendar, Arrow } from './Icons.jsx';
import { formatDate } from '../lib/api.js';

/* Picture with its real pixel size so the browser never upscales it past the source. */
export function Pic({ img, className = '', eager = false, ...rest }) {
  return (
    <img
      src={img.src} alt={img.alt} width={img.w} height={img.h}
      loading={eager ? 'eager' : 'lazy'} decoding="async" className={className}
      style={{ maxWidth: `min(100%, ${img.w}px)` }} {...rest}
    />
  );
}

/* Fades children in when scrolled into view. */
export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return setVisible(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

export function PageHero({ eyebrow, title, script, text }) {
  return (
    <section className="page-hero">
      <div className="page-hero__glow" />
      <div className="container page-hero__inner">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title} {script && <span className="script gold-text">{script}</span>}</h1>
        {text && <p>{text}</p>}
        <div className="ornament"><Crown size={22} /></div>
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, text }) {
  return (
    <Reveal className="section-head">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </Reveal>
  );
}

export function Countdown({ target }) {
  const calc = () => Math.max(0, new Date(target).getTime() - Date.now());
  const [ms, setMs] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setMs(calc()), 1000);
    return () => clearInterval(t);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  const parts = [
    ['Days', Math.floor(ms / 86400000)],
    ['Hours', Math.floor(ms / 3600000) % 24],
    ['Minutes', Math.floor(ms / 60000) % 60],
    ['Seconds', Math.floor(ms / 1000) % 60],
  ];
  return (
    <div className="countdown" role="timer" aria-label="Time left for the Grand Finale">
      {parts.map(([label, v]) => (
        <div key={label} className="countdown__cell">
          <strong>{String(v).padStart(2, '0')}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* Full-screen image viewer. Shows the image at most at its natural size. */
export function Lightbox({ items, index, onClose, onIndex }) {
  useEffect(() => {
    if (index == null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [index, items.length, onClose, onIndex]);

  if (index == null) return null;
  const img = items[index];
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={img.alt} onClick={onClose}>
      <button className="lightbox__close icon-btn" aria-label="Close" onClick={onClose}><Close /></button>
      <button className="lightbox__nav lightbox__nav--prev" aria-label="Previous image"
        onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + items.length) % items.length); }}>‹</button>
      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <img src={img.src} alt={img.alt} width={img.w} height={img.h} style={{ maxWidth: `min(100%, ${img.w}px)` }} />
        <figcaption>{img.alt} <span>{index + 1} / {items.length}</span></figcaption>
      </figure>
      <button className="lightbox__nav lightbox__nav--next" aria-label="Next image"
        onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % items.length); }}>›</button>
    </div>
  );
}

export function BlogCard({ post }) {
  return (
    <article className="blog-card">
      <Link to={`/blog/${post.slug}`} className="blog-card__media">
        {post.coverImage
          ? <img src={post.coverImage} alt="" loading="lazy" />
          : <div className="blog-card__placeholder"><Crown size={48} /></div>}
        <span className="chip blog-card__chip">{post.category}</span>
      </Link>
      <div className="blog-card__body">
        <span className="blog-card__date"><Calendar size={14} /> {formatDate(post.createdAt)}</span>
        <h3><Link to={`/blog/${post.slug}`}>{post.title}</Link></h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <Link to={`/blog/${post.slug}`} className="blog-card__more">Read story <Arrow size={16} /></Link>
      </div>
    </article>
  );
}

export function youtubeId(url) {
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/* Renders a post's content blocks (heading / paragraph / image / video / quote). */
export function BlockRenderer({ blocks = [] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading':
            return b.level === 3 ? <h3 key={i}>{b.text}</h3> : <h2 key={i}>{b.text}</h2>;
          case 'paragraph':
            return b.text.split(/\n{2,}/).map((para, j) => (
              <p key={`${i}-${j}`}>{para.split('\n').flatMap((line, k) => (k ? [<br key={k} />, line] : [line]))}</p>
            ));
          case 'quote':
            return (
              <blockquote key={i}>
                <p>{b.text}</p>
                {b.author && <cite>— {b.author}</cite>}
              </blockquote>
            );
          case 'image':
            return (
              <figure key={i} className="prose__figure">
                <img src={b.url} alt={b.caption || ''} loading="lazy" />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          case 'video': {
            const yt = youtubeId(b.url);
            return (
              <figure key={i} className="prose__figure">
                {yt ? (
                  <div className="prose__embed">
                    <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={b.caption || 'Video'}
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
                  </div>
                ) : (
                  <video src={b.url} controls preload="metadata" playsInline />
                )}
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
