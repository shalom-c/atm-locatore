import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { getAuthErrorMessage, signIn } from '../lib/auth.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestError, setRequestError] = useState('');
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setRequestError('');
    if (!email.trim() || !password) {
      setRequestError('Enter your email address and password.');
      return;
    }

    setPending(true);
    try {
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch (error) {
      setRequestError(getAuthErrorMessage(error));
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Log in to find ATMs near you."
      footer={<>New to ATM Locator? <Link to="/signup">Create an account</Link></>}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {requestError && <p className="form-error" role="alert">{requestError}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={pending}>
          {pending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
