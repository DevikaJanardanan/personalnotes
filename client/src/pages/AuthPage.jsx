import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DateStamp from '../components/DateStamp';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

/**
 * Login and Register share one component – `mode` decides which fields to show.
 */
export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors({ ...errors, [field]: undefined });
  };

  // Client-side checks (the server validates again)
  const validate = () => {
    const e = {};
    if (isRegister && !form.name.trim()) e.name = 'Please enter your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email';
    if (form.password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!validate()) return;
    setBusy(true);
    try {
      if (isRegister) await register(form.name.trim(), form.email.trim(), form.password);
      else await login(form.email.trim(), form.password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setErrors(err.details || {});
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="masthead__top">
          <div>
            <h1 className="brand">Notes.</h1>
            <p className="kicker">{isRegister ? 'Start a new notebook' : 'Personal notebook'}</p>
          </div>
          <DateStamp />
        </div>
        <hr className="rule" />

        <h2 className="auth__title">{isRegister ? 'Create account' : 'Log in'}</h2>

        {message && <div className="alert">{message}</div>}

        <form onSubmit={submit} noValidate className="auth__form">
          {isRegister && (
            <label className="field">
              <span className="field__label">Name</span>
              <input className="input" value={form.name} onChange={set('name')} autoComplete="name" placeholder="Your name" autoFocus />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </label>
          )}

          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              placeholder="you@example.com"
              autoFocus={!isRegister}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <span className="input-wrap">
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder={isRegister ? 'At least 6 characters' : '••••••••'}
              />
              <button type="button" className="input-wrap__btn" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                <Icon name={showPw ? 'eyeOff' : 'eye'} size={16} />
              </button>
            </span>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>

          <button className="btn btn--ink btn--block btn--lg" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="auth__switch">
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link>
        </p>
      </div>
      <p className="auth__foot">Your notes are private — only you can see them.</p>
    </div>
  );
}
