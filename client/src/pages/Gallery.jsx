import { useCallback, useMemo, useState } from 'react';
import { PageHero, Pic, Reveal, Lightbox } from '../components/Shared.jsx';
import { Eye } from '../components/Icons.jsx';
import { GALLERY } from '../data/event.js';

const TAGS = ['All', ...new Set(GALLERY.map((g) => g.tag))];

export default function Gallery() {
  const [tag, setTag] = useState('All');
  const [lb, setLb] = useState(null);
  const items = useMemo(() => (tag === 'All' ? GALLERY : GALLERY.filter((g) => g.tag === tag)), [tag]);
  const close = useCallback(() => setLb(null), []);

  return (
    <>
      <PageHero eyebrow="Gallery" title="Moments of" script="Glamour" text="Runway looks, crowning moments and official posters of Miss India 2026." />
      <section className="section">
        <div className="container">
          <div className="tabs" role="tablist">
            {TAGS.map((t) => (
              <button key={t} role="tab" aria-selected={tag === t} className={`tab ${tag === t ? 'is-active' : ''}`} onClick={() => setTag(t)}>{t}</button>
            ))}
          </div>
          <div className="masonry">
            {items.map((img, i) => (
              <Reveal key={img.src} className="masonry__item" delay={(i % 3) * 80}>
                <button className="masonry__btn" onClick={() => setLb(i)} aria-label={`Open ${img.alt}`}>
                  <Pic img={img} />
                  <span className="masonry__overlay"><span className="chip">{img.tag}</span><Eye size={22} /></span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <Lightbox items={items} index={lb} onClose={close} onIndex={setLb} />
    </>
  );
}
