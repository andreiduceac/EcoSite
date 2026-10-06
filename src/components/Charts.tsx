import { useLanguage } from "../i18n/LanguageProvider";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { fmt } from '../utils/format';
import { MONTHS } from '../types';
import type { Climate } from '../types';
import type { RoseSector } from '../analysis/wind';
import { DataBadge } from './DataBadge';
import { Missing } from './Metrics';
const tooltipStyle = {
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 5,
  color: 'var(--ink)',
  fontSize: 11
};
const tick = {
  fill: 'var(--muted)',
  fontSize: 10
};
export function MonthlyChart({
  climate,
  type
}: {
  climate: Climate;
  type: 'solar' | 'temperature' | 'wind';
}) {
  const {
    tr, locale
  } = useLanguage();
  const key = type === 'solar' ? 'ALLSKY_SFC_SW_DWN' : type === 'temperature' ? 'T2M' : 'WS50M';
  const data = MONTHS.map(month => ({
    month: tr(month[0] + month.slice(1).toLowerCase()),
    value: climate.parameters[key]?.[month] ?? null
  }));
  if (data.every(d => d.value === null)) return <Missing reason={`NASA POWER returned no monthly ${type} values.`} />;
  return <div className="chart"><div className="chart-heading"><span>{tr(type === 'solar' ? 'Monthly solar resource' : type === 'temperature' ? 'Monthly temperature' : 'Monthly wind at 50 m')}</span><DataBadge type="MEASURED" /></div>{data.some(d => d.value === null) && <p className="source-note">{tr("Missing months: ")}{data.filter(d => d.value === null).map(d => d.month).join(', ')}{tr(". No values were substituted.")}</p>}<small>{tr(type === 'solar' ? 'kWh/m²/day' : type === 'temperature' ? '°C' : 'm/s')}{tr(" · Regional estimate for the site centroid")}</small><ResponsiveContainer width="100%" height={190}>{type === 'temperature' ? <LineChart data={data} margin={{
        top: 20,
        right: 8,
        left: -28,
        bottom: 0
      }}><CartesianGrid vertical={false} stroke="var(--line)" /><XAxis dataKey="month" tick={tick} axisLine={false} tickLine={false} /><YAxis tickFormatter={v=>new Intl.NumberFormat(locale).format(Number(v))} tick={tick} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} formatter={(value,name)=>[fmt(Number(value),2),name]} /><Line dataKey="value" name={tr("Temperature (°C)")} stroke="#bf8e5a" strokeWidth={2} dot={false} connectNulls={false} /></LineChart> : <BarChart data={data} margin={{
        top: 20,
        right: 8,
        left: -28,
        bottom: 0
      }}><CartesianGrid vertical={false} stroke="var(--line)" /><XAxis dataKey="month" tick={tick} axisLine={false} tickLine={false} /><YAxis tickFormatter={v=>new Intl.NumberFormat(locale).format(Number(v))} tick={tick} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} formatter={(value,name)=>[fmt(Number(value),2),name]} /><Bar dataKey="value" name={tr(type === 'solar' ? 'Irradiation (kWh/m²/day)' : 'Speed (m/s)')} fill={type === 'solar' ? '#719c68' : '#668da1'} radius={[3, 3, 0, 0]} /></BarChart>}</ResponsiveContainer></div>;
}
export function WindRoseChart({
  sectors
}: {
  sectors: RoseSector[];
}) {
  const {
    tr
  } = useLanguage();
  return <div className="chart"><div className="chart-heading"><span>{tr("Wind direction frequency")}</span><DataBadge type="CALCULATED" /></div><small>{tr("16 sectors · frequency % · tooltip: estimated hub-height speed")}</small><ResponsiveContainer width="100%" height={280}><RadarChart data={sectors} startAngle={90} endAngle={-270} outerRadius="70%"><PolarGrid stroke="var(--line)" /><PolarAngleAxis dataKey="direction" tickFormatter={v=>tr(String(v))} tick={tick} /><PolarRadiusAxis angle={90} tick={tick} tickCount={4} axisLine={false} /><Tooltip contentStyle={tooltipStyle} formatter={(value, name, item) => [tr(`${fmt(Number(value),1)}% · ${fmt(Number(item.payload?.meanSpeed),1)} m/s hub mean`), name]} /><Radar name={tr("Frequency")} dataKey="frequency" stroke="#668da1" fill="#668da1" fillOpacity={.3} /></RadarChart></ResponsiveContainer></div>;
}
export function ComparisonChart({
  solar,
  wind
}: {
  solar: number | null;
  wind: number | null;
}) {
  const {
    tr
  } = useLanguage();
  const data = [{
    name: tr('Solar'),
    score: solar
  }, {
    name: tr('Wind'),
    score: wind
  }];
  return <div className="chart"><div className="chart-heading"><span>{tr("Resource suitability comparison")}</span><DataBadge type="ESTIMATED" /></div><ResponsiveContainer width="100%" height={130}><BarChart data={data} layout="vertical" margin={{
        top: 15,
        right: 20,
        left: 0,
        bottom: 0
      }}><CartesianGrid horizontal={false} stroke="var(--line)" /><XAxis type="number" domain={[0, 100]} tick={tick} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="name" tick={tick} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} formatter={(value,name)=>[fmt(Number(value),2),name]} /><Bar dataKey="score" name={tr("Resource score")} fill="#719c68" barSize={18} radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></div>;
}
