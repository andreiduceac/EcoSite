import { useLanguage } from "../i18n/LanguageProvider";
import { Check } from 'lucide-react';
export function StepIndicator({
  step
}: {
  step: number;
}) {
  const {
    tr
  } = useLanguage();
  return <ol className="step-indicator" aria-label={tr("Analysis steps")}>{['Choose location', 'Select land', 'Analyze', 'Review'].map((label, i) => <li key={label} className={i + 1 === step ? 'current' : i + 1 < step ? 'completed' : ''}><span>{i + 1 < step ? <Check size={11} /> : i + 1}</span><b>{tr(label)}</b>{i < 3 && <em />}</li>)}</ol>;
}
