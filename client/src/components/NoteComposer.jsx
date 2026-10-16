import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import NoteForm, { EMPTY_NOTE } from './NoteForm';

/**
 * The "Take a note…" bar at the top of the list.
 * Collapsed: one line (title + tag + ADD) for quick notes.
 * Expanded: the full form with content, tags, colour and pin.
 */
const NoteComposer = forwardRef(function NoteComposer({ onCreate, tagSuggestions, defaultTag }, ref) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(EMPTY_NOTE);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);
  const quickRef = useRef(null);
  const boxRef = useRef(null);

  // Lets the page focus the composer with the "N" shortcut
  useImperativeHandle(ref, () => ({ focus: () => quickRef.current?.focus() || titleRef.current?.focus() }));

  // When a tag is selected in the sidebar, new notes get that tag by default
  useEffect(() => {
    if (!expanded) setNote((n) => ({ ...n, tags: defaultTag ? [defaultTag] : [] }));
  }, [defaultTag, expanded]);

  const reset = () => {
    setNote({ ...EMPTY_NOTE, tags: defaultTag ? [defaultTag] : [] });
    setErrors({});
    setExpanded(false);
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!note.title.trim()) {
      setErrors({ title: 'Give your note a title' });
      setExpanded(true);
      setTimeout(() => titleRef.current?.focus());
      return;
    }
    setSaving(true);
    try {
      await onCreate({ ...note, title: note.title.trim() });
      reset();
    } catch (err) {
      setErrors(err.details || {});
    } finally {
      setSaving(false);
    }
  };

  // Collapse when clicking outside an untouched composer
  useEffect(() => {
    if (!expanded) return;
    const onClick = (e) => {
      const untouched = !note.title && !note.content;
      if (untouched && boxRef.current && !boxRef.current.contains(e.target)) setExpanded(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [expanded, note.title, note.content]);

  if (!expanded) {
    return (
      <form className="composer composer--collapsed" onSubmit={submit}>
        <input
          ref={quickRef}
          className="input"
          placeholder="Take a note…"
          value={note.title}
          onChange={(e) => setNote({ ...note, title: e.target.value })}
          onFocus={() => {
            setExpanded(true);
            setTimeout(() => titleRef.current?.focus());
          }}
          aria-label="Take a note"
        />
        <select
          className="select"
          value={note.tags[0] || ''}
          onChange={(e) => setNote({ ...note, tags: e.target.value ? [e.target.value] : [] })}
          aria-label="Tag"
        >
          <option value="">No tag</option>
          {tagSuggestions.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </select>
        <button className="btn btn--ink" type="submit" disabled={saving}>
          Add
        </button>
      </form>
    );
  }

  return (
    <form ref={boxRef} className={`composer composer--open color-${note.color}`} onSubmit={submit}>
      <NoteForm
        value={note}
        onChange={(v) => {
          setNote(v);
          if (errors.title && v.title.trim()) setErrors({});
        }}
        errors={errors}
        tagSuggestions={tagSuggestions}
        onSubmit={submit}
        titleRef={titleRef}
      />
      <div className="composer__footer">
        <span className="hint">Ctrl + Enter to save</span>
        <div className="btn-row">
          <button type="button" className="btn btn--ghost" onClick={reset}>
            Cancel
          </button>
          <button className="btn btn--ink" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Add note'}
          </button>
        </div>
      </div>
    </form>
  );
});

export default NoteComposer;
