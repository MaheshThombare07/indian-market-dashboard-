import { COMMODITIES } from '../data';
import IndexRow from './IndexRow';

export default function CommoditiesPage({ period, watchlist, onToggleWatch }) {
  const panels = [
    { title: 'Precious metals', badge: 'MCX · ranked', ids: ['gold24','mcxgld','silver'] },
    { title: 'Energy', badge: 'ranked', ids: ['brent','wti','natgas','pet'] },
    { title: 'Base metals', badge: 'ranked', ids: ['copper','nickel','zinc','alum'] },
  ];

  return (
    <div className="full-page">
      <div className="fp-grid">
        {panels.map(p => {
          const data = COMMODITIES.filter(c => p.ids.includes(c.id));
          return (
            <div className="panel" key={p.title}>
              <div className="panel-hdr">
                <span className="panel-title">{p.title}</span>
                <span className="panel-badge">{p.badge}</span>
              </div>
              <div className="panel-scroll">
                {[...data].sort((a,b) => (b.chg[period]||0)-(a.chg[period]||0)).map((item, i) => (
                  <IndexRow key={item.id} item={item} period={period} showRank rank={i+1} isWatched={watchlist.includes(item.id)} onToggleWatch={onToggleWatch} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
