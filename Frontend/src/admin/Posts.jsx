import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash, Eye, Crown } from '../components/Icons.jsx';
import { adminApi, formatDate } from '../lib/api.js';
import { PageTitle, Empty } from './ui.jsx';

export default function Posts() {
  const [posts, setPosts] = useState(null);
  const [tab, setTab] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get('/posts').then(setPosts).catch((e) => setError(e.message));
  }, []);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await adminApi.del(`/posts/${p.id}`);
      setPosts((ps) => ps.filter((x) => x.id !== p.id));
    } catch (err) { setError(err.message); }
  };

  const shown = (posts || []).filter((p) => tab === 'all' || (tab === 'draft' ? p.status === 'draft' : p.type === tab));
  const count = (t) => (posts || []).filter((p) => (t === 'draft' ? p.status === 'draft' : p.type === t)).length;

  return (
    <>
      <PageTitle title="Blog & News" sub="Write, edit, publish or unpublish posts. Published posts appear on the website instantly.">
        <Link to="/admin/posts/new?type=news" className="btn btn--dark btn--sm"><Plus size={16} /> News</Link>
        <Link to="/admin/posts/new" className="btn btn--gold btn--sm"><Plus size={16} /> Blog post</Link>
      </PageTitle>

      <div className="seg seg--admin seg--inline">
        {[['all', `All (${posts?.length || 0})`], ['news', `News (${count('news')})`], ['blog', `Blog (${count('blog')})`], ['draft', `Drafts (${count('draft')})`]].map(([v, l]) => (
          <button key={v} className={tab === v ? 'is-active' : ''} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {!posts ? <div className="a-empty"><span className="spinner" /></div> : !shown.length ? (
        <Empty>Nothing here yet. <Link to="/admin/posts/new" className="linkish">Write your first post →</Link></Empty>
      ) : (
        <div className="post-list">
          {shown.map((p) => (
            <article key={p.id} className="post-row">
              <div className="post-row__img">{p.coverImage ? <img src={p.coverImage} alt="" /> : <Crown size={30} />}</div>
              <div className="post-row__body">
                <div className="post-row__tags">
                  <span className={`pill ${p.type === 'news' ? 'pill--news' : 'pill--blog'}`}>{p.type}</span>
                  <span className={`pill pill--${p.status === 'published' ? 'confirmed' : 'pending'}`}>{p.status}</span>
                  <span className="chip chip--muted">{p.category}</span>
                </div>
                <h3>{p.title}</h3>
                <small className="muted">Created {formatDate(p.createdAt)} · Updated {formatDate(p.updatedAt)}</small>
              </div>
              <div className="post-row__actions">
                {p.status === 'published' && (
                  <a className="icon-btn icon-btn--dark" href={`/blog/${p.slug}`} target="_blank" rel="noopener" title="View on website"><Eye size={17} /></a>
                )}
                <Link className="icon-btn icon-btn--dark" to={`/admin/posts/${p.id}/edit`} title="Edit"><Edit size={17} /></Link>
                <button className="icon-btn icon-btn--dark icon-btn--danger" onClick={() => remove(p)} title="Delete"><Trash size={17} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
