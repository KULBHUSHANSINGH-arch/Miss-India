import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BlockRenderer } from '../components/Shared.jsx';
import { Calendar, Arrow, Whatsapp, Crown } from '../components/Icons.jsx';
import { api, formatDate } from '../lib/api.js';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setPost(null);
    setError('');
    api.get(`/api/posts/${encodeURIComponent(slug)}`).then(setPost).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    if (post) document.title = `${post.title} · Miss India 2026`;
    return () => { document.title = "Miss India 2026 · Global India's Biggest Beauty Pageant"; };
  }, [post]);

  if (error) {
    return (
      <section className="section"><div className="container empty">
        <h2>Story not found</h2>
        <Link to="/blog" className="btn btn--dark">Back to Blog</Link>
      </div></section>
    );
  }
  if (!post) return <section className="section"><div className="empty"><span className="spinner" /></div></section>;

  const share = `https://wa.me/?text=${encodeURIComponent(`${post.title} ${window.location.href}`)}`;

  return (
    <article>
      <header className="post-hero">
        <div className="container post-hero__grid">
          <div className="post-hero__copy">
            <Link to="/blog" className="post-hero__back">← All stories</Link>
            <span className="chip">{post.category}</span>
            <h1>{post.title}</h1>
            {post.excerpt && <p className="post-hero__lead">{post.excerpt}</p>}
            <span className="post-hero__date"><Calendar size={16} /> {formatDate(post.createdAt)}</span>
          </div>
          {post.coverImage && (
            <div className="post-hero__media frame-gold">
              <img src={post.coverImage} alt="" />
            </div>
          )}
        </div>
      </header>
      <section className="section post-body">
        <div className="container post-body__inner">
          <BlockRenderer blocks={post.blocks} />
          <div className="post-share">
            <span><Crown size={20} /> Share this story</span>
            <a className="btn btn--sm btn--rose" href={share} target="_blank" rel="noreferrer"><Whatsapp size={16} /> WhatsApp</a>
            <Link to="/blog" className="btn btn--sm btn--dark">More stories <Arrow size={16} /></Link>
          </div>
        </div>
      </section>
    </article>
  );
}
