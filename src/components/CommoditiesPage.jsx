import { COMMODITIES } from '../data';
import IndexRow from './IndexRow';
import useCommoditiesData from '../hooks/useCommoditiesData';

export default function CommoditiesPage({ period, watchlist, onToggleWatch }) {
  const { data: commodData } = useCommoditiesData(COMMODITIES);

  const panels = [
    { title: 'Precious metals', badge: 'Yahoo Finance', ids: ['gold','silver'] },
    { title: 'Energy', badge: 'Yahoo Finance', ids: ['brent','wti','natgas'] },
    { title: 'Base metals', badge: 'MCX · static', ids: ['copper','nickel','zinc','alum'] },
  ];

  return (
    <div className="full-page">
      <div className="fp-grid">
        {panels.map(p => {
          const data = commodData.filter(c => p.ids.includes(c.id));
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
