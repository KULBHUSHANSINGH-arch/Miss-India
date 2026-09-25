import { Link } from 'react-router-dom';
import { Crown } from './Icons.jsx';

export default function Logo({ onClick }) {
  return (
    <Link to="/" className="logo" onClick={onClick} aria-label="Miss India 2026 — home">
      <span className="logo__mark"><Crown size={30} /></span>
      <span className="logo__text">
        <span className="logo__name">Miss India</span>
        <span className="logo__sub">Global · 2026</span>
      </span>
    </Link>
  );
}
