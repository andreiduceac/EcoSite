import { useLanguage } from "../i18n/LanguageProvider";
import { useRef, useEffect, useState } from 'react';
import { Pentagon, Pencil, Trash2, X, Layers } from 'lucide-react';
import type { FeatureCollection, Position } from 'geojson';
import type { SitePolygon, Coordinate } from '../types';
import { DataBadge } from './DataBadge';
import { TERRAIN_OVERLAY } from '../config/defaults';
import { createMapProvider } from './MapProvider';
import type { MapProvider, MapStyle } from './MapProvider';
export function MapView({
  site,
  onSiteChange,
  center,
  preview = false,
  locked = false,
  turbines = [],
  slope = null,
  spacing
}: {
  site: SitePolygon | null;
  onSiteChange?: (site: SitePolygon | null) => void;
  center?: Coordinate;
  preview?: boolean;
  locked?: boolean;
  turbines?: Position[];
  slope?: FeatureCollection | null;
  spacing?: number;
}) {
  const {
    tr, language
  } = useLanguage();
  const container = useRef<HTMLDivElement>(null);
  const provider = useRef<MapProvider | null>(null);
  const onChange = useRef(onSiteChange);
  onChange.current = onSiteChange;
  const [style, setStyle] = useState<MapStyle>(preview || locked ? 'Satellite' : 'Map');
  const [error, setError] = useState('');
  const [drawing, setDrawing] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    setStyle(preview || locked ? 'Satellite' : 'Map');
    try {
      provider.current = createMapProvider(container.current, s => {
        setDrawing(false);
        onChange.current?.(s);
      }, setError, preview || locked);
      provider.current.setSite(site, !!site);
    } catch {
      setError('The map could not start. Your browser must support WebGL. You can still review the cached sample.');
    }
    return () => provider.current?.dispose();
  }, [preview, locked]);
  useEffect(() => {
    provider.current?.setSite(site, locked);
  }, [site, locked]);
  useEffect(() => {
    if (center) provider.current?.center(center);
  }, [center]);
  useEffect(() => {
    provider.current?.setTurbines(turbines);
  }, [turbines]);
  useEffect(() => {
    provider.current?.setSlope(slope);
  }, [slope]);
  useEffect(()=>{
    const apply=()=>{for(const [selector,label] of [['.maplibregl-ctrl-zoom-in','Zoom in'],['.maplibregl-ctrl-zoom-out','Zoom out'],['.map-turbine','Conceptual turbine position']])container.current?.querySelectorAll<HTMLElement>(selector).forEach(el=>{el.title=tr(label);el.setAttribute('aria-label',tr(label));});};
    apply(); const observer=new MutationObserver(apply); if(container.current)observer.observe(container.current,{childList:true,subtree:true});return()=>observer.disconnect();
  },[language,tr]);
  return <div className="map-wrap"><div className="map-canvas" ref={container} />{!preview && !locked && <div className="map-draw-controls"><button className="primary" onClick={() => {
        provider.current?.draw();
        setDrawing(true);
      }}><Pentagon size={15} />{tr(drawing ? 'Drawing…' : 'Select land')}</button>{site && <><button aria-label={tr("Edit polygon vertices")} onClick={() => provider.current?.edit()}><Pencil size={15} /></button><button aria-label={tr("Delete polygon")} onClick={() => provider.current?.delete()}><Trash2 size={15} /></button></>}</div>}<div className="map-toolbar">{(['Map', 'Satellite', 'Terrain'] as const).map(s => <button key={s} className={style === s ? 'active' : ''} onClick={() => {
        provider.current?.setStyle(s);
        setStyle(s);
        setError('');
      }}>{tr(s)}</button>)}</div>{!preview && <div className="map-info">{tr(drawing ? 'Click to add vertices. Click the first point to finish.' : locked ? 'Cached sample boundary · Suceava, Romania' : site ? 'Click the polygon to edit its vertices.' : 'Find a location, then draw your land boundary.')}{slope && <p><Layers size={11} className="inline" />{tr(" Sampled slope raster · ")}{Math.round(spacing ?? 0)}{tr(" m spacing ")}<DataBadge type="CALCULATED" /></p>}</div>}{slope && <div className="slope-legend"><b>{tr("Sampled slope ")}<DataBadge type="CALCULATED" /></b>{[`< ${TERRAIN_OVERLAY.lowSlope}°`, `${TERRAIN_OVERLAY.lowSlope}–${TERRAIN_OVERLAY.mediumSlope}°`, `≥ ${TERRAIN_OVERLAY.mediumSlope}°`].map((label, i) => <span key={label}><i style={{
          background: TERRAIN_OVERLAY.colors[i]
        }} />{tr(label)}</span>)}<small>{tr("DEM ~90 m · actual sample spacing shown below")}</small></div>}{error && <div role="alert" className="map-error">{tr(error)}<button onClick={() => setError('')} aria-label={tr("Dismiss map message")}><X size={13} /></button></div>}</div>;
}
