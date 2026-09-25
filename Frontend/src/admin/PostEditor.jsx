import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Heading, Text, Image, Video, Quote, Up, Down, Trash, Upload, Check, Eye } from '../components/Icons.jsx';
import { adminApi, uploadMedia } from '../lib/api.js';
import { BlockRenderer } from '../components/Shared.jsx';
import { BLOG_CATEGORIES } from '../data/event.js';
import { PageTitle } from './ui.jsx';

const NEW_BLOCK = {
  heading: () => ({ type: 'heading', level: 2, text: '' }),
  paragraph: () => ({ type: 'paragraph', text: '' }),
  image: () => ({ type: 'image', url: '', caption: '' }),
  video: () => ({ type: 'video', url: '', caption: '' }),
  quote: () => ({ type: 'quote', text: '', author: '' }),
};
const BLOCK_BUTTONS = [
  ['heading', 'Heading', Heading], ['paragraph', 'Paragraph', Text], ['image', 'Image', Image],
  ['video', 'Video', Video], ['quote', 'Quote', Quote],
];

// Stable keys for blocks while editing (not saved).
let seq = 0;
const withKey = (b) => ({ ...b, _k: ++seq });

export default function PostEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(id ? null : {
    title: '', slug: '', excerpt: '', type: params.get('type') === 'news' ? 'news' : 'blog',
    category: params.get('type') === 'news' ? 'Announcements' : BLOG_CATEGORIES[0], coverImage: '', status: 'published',
    blocks: [withKey(NEW_BLOCK.paragraph())],
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const [coverProgress, setCoverProgress] = useState(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminApi.get(`/posts/${id}`)
      .then((p) => setPost({ ...p, blocks: p.blocks.map(withKey) }))
      .catch((e) => setError(e.message));
  }, [id]);

  if (!post) return error ? <div className="alert alert--error">{error}</div> : <div className="a-empty"><span className="spinner" /></div>;

  const set = (k) => (e) => setPost((p) => ({ ...p, [k]: e.target.value }));
  const setBlock = (i, patch) => setPost((p) => ({ ...p, blocks: p.blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)) }));
  const addBlock = (type) => setPost((p) => ({ ...p, blocks: [...p.blocks, withKey(NEW_BLOCK[type]())] }));
  const move = (i, d) => setPost((p) => {
    const blocks = [...p.blocks];
    const j = i + d;
    if (j < 0 || j >= blocks.length) return p;
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    return { ...p, blocks };
  });
  const removeBlock = (i) => setPost((p) => ({ ...p, blocks: p.blocks.filter((_, j) => j !== i) }));

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      setCoverProgress(0);
      const { url } = await uploadMedia(file, setCoverProgress);
      setPost((p) => ({ ...p, coverImage: url }));
    } catch (err) { setError(err.message); } finally { setCoverProgress(null); }
  };

  const save = async (status) => {
    setError('');
    setSaved('');
    if (!post.title.trim()) { setError('Please add a title.'); return; }
    setBusy(true);
    const body = { ...post, status: status || post.status, blocks: post.blocks.map(({ _k, ...b }) => b) };
    try {
      const res = id ? await adminApi.put(`/posts/${id}`, body) : await adminApi.post('/posts', body);
      setSaved(res.status === 'published' ? 'Published — live on the website.' : 'Saved as draft.');
      if (!id) navigate(`/admin/posts/${res.id}/edit`, { replace: true });
      else setPost((p) => ({ ...p, ...res, blocks: p.blocks }));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const cleanBlocks = post.blocks.map(({ _k, ...b }) => b);

  return (
    <>
      <PageTitle title={id ? `Edit ${post.type === 'news' ? 'news' : 'blog post'}` : `New ${post.type === 'news' ? 'news' : 'blog post'}`}
        sub={<Link to="/admin/posts" className="linkish">← All posts</Link>}>
        <button className="btn btn--ghost btn--sm" onClick={() => setPreview((v) => !v)}><Eye size={16} /> {preview ? 'Edit' : 'Preview'}</button>
        <button className="btn btn--dark btn--sm" disabled={busy} onClick={() => save('draft')}>Save draft</button>
        <button className="btn btn--gold btn--sm" disabled={busy} onClick={() => save('published')}>
          {busy ? <span className="spinner" /> : <Check size={16} />} {post.status === 'published' && id ? 'Update' : 'Publish'}
        </button>
      </PageTitle>

      {error && <div className="alert alert--error">{error}</div>}
      {saved && <div className="alert alert--ok">{saved}</div>}

      {preview ? (
        <div className="panel editor-preview">
          {post.coverImage && <img src={post.coverImage} alt="" className="editor-preview__cover" />}
          <h1>{post.title || 'Untitled'}</h1>
          {post.excerpt && <p className="muted">{post.excerpt}</p>}
          <BlockRenderer blocks={cleanBlocks} />
        </div>
      ) : (
        <div className="editor">
          <div className="editor__main panel">
            <input className="editor__title" placeholder="Post title…" value={post.title} onChange={set('title')} />
            <textarea className="textarea editor__excerpt" rows={2} placeholder="Short summary (shown on cards)" value={post.excerpt} onChange={set('excerpt')} maxLength={400} />

            <div className="blocks">
              {post.blocks.map((b, i) => (
                <div key={b._k} className="block">
                  <div className="block__bar">
                    <span className="block__type">{b.type}{b.type === 'heading' ? ` H${b.level}` : ''}</span>
                    {b.type === 'heading' && (
                      <button className="linklike" onClick={() => setBlock(i, { level: b.level === 2 ? 3 : 2 })}>Switch to H{b.level === 2 ? 3 : 2}</button>
                    )}
                    <span className="block__tools">
                      <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><Up size={16} /></button>
                      <button onClick={() => move(i, 1)} disabled={i === post.blocks.length - 1} aria-label="Move down"><Down size={16} /></button>
                      <button onClick={() => removeBlock(i)} aria-label="Remove block"><Trash size={16} /></button>
                    </span>
                  </div>
                  <BlockFields block={b} onChange={(patch) => setBlock(i, patch)} onError={setError} />
                </div>
              ))}
            </div>

            <div className="block-add">
              <span>Add block:</span>
              {BLOCK_BUTTONS.map(([type, label, Icon]) => (
                <button key={type} className="btn btn--ghost btn--sm" onClick={() => addBlock(type)}><Icon size={15} /> {label}</button>
              ))}
            </div>
          </div>

          <aside className="editor__side">
            <div className="panel">
              <span className="field__label">Post type</span>
              <div className="seg seg--admin">
                {[['blog', 'Blog'], ['news', 'News']].map(([v, l]) => (
                  <button key={v} className={post.type === v ? 'is-active' : ''} onClick={() => setPost((p) => ({ ...p, type: v }))}>{l}</button>
                ))}
              </div>
              <div className="field">
                <label htmlFor="pe-cat">Category</label>
                <select id="pe-cat" className="select" value={post.category} onChange={set('category')}>
                  {[...new Set([...BLOG_CATEGORIES, post.category])].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="pe-status">Status</label>
                <select id="pe-status" className="select" value={post.status} onChange={set('status')}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="pe-slug">URL slug</label>
                <input id="pe-slug" className="input" value={post.slug} onChange={set('slug')} placeholder="auto from title" />
              </div>
            </div>
            <div className="panel">
              <span className="field__label">Cover image</span>
              <label className="cover-pick">
                {post.coverImage ? <img src={post.coverImage} alt="" /> : <span><Upload size={24} /> Upload cover</span>}
                <input type="file" accept="image/*" onChange={uploadCover} hidden />
              </label>
              {coverProgress !== null && <div className="progress"><span style={{ width: `${coverProgress}%` }} /></div>}
              {post.coverImage && <button className="linklike" onClick={() => setPost((p) => ({ ...p, coverImage: '' }))}>Remove cover</button>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function BlockFields({ block: b, onChange, onError }) {
  const [progress, setProgress] = useState(null);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    onError('');
    try {
      setProgress(0);
      const { url } = await uploadMedia(file, setProgress);
      onChange({ url });
    } catch (err) { onError(err.message); } finally { setProgress(null); }
  };

  switch (b.type) {
    case 'heading':
      return <input className="input block__heading" placeholder="Heading text" value={b.text} onChange={(e) => onChange({ text: e.target.value })} />;
    case 'paragraph':
      return <textarea className="textarea" rows={5} placeholder="Write your paragraph… (blank line = new paragraph)" value={b.text} onChange={(e) => onChange({ text: e.target.value })} />;
    case 'quote':
      return (
        <div className="grid-2">
          <textarea className="textarea" rows={2} placeholder="Quote" value={b.text} onChange={(e) => onChange({ text: e.target.value })} />
          <input className="input" placeholder="Author" value={b.author} onChange={(e) => onChange({ author: e.target.value })} />
        </div>
      );
    default:
      return (
        <div className="block__media">
          {b.url && (b.type === 'image'
            ? <img src={b.url} alt="" />
            : <p className="muted">Video: {b.url}</p>)}
          <div className="block__media-row">
            <label className="btn btn--dark btn--sm">
              <Upload size={15} /> Upload {b.type}
              <input type="file" accept={b.type === 'image' ? 'image/*' : 'video/mp4,video/webm,video/quicktime'} onChange={upload} hidden />
            </label>
            <input className="input" placeholder={b.type === 'video' ? 'or paste a YouTube / https link' : 'or paste an https image link'}
              value={b.url} onChange={(e) => onChange({ url: e.target.value })} />
          </div>
          {progress !== null && <div className="progress"><span style={{ width: `${progress}%` }} /></div>}
          <input className="input" placeholder="Caption (optional)" value={b.caption} onChange={(e) => onChange({ caption: e.target.value })} />
        </div>
      );
  }
}
