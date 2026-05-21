const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '5days', label: 'Last 5 Days' },
  { key: '1month', label: '1 Month' },
];

export default function TimeRow({ period, onPeriodChange }) {
  return (
    <div className="time-row">
      <div className="time-tabs">
        {PERIODS.map(p => (
          <button
            key={p.key}
            className={`t-tab${period === p.key ? ' act' : ''}`}
            onClick={() => onPeriodChange(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="time-spacer"></div>
      <span className="upd-label">Updated: 10:42 AM IST · Apr 12, 2026</span>
    </div>
  );
}
