import { useCallback, useState } from 'react';
import Modal from './Modal';
import NoteForm from './NoteForm';
import Icon from './Icon';
import { formatDateTime, wordCount } from '../utils/format';

const pick = ({ title, content, tags, color, pinned }) => ({ title, content, tags, color, pinned });

/**
 * Dialog for reading / editing a note.
 * For a locked note, `lockPassword` is the password the user just typed –
 * it is sent along when saving or deleting and forgotten when the dialog closes.
 */
export default function NoteEditor({ note, lockPassword, tagSuggestions, onSave, onClose, onDelete, onLock }) {
  const [draft, setDraft] = useState(() => pick(note));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(pick(note));
  const edited = new Date(note.editedAt || note.createdAt) - new Date(note.createdAt) > 60 * 1000;

  const requestClose = useCallback(() => {
    if (dirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    onClose();
  }, [dirty, onClose]);

  const save = async () => {
    if (!draft.title.trim()) return setErrors({ title: 'Title is required' });
    if (!dirty) return onClose();
    setSaving(true);
    try {
      await onSave(note.id, { ...draft, title: draft.title.trim() }, lockPassword);
      onClose();
    } catch (err) {
      setErrors(err.details || {});
    } finally {
      setSaving(false);
    }
  };

  const copy = () => navigator.clipboard?.writeText(`${draft.title}\n\n${draft.content}`);

  return (
    <Modal onClose={requestClose} label={`Edit note ${note.title}`} className={`modal--note color-${draft.color}`}>
      {note.locked && (
        <p className="locked-banner">
          <Icon name="lock" size={14} /> Locked note — it will lock again when you close it
        </p>
      )}

      <NoteForm value={draft} onChange={setDraft} errors={errors} tagSuggestions={tagSuggestions} onSubmit={save} autoFocus />

      <p className="note-meta">
        Created {formatDateTime(note.createdAt)}
        {edited && ` · Edited ${formatDateTime(note.editedAt)}`} · {wordCount(draft.content)} words · {draft.content.length} chars
      </p>

      <div className="modal__footer">
        <div className="btn-row">
          <button className="icon-btn" onClick={() => onDelete(note, lockPassword)} title="Delete note" aria-label="Delete note">
            <Icon name="trash" />
          </button>
          <button
            className={`icon-btn ${note.locked ? 'is-active' : ''}`}
            onClick={() => onLock(note, lockPassword)}
            title={note.locked ? 'Remove lock' : 'Lock note'}
            aria-label={note.locked ? 'Remove lock' : 'Lock note'}
          >
            <Icon name={note.locked ? 'lock' : 'unlock'} />
          </button>
          <button className="icon-btn" onClick={copy} title="Copy text" aria-label="Copy note text">
            <Icon name="copy" />
          </button>
        </div>
        <div className="btn-row">
          {dirty && <span className="hint hint--warn">Unsaved changes</span>}
          <button className="btn btn--ghost" onClick={requestClose}>
            Close
          </button>
          <button className="btn btn--ink" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
