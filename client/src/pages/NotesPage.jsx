import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import NoteComposer from '../components/NoteComposer';
import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import ConfirmDialog from '../components/ConfirmDialog';
import PasswordPrompt from '../components/PasswordPrompt';
import LockPasswordDialog from '../components/LockPasswordDialog';
import Icon from '../components/Icon';
import { notesApi } from '../api/notes';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import { SORT_OPTIONS } from '../utils/format';

const LAYOUT_KEY = 'notes_layout';

export default function NotesPage() {
  const toast = useToast();
  const { user } = useAuth();

  // ---- data ----
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---- filters ----
  const [view, setView] = useState('all'); // all | pinned | locked
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updated');
  const [layout, setLayout] = useState(() => localStorage.getItem(LAYOUT_KEY) || 'grid');
  const query = useDebounce(search.trim(), 300);

  // ---- dialogs ----
  const [editing, setEditing] = useState(null); // { note, password? }
  const [confirming, setConfirming] = useState(null); // { note, password? }
  const [prompt, setPrompt] = useState(null); // asks for the lock password
  const [lockSetup, setLockSetup] = useState(null); // set / change lock password
  const [deleting, setDeleting] = useState(false);
  const dialogOpen = Boolean(editing || confirming || prompt || lockSetup);

  const searchRef = useRef(null);
  const composerRef = useRef(null);

  // Build the query string for GET /api/notes from the current filters
  const params = useMemo(
    () => ({
      ...(query && { search: query }),
      ...(tag && { tag }),
      ...(view === 'pinned' && { pinned: 'true' }),
      ...(view === 'locked' && { locked: 'true' }),
      sort,
    }),
    [query, tag, view, sort]
  );

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notesApi.list(params);
      setNotes(data.notes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const loadStats = useCallback(() => notesApi.stats().then(setStats).catch(() => {}), []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_KEY, layout);
    } catch {
      /* storage unavailable – ignore */
    }
  }, [layout]);

  // ---- keyboard shortcuts: "/" search, "n" new note ----
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if (typing || e.ctrlKey || e.metaKey || e.altKey || dialogOpen) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        composerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialogOpen]);

  // ---- actions (each one calls the REST API, then refreshes the list) ----
  const refresh = () => Promise.all([loadNotes(), loadStats()]);

  const createNote = async (note) => {
    try {
      await notesApi.create(note);
      toast('Note added');
      if (view === 'locked') setView('all');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
      throw err;
    }
  };

  const saveNote = async (id, changes, lockPassword) => {
    try {
      await notesApi.update(id, changes, lockPassword);
      toast('Note saved');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
      throw err;
    }
  };

  const togglePin = async (note) => {
    try {
      await notesApi.togglePin(note.id);
      toast(note.pinned ? 'Unpinned' : 'Pinned to top');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Open a note – locked notes ask for the lock password every time
  const openNote = (note) => {
    if (!note.locked) return setEditing({ note });
    setPrompt({
      title: 'Unlock note',
      message: `“${note.title}” is locked. Enter your lock password to open it.`,
      confirmLabel: 'Unlock',
      action: async (password) => {
        const full = await notesApi.unlock(note.id, password);
        setPrompt(null);
        setEditing({ note: full, password });
      },
    });
  };

  // Lock a note, or remove its lock (removing needs the password)
  const toggleLock = (note, knownPassword) => {
    if (!note.locked) {
      const lock = async () => {
        try {
          await notesApi.toggleLock(note.id);
          setEditing(null);
          toast('Note locked');
          refresh();
        } catch (err) {
          toast(err.message, 'error');
        }
      };
      if (!user?.hasLockPassword) {
        setEditing(null);
        setLockSetup({
          reason: 'Before locking a note, choose a lock password. You will need it every time you open a locked note.',
          after: lock,
        });
      } else lock();
      return;
    }

    const removeLock = async (password) => {
      await notesApi.toggleLock(note.id, password);
      setPrompt(null);
      setEditing(null);
      toast('Lock removed');
      refresh();
    };
    if (knownPassword) removeLock(knownPassword).catch((err) => toast(err.message, 'error'));
    else
      setPrompt({
        title: 'Remove lock',
        message: `Enter your lock password to unlock “${note.title}” permanently.`,
        confirmLabel: 'Remove lock',
        action: removeLock,
      });
  };

  const askDelete = (note, knownPassword) => {
    setEditing(null);
    if (note.locked && !knownPassword) {
      setPrompt({
        title: 'Delete locked note?',
        message: `“${note.title}” will be permanently deleted. Enter your lock password to confirm.`,
        confirmLabel: 'Delete',
        danger: true,
        action: async (password) => {
          await notesApi.remove(note.id, password);
          setPrompt(null);
          toast('Note deleted');
          refresh();
        },
      });
    } else setConfirming({ note, password: knownPassword });
  };

  const deleteNote = async () => {
    const { note, password } = confirming;
    setDeleting(true);
    try {
      await notesApi.remove(note.id, password);
      setConfirming(null);
      toast(
        'Note deleted',
        'success',
        // Undo re-creates the note from the copy we still have (not offered for locked notes)
        note.locked
          ? undefined
          : {
              label: 'Undo',
              onClick: () =>
                notesApi
                  .create({ title: note.title, content: note.content, tags: note.tags, color: note.color, pinned: note.pinned })
                  .then(refresh),
            }
      );
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const exportNotes = async () => {
    try {
      // Locked notes are exported with their title only – their content never leaves the server
      const { notes: all } = await notesApi.list();
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `notes-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast(`Exported ${all.length} notes`);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTag('');
    setView('all');
  };

  // ---- derived ----
  const tagNames = stats?.tags?.map((t) => t.tag) || [];
  const pinnedNotes = view === 'all' ? notes.filter((n) => n.pinned) : [];
  const otherNotes = view === 'all' ? notes.filter((n) => !n.pinned) : notes;
  const filtering = Boolean(query || tag);

  const heading = tag ? `#${tag}` : view === 'pinned' ? 'Pinned' : view === 'locked' ? 'Locked notes' : 'All notes';

  const renderGrid = (list) => (
    <div className={`notes ${layout === 'list' ? 'notes--list' : ''}`}>
      {list.map((n) => (
        <NoteCard
          key={n.id}
          note={n}
          query={query}
          onOpen={openNote}
          onPin={togglePin}
          onLock={(note) => toggleLock(note)}
          onDelete={(note) => askDelete(note)}
          onTagClick={(t) => {
            setTag(t);
            setView('all');
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="page">
      <Header />

      <div className="layout">
        <Sidebar
          stats={stats}
          view={view}
          tag={tag}
          onView={setView}
          onTag={setTag}
          onExport={exportNotes}
          hasLockPassword={user?.hasLockPassword}
          onLockSettings={() => setLockSetup({})}
        />

        <main className="main">
          <div className="toolbar">
            <label className="search">
              <Icon name="search" size={16} />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes…  ( / )"
                aria-label="Search notes"
              />
            </label>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort notes">
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="segmented" role="group" aria-label="Layout">
              <button className={layout === 'grid' ? 'is-active' : ''} onClick={() => setLayout('grid')} title="Grid view" aria-label="Grid view">
                <Icon name="grid" size={15} />
              </button>
              <button className={layout === 'list' ? 'is-active' : ''} onClick={() => setLayout('list')} title="List view" aria-label="List view">
                <Icon name="list" size={15} />
              </button>
            </div>
          </div>

          {view !== 'locked' && <NoteComposer ref={composerRef} onCreate={createNote} tagSuggestions={tagNames} defaultTag={tag} />}

          <div className="section-head">
            <h2>{heading}</h2>
            <span className="section-head__meta">
              {loading ? 'Loading…' : `${notes.length} result${notes.length === 1 ? '' : 's'}`}
              {filtering && (
                <button className="link-btn" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </span>
          </div>

          {error ? (
            <div className="panel panel--error">
              <p>{error}</p>
              <button className="btn btn--outline" onClick={loadNotes}>
                Try again
              </button>
            </div>
          ) : loading && notes.length === 0 ? (
            <div className="notes">
              {[1, 2, 3].map((i) => (
                <div key={i} className="note-card skeleton" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="panel panel--empty">
              {filtering ? (
                <p>No notes match {query ? <strong>“{query}”</strong> : 'this filter'}.</p>
              ) : view === 'locked' ? (
                <p>No locked notes — use the lock icon on a note to protect it with a password.</p>
              ) : view === 'pinned' ? (
                <p>Nothing pinned yet — tap the pin on a note to keep it on top.</p>
              ) : (
                <p>Nothing on the page yet — take a note above.</p>
              )}
            </div>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <>
                  <p className="group-label">Pinned</p>
                  {renderGrid(pinnedNotes)}
                  {otherNotes.length > 0 && <p className="group-label">Others</p>}
                </>
              )}
              {otherNotes.length > 0 && renderGrid(otherNotes)}
            </>
          )}

          <footer className="page-foot">
            <span>
              Shortcuts: <kbd>/</kbd> search · <kbd>N</kbd> new note · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> save · <kbd>Esc</kbd> close
            </span>
            <span>Saved securely to your account</span>
          </footer>
        </main>
      </div>

      {editing && (
        <NoteEditor
          key={editing.note.id}
          note={editing.note}
          lockPassword={editing.password}
          tagSuggestions={tagNames}
          onSave={saveNote}
          onClose={() => setEditing(null)}
          onDelete={askDelete}
          onLock={toggleLock}
        />
      )}

      {prompt && (
        <PasswordPrompt
          title={prompt.title}
          message={prompt.message}
          confirmLabel={prompt.confirmLabel}
          danger={prompt.danger}
          onSubmit={prompt.action}
          onCancel={() => setPrompt(null)}
        />
      )}

      {lockSetup && (
        <LockPasswordDialog
          reason={lockSetup.reason}
          onCancel={() => setLockSetup(null)}
          onDone={(msg) => {
            const after = lockSetup.after;
            setLockSetup(null);
            toast(msg);
            after?.();
          }}
        />
      )}

      {confirming && (
        <ConfirmDialog
          title="Delete this note?"
          message={`“${confirming.note.title}” will be permanently deleted.`}
          onConfirm={deleteNote}
          onCancel={() => setConfirming(null)}
          busy={deleting}
        />
      )}
    </div>
  );
}
