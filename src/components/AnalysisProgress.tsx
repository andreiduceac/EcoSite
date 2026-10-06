import { useLanguage } from "../i18n/LanguageProvider";
import { Check, LoaderCircle, Minus, Circle } from 'lucide-react';
import type { Stage } from '../hooks/useAnalysis';
export function AnalysisProgress({
  stages
}: {
  stages: Stage[];
}) {
  const {
    tr
  } = useLanguage();
  return <div className="analysis-progress" aria-live="polite">{stages.map(s => <div key={s.name} className={s.state}>{s.state === 'running' ? <LoaderCircle size={15} className="spin" /> : s.state === 'done' ? <Check size={15} /> : s.state === 'unavailable' ? <Minus size={15} /> : <Circle size={12} />}<span>{tr(s.name)}</span><small>{tr(s.state === 'unavailable' ? 'Excluded' : s.state === 'done' ? 'Complete' : s.state === 'running' ? 'Fetching…' : 'Waiting')}</small></div>)}</div>;
}
