import { useLanguage } from "../i18n/LanguageProvider";
import type { ReactNode } from 'react';
import type { DataType } from '../types';
import { DataBadge } from './DataBadge';
export function Metric({
  label,
  value,
  unit,
  type = 'ESTIMATED',
  note
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  type?: DataType;
  note?: string;
}) {
  const {
    tr
  } = useLanguage();
  return <div className="metric"><div className="metric-label">{tr(label)}<DataBadge type={type} /></div><div className="metric-value">{typeof value==='string'?tr(value):value}<span>{unit && tr(unit)}</span></div>{note && <p>{tr(note)}</p>}</div>;
}
export function Missing({
  reason
}: {
  reason: string;
}) {
  const {
    tr
  } = useLanguage();
  return <div className="missing"><strong>{tr("Not assessed")}</strong><p>{tr(reason)}</p></div>;
}
export function InputControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  const {
    tr
  } = useLanguage();
  return <label className="input-control"><span>{tr(label)}<DataBadge type="ESTIMATED" /></span><div><input type="range" aria-label={tr(label)} min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /><span><input aria-label={tr(`${label} value`)} type="number" min={min} max={max} step={step} value={value} onChange={e => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }} />{tr(unit)}</span></div></label>;
}
