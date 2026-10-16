import Icon from './Icon';
import { noteDateLabel, splitForHighlight } from '../utils/format';

/** Wraps every occurrence of the search term in <mark>. */
function Highlight({ text, query }) {
  return splitForHighlight(text, query).map((p, i) => (p.match ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>));
}

/**
 * One note in the grid / list. Click (or press Enter) to open it.
 * Locked notes only show their title – the content stays hidden until unlocked.
 */
export default function NoteCard({ note, query, onOpen, onPin, onLock, onDelete, onTagClick }) {
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn(note);
  };

  return (
    <article
      className={`note-card color-${note.color} ${note.pinned ? 'is-pinned' : ''} ${note.locked ? 'is-locked' : ''}`}
      onClick={() => onOpen(note)}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onOpen(note)}
      tabIndex={0}
      aria-label={note.locked ? `Locked note ${note.title}` : `Open note ${note.title}`}
    >
      <header className="note-card__head">
        <h3 className="note-card__title">
          {note.locked && <Icon name="lock" size={16} className="title-lock" />}
          <Highlight text={note.title} query={query} />
        </h3>
        <button
          className={`icon-btn icon-btn--sm ${note.pinned ? 'is-active' : ''}`}
          onClick={stop(onPin)}
          title={note.pinned ? 'Unpin' : 'Pin'}
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
        >
          <Icon name="pin" size={16} filled={note.pinned} />
        </button>
      </header>

      {note.locked ? (
        <div className="note-card__locked">
          <span className="locked-lines" aria-hidden="true" />
          <span>Locked · click to unlock</span>
        </div>
      ) : (
        note.content && (
          <p className="note-card__content">
            <Highlight text={note.content} query={query} />
          </p>
        )
      )}

      {!note.locked && note.tags.length > 0 && (
        <div className="note-card__tags">
          {note.tags.map((t) => (
            <button
              key={t}
              className="chip"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(t);
              }}
              title={`Show #${t} notes`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <footer className="note-card__foot">
        <time dateTime={note.editedAt || note.createdAt}>{noteDateLabel(note)}</time>
        <div className="note-card__actions">
          <button
            className={`icon-btn icon-btn--sm ${note.locked ? 'is-active' : ''}`}
            onClick={stop(onLock)}
            title={note.locked ? 'Remove lock' : 'Lock note'}
            aria-label={note.locked ? 'Remove lock' : 'Lock note'}
          >
            <Icon name={note.locked ? 'lock' : 'unlock'} size={16} />
          </button>
          <button className="icon-btn icon-btn--sm icon-btn--danger" onClick={stop(onDelete)} title="Delete" aria-label="Delete note">
            <Icon name="trash" size={16} />
          </button>
        </div>
      </footer>
    </article>
  );
}
