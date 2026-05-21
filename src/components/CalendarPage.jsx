import { ECO } from '../data';

export default function CalendarPage() {
  return (
    <div className="full-page">
      <div className="panel" style={{maxWidth:740}}>
        <div className="panel-hdr">
          <span className="panel-title">Economic calendar</span>
          <span style={{fontSize:9,color:'var(--text3)'}}>🔴 High &nbsp; 🟡 Medium &nbsp; 🟢 Low impact</span>
        </div>
        <div>
          {ECO.map((e, i) => {
            const dotClass = {high:'high', med:'med', low:'low'}[e.impact];
            const valClass = {high:'chg-dn', med:'chg-neu', low:'chg-up'}[e.impact] || '';
            return (
              <div className="eco-row" key={i}>
                <span className="eco-time">{e.time}</span>
                <div className={`eco-dot ${dotClass}`}></div>
                <div style={{flex:1}}>
                  <div className="eco-name">{e.name}</div>
                  <div style={{fontSize:10,color:'var(--text3)',marginTop:1}}>{e.note}</div>
                </div>
                <span className={`eco-val ${valClass}`}>{e.actual}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
