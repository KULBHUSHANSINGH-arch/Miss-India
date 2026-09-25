import { useEffect, useMemo, useState } from 'react';
import { PageHero, BlogCard, Reveal } from '../components/Shared.jsx';
import { api } from '../lib/api.js';

export default function Blog() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    api.get('/api/posts').then(setPosts).catch((e) => { setError(e.message); setPosts([]); });
  }, []);

  const cats = useMemo(() => ['All', ...new Set((posts || []).map((p) => p.category))], [posts]);
  const shown = (posts || []).filter((p) => cat === 'All' || p.category === cat);

  return (
    <>
      <PageHero eyebrow="Blog & news" title="Stories from the" script="Runway" text="Announcements, grooming tips, behind-the-scenes and winner stories." />
      <section className="section">
        <div className="container">
          {cats.length > 2 && (
            <div className="tabs">
              {cats.map((c) => (
                <button key={c} className={`tab ${cat === c ? 'is-active' : ''}`} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
          )}
          {posts === null && <div className="empty"><span className="spinner" /></div>}
          {error && <div className="alert alert--error">Could not load posts: {error}</div>}
          {posts && !shown.length && !error && <div className="empty">No stories yet — check back soon.</div>}
          <div className="blog-grid">
            {shown.map((p, i) => <Reveal key={p.id} delay={(i % 3) * 80}><BlogCard post={p} /></Reveal>)}
          </div>
        </div>
      </section>
    </>
  );
}
