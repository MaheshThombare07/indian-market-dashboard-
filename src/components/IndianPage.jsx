import { NIFTY, BSE } from '../data';
import IndexRow from './IndexRow';

export default function IndianPage({ period, watchlist, onToggleWatch }) {
  return (
    <div className="full-page">
      <div className="fp-grid">
        <Panel title="NIFTY broad & sectoral" badge="NSE · ranked">
          {[...NIFTY].sort((a,b) => (b.chg[period]||0)-(a.chg[period]||0)).map((item, i) => (
            <IndexRow key={item.id} item={item} period={period} showRank rank={i+1} isWatched={watchlist.includes(item.id)} onToggleWatch={onToggleWatch} />
          ))}
        </Panel>
        <Panel title="BSE / Sensex indices" badge="BSE · ranked">
          {[...BSE].sort((a,b) => (b.chg[period]||0)-(a.chg[period]||0)).map((item, i) => (
            <IndexRow key={item.id} item={item} period={period} showRank rank={i+1} isWatched={watchlist.includes(item.id)} onToggleWatch={onToggleWatch} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, badge, children }) {
  return (
    <div className="panel">
      <div className="panel-hdr">
        <span className="panel-title">{title}</span>
        <span className="panel-badge">{badge}</span>
      </div>
      <div className="panel-scroll">{children}</div>
    </div>
  );
}
