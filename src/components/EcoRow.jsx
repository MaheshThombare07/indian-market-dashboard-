export default function EcoRow({ item }) {
  const dotClass = {high:'high', med:'med', low:'low'}[item.impact];
  const valClass = {high:'chg-dn', med:'idx-chg', low:'chg-up'}[item.impact] || '';
  return (
    <div className="eco-row">
      <span className="eco-time">{item.time}</span>
      <div className={`eco-dot ${dotClass}`}></div>
      <span className="eco-name">{item.name}</span>
      <span className={`eco-val ${valClass}`}>{item.actual}</span>
    </div>
  );
}
