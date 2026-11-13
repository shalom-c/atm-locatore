import { Link } from 'react-router-dom';

export default function AuthLayout({ title, description, children, footer }) {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" to="/" aria-label="ATM Locator home">
          <span className="brand-mark" aria-hidden="true">Z</span>
          <span>ATM Locator</span>
        </Link>
        <header className="auth-heading">
          <p className="eyebrow">Kebbi State, Nigeria</p>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
        </header>
        {children}
        <footer className="auth-footer">{footer}</footer>
      </section>
    </main>
  );
}
