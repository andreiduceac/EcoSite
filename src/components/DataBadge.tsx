import { useLanguage } from "../i18n/LanguageProvider";
import type { DataType } from '../types';
export function DataBadge({
  type
}: {
  type: DataType;
}) {
  const {
    tr
  } = useLanguage();
  return <span data-type={type} className={`data-badge badge-${type.toLowerCase()}`} title={tr(type === 'MEASURED' ? 'Source-provided API data, including gridded modeled products' : type === 'CALCULATED' ? 'Deterministic calculation from source data' : 'Calculation that includes visible model assumptions')}>{tr(type)}</span>;
}
