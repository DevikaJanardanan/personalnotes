// Tiny inline SVG icon set – no icon library needed.
const PATHS = {
  pin: 'M9 4h6l-1 5 3 3v2h-4v6l-1 1-1-1v-6H6v-2l3-3-1-5z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2',
  unlock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2M12 15v2',
  key: 'M8 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 11l9 9M17 17l2-2M15 15l2-2',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M4 5h16v4H4zM4 11h16v4H4zM4 17h16v3H4z',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  notes: 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h4',
  tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff: 'M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.3 3.9M6.6 6.6C3.8 8.3 2 12 2 12s4 7 10 7c1.7 0 3.2-.5 4.5-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2',
  copy: 'M8 8h12v12H8zM4 16V4h12',
};

export default function Icon({ name, size = 18, filled = false, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
