import { Link } from 'react-router-dom';
import { Crown } from '../components/Icons.jsx';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container empty">
        <Crown size={60} />
        <h1 className="h-display">Page not found</h1>
        <p>The page you are looking for has walked off the ramp.</p>
        <Link to="/" className="btn btn--dark">Back to Home</Link>
      </div>
    </section>
  );
}
