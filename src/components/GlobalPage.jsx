import { GLOBAL } from '../data';
import IndexRow from './IndexRow';

export default function GlobalPage({ period, watchlist, onToggleWatch }) {
  const panels = [
    { title: 'US markets', badge: 'ranked', data: GLOBAL.slice(0, 5) },
    { title: 'European markets', badge: 'ranked', data: GLOBAL.slice(5, 8) },
    { title: 'Asian markets', badge: 'ranked', data: GLOBAL.slice(8) },
  ];

  return (
    <div className="full-page">
      <div className="fp-grid">
        {panels.map(p => (
          <div className="panel" key={p.title}>
            <div className="panel-hdr">
              <span className="panel-title">{p.title}</span>
              <span className="panel-badge">{p.badge}</span>
            </div>
            <div className="panel-scroll">
              {[...p.data].sort((a,b) => (b.chg[period]||0)-(a.chg[period]||0)).map((item, i) => (
                <IndexRow key={item.id} item={item} period={period} showRank rank={i+1} isWatched={watchlist.includes(item.id)} onToggleWatch={onToggleWatch} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
