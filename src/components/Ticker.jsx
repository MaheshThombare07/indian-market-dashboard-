import { TICKER_DATA } from '../data';

export default function Ticker() {
  const items = [...TICKER_DATA, ...TICKER_DATA];
  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {items.map((t, i) => (
          <div className="t-item" key={i}>
            <span className="t-name">{t.name}</span>
            <span className="t-val">{t.val}</span>
            <span className={`t-chg ${t.up ? 't-up' : 't-dn'}`}>
              {t.up ? '▲' : '▼'} {t.chg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
