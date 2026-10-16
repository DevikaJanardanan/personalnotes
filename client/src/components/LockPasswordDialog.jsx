import { useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { authApi } from '../api/notes';
import { useAuth } from '../context/AuthContext';

/**
 * Set the lock password (first time) or change it (needs the current one).
 * The lock password is separate from the login password and protects locked notes.
 */
export default function LockPasswordDialog({ onDone, onCancel, reason }) {
  const { user, updateUser } = useAuth();
  const changing = Boolean(user?.hasLockPassword);

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors({ ...errors, [field]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (changing && !form.currentPassword) errs.currentPassword = 'Enter your current lock password';
    if (form.newPassword.length < 4) errs.newPassword = 'At least 4 characters';
    if (form.confirm !== form.newPassword) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    setMessage('');
    try {
      const u = await authApi.setLockPassword({
        newPassword: form.newPassword,
        ...(changing && { currentPassword: form.currentPassword }),
      });
      updateUser(u);
      onDone(changing ? 'Lock password changed' : 'Lock password set');
    } catch (err) {
      setErrors(err.details || {});
      setMessage(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onCancel} label="Lock password" className="modal--small">
      <form onSubmit={submit} noValidate>
        <div className="lock-badge">
          <Icon name="key" size={22} />
        </div>
        <h2 className="modal__title">{changing ? 'Change lock password' : 'Set a lock password'}</h2>
        <p className="modal__text">
          {reason ||
            'This password protects your locked notes. You will be asked for it every time you open one. It is separate from your login password.'}
        </p>

        {message && <div className="alert">{message}</div>}

        <div className="auth__form">
          {changing && (
            <label className="field">
              <span className="field__label">Current lock password</span>
              <input className="input" type="password" value={form.currentPassword} onChange={set('currentPassword')} autoFocus autoComplete="off" />
              {errors.currentPassword && <span className="field-error">{errors.currentPassword}</span>}
            </label>
          )}
          <label className="field">
            <span className="field__label">New lock password</span>
            <input className="input" type="password" value={form.newPassword} onChange={set('newPassword')} autoFocus={!changing} autoComplete="new-password" placeholder="At least 4 characters" />
            {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
          </label>
          <label className="field">
            <span className="field__label">Confirm lock password</span>
            <input className="input" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </label>
        </div>

        <div className="btn-row btn-row--end modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn--ink" disabled={busy}>
            {busy ? 'Saving…' : changing ? 'Change' : 'Set password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
