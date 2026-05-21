import { FOREX, BONDS, RBI } from '../data';
import SectionDivider from './SectionDivider';
import RateRow from './RateRow';

export default function ForexPage({ period }) {
  const mult = {today:1, yesterday:-0.7, '5days':2.2, '1month':5.0}[period] || 1;

  return (
    <div className="full-page">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10}}>
        <div className="panel">
          <div className="panel-hdr"><span className="panel-title">INR forex pairs</span></div>
          <div>
            {FOREX.map((f, i) => {
              const adj = (f.chg * mult).toFixed(2);
              const up = +adj >= 0;
              return (
                <RateRow key={i}>
                  <span className="rate-label">{f.pair}</span>
                  <span className="rate-val">₹{f.val.toFixed(4)}</span>
                  <span className={`idx-chg ${up ? 'chg-up' : 'chg-dn'}`}>{up ? '▲ +' : '▼ '}{Math.abs(adj)}%</span>
                </RateRow>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <div className="panel-hdr"><span className="panel-title">Bonds & yields</span></div>
          <div>
            {BONDS.map((b, i) => (
              <RateRow key={i}>
                <span className="rate-label">{b.name}</span>
                <span className="rate-val">{b.val}</span>
                <span className="rate-note">{b.note}</span>
              </RateRow>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-hdr"><span className="panel-title">RBI & policy rates</span></div>
          <div>
            {RBI.map((r, i) => (
              <RateRow key={i}>
                <span className="rate-label">{r.name}</span>
                <span className="rate-val">{r.val}</span>
                <span className="rate-note">{r.note}</span>
              </RateRow>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
