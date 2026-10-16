import Icon from './Icon';

/** Left column: notebook views, tag filters, lock password and export. */
export default function Sidebar({ stats, view, tag, onView, onTag, onExport, onLockSettings, hasLockPassword }) {
  const views = [
    { id: 'all', label: 'All notes', icon: 'notes', count: stats?.total },
    { id: 'pinned', label: 'Pinned', icon: 'pin', count: stats?.pinned },
    { id: 'locked', label: 'Locked', icon: 'lock', count: stats?.locked },
  ];

  return (
    <aside className="sidebar">
      <nav aria-label="Notebook">
        <h2 className="sidebar__heading">Notebook</h2>
        <ul className="sidebar__list">
          {views.map((v) => (
            <li key={v.id}>
              <button
                className={`sidebar__item ${view === v.id && !tag ? 'is-active' : ''}`}
                onClick={() => {
                  onView(v.id);
                  onTag('');
                }}
              >
                <Icon name={v.icon} size={15} />
                <span>{v.label}</span>
                <span className="count">{v.count ?? '–'}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Tags">
        <h2 className="sidebar__heading">Tags</h2>
        {stats?.tags?.length ? (
          <ul className="sidebar__list">
            {stats.tags.map(({ tag: t, count }) => (
              <li key={t}>
                <button
                  className={`sidebar__item ${tag === t ? 'is-active' : ''}`}
                  onClick={() => {
                    onTag(tag === t ? '' : t);
                    onView('all');
                  }}
                >
                  <span className="hash">#</span>
                  <span className="truncate">{t}</span>
                  <span className="count">{count}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sidebar__empty">No tags yet. Add some to a note to group them here.</p>
        )}
      </nav>

      <div className="sidebar__actions">
        <button className="btn btn--outline btn--block" onClick={onLockSettings}>
          <Icon name="key" size={14} /> {hasLockPassword ? 'Change lock password' : 'Set lock password'}
        </button>
        <button className="btn btn--outline btn--block" onClick={onExport}>
          <Icon name="download" size={14} /> Export JSON
        </button>
      </div>
    </aside>
  );
}
