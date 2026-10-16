import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth">
      <div className="auth__card not-found">
        <div className="stamp stamp--big">
          <span className="stamp__date">404</span>
          <span className="stamp__label">Page missing</span>
        </div>
        <p>This page was torn out of the notebook.</p>
        <Link className="btn btn--ink" to="/">
          Back to my notes
        </Link>
      </div>
    </div>
  );
}
