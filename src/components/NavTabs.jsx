const TABS = [
  { page: 'overview', label: 'Overview' },
  { page: 'watchlist', label: '★ Watchlist' },
  { page: 'indian', label: 'Indian Indices' },
  { page: 'global', label: 'Global' },
  { page: 'commodities', label: 'Commodities' },
  { page: 'forex', label: 'Forex & Rates' },
  { page: 'news', label: 'News' },
  { page: 'blog', label: 'Blog' },
  { page: 'calendar', label: 'Eco Calendar' },
];

export default function NavTabs({ currentPage, onPageChange }) {
  return (
    <nav className="nav">
      {TABS.map(t => (
        <div
          key={t.page}
          className={`nav-tab${currentPage === t.page ? ' act' : ''}`}
          onClick={() => onPageChange(t.page)}
        >
          {t.label}
        </div>
      ))}
    </nav>
  );
}
