/** The red rubber-stamp date in the header (e.g. "14 Oct / TODAY"). */
export default function DateStamp() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = now.toLocaleString('en-GB', { month: 'short' });
  const weekday = now.toLocaleString('en-GB', { weekday: 'long' });

  return (
    <div className="stamp" title={`${weekday}, ${now.toLocaleDateString('en-GB')}`}>
      <span className="stamp__date">
        {day} {month}
      </span>
      <span className="stamp__label">Today</span>
    </div>
  );
}
