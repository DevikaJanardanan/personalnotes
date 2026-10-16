import Icon from './Icon';
import TagInput from './TagInput';
import { NOTE_COLORS } from '../utils/format';

/**
 * The fields of a note (title, content, tags, colour, pin).
 * Shared by the quick composer and the edit dialog.
 * It is a "controlled" form: the parent owns `value` and receives every change.
 */
export default function NoteForm({ value, onChange, errors = {}, tagSuggestions = [], autoFocus, onSubmit, titleRef }) {
  const set = (field) => (v) => onChange({ ...value, [field]: v });

  // Ctrl/Cmd + Enter saves from anywhere in the form
  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div className="note-form" onKeyDown={onKeyDown}>
      <div className="note-form__row">
        <input
          ref={titleRef}
          className={`note-form__title ${errors.title ? 'has-error' : ''}`}
          value={value.title}
          onChange={(e) => set('title')(e.target.value)}
          placeholder="Title"
          maxLength={120}
          autoFocus={autoFocus}
          aria-label="Note title"
          aria-invalid={!!errors.title}
        />
        <button
          type="button"
          className={`icon-btn ${value.pinned ? 'is-active' : ''}`}
          onClick={() => set('pinned')(!value.pinned)}
          title={value.pinned ? 'Unpin' : 'Pin to top'}
          aria-pressed={value.pinned}
        >
          <Icon name="pin" filled={value.pinned} />
        </button>
      </div>
      {errors.title && <p className="field-error">{errors.title}</p>}

      <textarea
        className="note-form__content"
        value={value.content}
        onChange={(e) => set('content')(e.target.value)}
        placeholder="Write your note…"
        rows={6}
        maxLength={20000}
        aria-label="Note content"
      />
      {errors.content && <p className="field-error">{errors.content}</p>}

      <TagInput tags={value.tags} onChange={set('tags')} suggestions={tagSuggestions} />
      {errors.tags && <p className="field-error">{errors.tags}</p>}

      <div className="swatches" role="radiogroup" aria-label="Note colour">
        {NOTE_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={value.color === c.id}
            className={`swatch color-${c.id} ${value.color === c.id ? 'is-selected' : ''}`}
            onClick={() => set('color')(c.id)}
            title={c.label}
          />
        ))}
      </div>
    </div>
  );
}

export const EMPTY_NOTE = { title: '', content: '', tags: [], color: 'default', pinned: false };
