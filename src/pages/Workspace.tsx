import { useLanguage } from "../i18n/LanguageProvider";
import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronRight, Info, MapPin, Pentagon, Database, Leaf, RotateCcw, LoaderCircle, ShieldCheck, ArrowUpRight } from 'lucide-react';
import type { SitePolygon, Coordinate } from '../types';
import { SAMPLE_SITE } from '../data/sampleSite';
import { MapView } from '../components/MapView';
import { SearchBox } from '../components/SearchBox';
import { StepIndicator } from '../components/StepIndicator';
import { AnalysisProgress } from '../components/AnalysisProgress';
import { Dashboard } from '../components/Dashboard';
import { DataBadge } from '../components/DataBadge';
import { Metric } from '../components/Metrics';
import { useAnalysis } from '../hooks/useAnalysis';
import { evaluate } from '../analysis/evaluate';
import { validatePolygon } from '../utils/geo';
import { DEFAULTS } from '../config/defaults';
import type { SolarInputs, WindInputs } from '../config/defaults';
import { fmt } from '../utils/format';
export function Workspace() {
  const {
    tr
  } = useLanguage();
  const [params, setParams] = useSearchParams();
  const mode = params.get('demo') === '1' ? 'demo' : 'live';
  const [site, setSite] = useState<SitePolygon | null>(() => mode === 'demo' ? SAMPLE_SITE : null);
  const [center, setCenter] = useState<Coordinate>();
  const [solarInputs, setSolarInputs] = useState<SolarInputs>(DEFAULTS);
  const [windInputs, setWindInputs] = useState<WindInputs>(DEFAULTS);
  const [slopeShown, setSlopeShown] = useState(false);
  const validation = site ? validatePolygon(site) : null;
  const {
    raw,
    running,
    stages,
    error,
    run
  } = useAnalysis(site, mode);
  useEffect(() => {
    setSite(mode === 'demo' ? SAMPLE_SITE : null);
    setSolarInputs(DEFAULTS);
    setWindInputs(DEFAULTS);
    setSlopeShown(false);
  }, [mode]);
  useEffect(() => {
    if (mode === 'demo' && site === SAMPLE_SITE) void run();
  }, [mode, site]);
  const analysis = useMemo(() => raw && raw.mode === mode && site && raw.siteKey === JSON.stringify(site.geometry.coordinates) && validation?.ok ? evaluate(raw, site, solarInputs, windInputs) : null, [raw, mode, site, solarInputs, windInputs]);
  const valid = validation?.ok === true;
  const step = analysis ? 4 : running ? 3 : site || center ? 2 : 1;
  return <main className="workspace"><div className="workspace-heading"><div><div className="breadcrumb"><Link to="/">{tr("EcoSite")}</Link><ChevronRight size={12} />{tr(" Site analysis")}</div><h1>{tr("Put your land on the map.")}</h1></div><StepIndicator step={step} /></div>{mode === 'demo' && <div className="demo-banner" role="status"><span className="demo-chip">{tr("DEMO DATA")}</span><span>{tr("NASA POWER cached sample, captured 2026-10-06 · Suceava, Romania. No live analysis sources are used.")}</span><button onClick={() => setParams({})}>{tr("Switch to live data ")}<ArrowUpRight size={13} /></button></div>}
 <div className="workspace-toolbar"><SearchBox onSelect={setCenter} disabled={mode === 'demo' || running} /><div className="toolbar-actions"><span className="source-status"><Database size={13} />{tr(mode === 'demo' ? 'Cached sample' : 'Live public data')}</span><button onClick={() => setParams(mode === 'demo' ? {} : {
          demo: '1'
        })}>{tr(mode === 'demo' ? 'Live data' : 'Try demo')}</button><button className="primary" onClick={() => void run()} disabled={!valid || running}>{running ? <LoaderCircle size={14} className="spin" /> : analysis ? <RotateCcw size={14} /> : <Leaf size={14} />} {tr(running ? 'Analyzing…' : analysis ? 'Reanalyze' : 'Analyze site')}{!running && <ArrowRight size={14} />}</button></div></div>
 <div className="workspace-body"><aside className="workspace-map"><MapView site={site} onSiteChange={setSite} center={center} locked={mode === 'demo'} turbines={analysis?.wind?.positions} slope={slopeShown ? analysis?.terrain?.cells : null} spacing={analysis?.terrain?.spacingM} />{valid && !analysis && <div className="selection-summary"><span><Pentagon size={14} />{tr(" Land selected")}</span><strong>{fmt(validation.data.areaHa, 2)}{tr(" ha ")}<DataBadge type="ESTIMATED" /></strong><span>{fmt(validation.data.perimeterKm, 2)}{tr(" km perimeter ")}<DataBadge type="ESTIMATED" /></span></div>}</aside><div className="workspace-results">{analysis && raw ? <Dashboard analysis={analysis} raw={raw} solarInputs={solarInputs} windInputs={windInputs} setSolarInputs={setSolarInputs} setWindInputs={setWindInputs} slopeShown={slopeShown} onSlope={() => setSlopeShown(v => !v)} /> : <div className="selection-panel"><span className="eyebrow">{tr("YOUR NEXT ENERGY PROJECT STARTS HERE")}</span><h2>{tr(running ? 'Reading the landscape.' : valid ? 'Your site is ready to analyze.' : 'A boundary is the beginning.')}</h2><p>{tr(running ? 'We’re checking public sources for this location. Each stage follows an actual data request.' : valid ? 'We’ll compare the solar and wind resources and check the mapped terrain and constraints.' : 'Choose a location and outline your land to reveal its renewable energy potential.')}</p>{stages.length > 0 && <AnalysisProgress stages={stages} />}<div className="boundary-illustration"><svg viewBox="0 0 360 190" aria-hidden="true"><path d="M0 35h360M0 75h360M0 115h360M0 155h360M40 0v190M100 0v190M160 0v190M220 0v190M280 0v190M340 0v190" stroke="var(--line)" strokeWidth=".7" /><path d="M80 139 110 51 252 39 281 113 207 157Z" fill="var(--wash)" stroke="var(--green)" strokeWidth="2" />{[[80, 139], [110, 51], [252, 39], [281, 113], [207, 157]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4" fill="var(--panel)" stroke="var(--green)" strokeWidth="1.5" />)}<circle cx="184" cy="97" r="16" fill="var(--panel)" /><path d="M180 102c10 0 13-12 13-12s-17 0-13 12Z M179 106l9-10" fill="none" stroke="var(--green)" strokeWidth="1.6" /></svg></div>{validation && !validation.ok && <div className="validation-error" role="alert"><Info size={17} />{tr(validation.error.message)}</div>}{error && <div className="validation-error" role="alert">{tr(error)}</div>}{valid ? <><section className="panel"><div className="metric-grid"><Metric label={tr("Land area")} value={fmt(validation.data.areaHa, 2)} unit="ha" /><Metric label={tr("Perimeter")} value={fmt(validation.data.perimeterKm, 2)} unit="km" /></div></section><button className="primary analyze-large" disabled={running} onClick={() => void run()}>{tr(running ? 'Fetching source data…' : 'Analyze this land')}<ArrowRight size={16} /></button></> : <div className="selection-instructions"><article><div><MapPin size={18} /></div><span><b>{tr("Find a location")}</b><p>{tr("Search a city, address or coordinates.")}</p></span></article><article><div><Pentagon size={18} /></div><span><b>{tr("Draw your boundary")}</b><p>{tr("Click “Select land”, then add at least three vertices.")}</p></span></article><article><div><Database size={18} /></div><span><b>{tr("Let the evidence guide you")}</b><p>{tr("Compare the resources, assumptions and constraints.")}</p></span></article></div>}<div className="selection-trust"><ShieldCheck size={18} /><p>{tr("Your boundary stays in this session. Source requests use its centroid and search area.")}</p></div><div className="demo-prompt"><span>{tr("Want to see what an analysis looks like?")}</span><button className="text-button" onClick={() => setParams({
              demo: '1'
            })}>{tr("Explore the Suceava sample ")}<ArrowUpRight size={14} /></button></div></div>}</div></div></main>;
}
