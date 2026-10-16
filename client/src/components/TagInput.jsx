import { useId, useState } from 'react';
import { normaliseTag } from '../utils/format';

/**
 * Tag "chips" editor. Type a tag and press Enter or comma to add it,
 * Backspace on an empty box removes the last tag. Suggests existing tags.
 */
export default function TagInput({ tags, onChange, suggestions = [], max = 10 }) {
  const [text, setText] = useState('');
  const listId = useId();

  const add = (raw) => {
    const tag = normaliseTag(raw);
    if (!tag || tags.includes(tag) || tags.length >= max) return;
    onChange([...tags, tag]);
  };

  const remove = (tag) => onChange(tags.filter((t) => t !== tag));

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(text);
      setText('');
    } else if (e.key === 'Backspace' && !text && tags.length) {
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="tag-input">
      {tags.map((t) => (
        <span key={t} className="chip chip--removable">
          #{t}
          <button type="button" onClick={() => remove(t)} aria-label={`Remove tag ${t}`}>
            ×
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => {
          const v = e.target.value;
          // If a suggestion was picked from the list, add it straight away
          if (suggestions.includes(v)) {
            add(v);
            setText('');
          } else setText(v);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (text) add(text);
          setText('');
        }}
        list={listId}
        placeholder={tags.length >= max ? 'Tag limit reached' : 'Add tag + Enter'}
        disabled={tags.length >= max}
        aria-label="Add a tag"
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !tags.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}
