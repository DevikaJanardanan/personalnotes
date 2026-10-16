import { useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';

/**
 * Asks for the lock password. Used to open a locked note, remove a lock
 * or delete a locked note. `onSubmit(password)` should throw on a wrong password.
 */
export default function PasswordPrompt({ title, message, confirmLabel = 'Unlock', danger = false, onSubmit, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!password) return setError('Enter your lock password');
    setBusy(true);
    setError('');
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err.message || 'Incorrect lock password');
      setPassword('');
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onCancel} label={title} className="modal--small">
      <form onSubmit={submit}>
        <div className="lock-badge">
          <Icon name="lock" size={22} />
        </div>
        <h2 className="modal__title">{title}</h2>
        {message && <p className="modal__text">{message}</p>}

        <label className="field">
          <span className="field__label">Lock password</span>
          <span className="input-wrap">
            <input
              className="input"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              autoFocus
              autoComplete="off"
              aria-invalid={!!error}
            />
            <button type="button" className="input-wrap__btn" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
              <Icon name={show ? 'eyeOff' : 'eye'} size={16} />
            </button>
          </span>
          {error && <span className="field-error">{error}</span>}
        </label>

        <div className="btn-row btn-row--end modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className={`btn ${danger ? 'btn--danger-solid' : 'btn--ink'}`} disabled={busy}>
            {busy ? 'Checking…' : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
