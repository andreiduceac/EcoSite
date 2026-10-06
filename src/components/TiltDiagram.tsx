import { useLanguage } from "../i18n/LanguageProvider";
import { DataBadge } from './DataBadge';
import { fmt } from '../utils/format';
export function TiltDiagram({
  tilt,
  azimuth
}: {
  tilt: number;
  azimuth: number;
}) {
  const {
    tr
  } = useLanguage();
  const radians = tilt * Math.PI / 180;
  const x = 60 + 150 * Math.cos(radians),
    y = 135 - 150 * Math.sin(radians);
  const ax = 60 + 42 * Math.cos(radians),
    ay = 135 - 42 * Math.sin(radians);
  return <div className="tilt-diagram"><div className="chart-heading"><span>{tr("Fixed-array orientation")}</span><DataBadge type="ESTIMATED" /></div><svg viewBox="0 0 310 175" role="img" aria-label={tr(`Panel tilt ${fmt(tilt)} degrees, azimuth ${azimuth} degrees`)}><line x1="25" y1="138" x2="285" y2="138" stroke="var(--line)" strokeWidth="2" /><path d={`M 102 135 A 42 42 0 0 0 ${ax} ${ay}`} fill="none" stroke="#bf8e5a" strokeWidth="1.5" /><line x1="60" y1="135" x2={x} y2={y} stroke="#246b4a" strokeWidth="9" strokeLinecap="round" /><line x1={x - 5} y1={y + 8} x2={x - 5} y2="137" stroke="var(--muted)" strokeWidth="2" /><text x="116" y="121" fill="var(--ink)" fontSize="15">{fmt(tilt)}°</text><text x="60" y="162" fill="var(--muted)" fontSize="11">{tr("Facing ")}{tr(azimuth === 180 ? 'south' : 'north')}{tr(" · azimuth ")}{azimuth}°</text><circle cx="260" cy="35" r="14" fill="#dfc581" /><path d="M242 53 L207 88 M258 57 L228 101" stroke="#dfc581" strokeWidth="1.5" /></svg><p>{tr("Annual-optimum approximation: 0.76 × |latitude| + 3.1°. No tilt gain is applied to production. ")}<a href="https://www.solarpaneltilt.com/" target="_blank" rel="noreferrer">{tr("Source: Charles R. Landau")}</a>{tr(" (validated latitude range: 25–50°).")}</p></div>;
}
