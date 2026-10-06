import { useLanguage } from "../i18n/LanguageProvider";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Sun, Wind, MapPin, Pentagon, ChartNoAxesCombined, Database, Compass, Check, Layers, Leaf } from 'lucide-react';
import { MapView } from '../components/MapView';
import { DataBadge } from '../components/DataBadge';
import { SAMPLE_SITE } from '../data/sampleSite';
import { DEFAULTS } from '../config/defaults';
import { analyzeSolar } from '../analysis/solar';
import { analyzeWind } from '../analysis/wind';
import { geometry } from '../utils/geo';
import { fmt } from '../utils/format';
type Preview = {
  solar: number;
  wind: number;
  irradiation: number;
  speed: number;
  area: number;
  energy: number | null;
};
export function Landing() {
  const {
    tr
  } = useLanguage();
  const [preview, setPreview] = useState<Preview | null>(null);
  useEffect(() => {
    let mounted = true;
    void import('../data/demo').then(d => {
      const c = d.demoClimate(),
        h = d.demoWind();
      if (!c.ok) return;
      const g = geometry(SAMPLE_SITE);
      const solar = analyzeSolar(c.data, g.centroid.lat, g.areaHa, DEFAULTS),
        wind = analyzeWind(c.data, h.ok ? h.data : null, SAMPLE_SITE, g.areaHa, DEFAULTS);
      if (mounted && solar && wind) setPreview({
        solar: solar.score,
        wind: wind.score,
        irradiation: solar.annualIrradiation,
        speed: wind.meanHub,
        area: g.areaHa,
        energy: solar.production?.annualGwh ?? null
      });
    });
    return () => {
      mounted = false;
    };
  }, []);
  return <main className="landing"><section className="hero"><div className="hero-copy"><div className="eyebrow"><Compass size={14} />{tr(" A CLEARER VIEW OF YOUR LAND")}</div><h1>{tr("Find where")}<br /><span>{tr("renewable energy")}</span><br />{tr("makes the most sense.")}</h1><p>{tr("From a piece of land to an informed first step.")}<br className="desktop-break" />{tr(" Compare solar and wind potential with transparent,")}<br className="desktop-break" />{tr(" publicly available data.")}</p><div className="hero-actions"><Link to="/analyze" className="button-link primary">{tr("Analyze a site ")}<ArrowRight size={16} /></Link><a href="#how-it-works" className="button-link secondary">{tr("How it works ")}<ArrowUpRight size={15} /></a></div><div className="hero-facts"><span><Check size={13} />{tr(" No API key required")}</span><span><Check size={13} />{tr(" Clear assumptions")}</span><span><Check size={13} />{tr(" Free public data")}</span></div></div><div className="hero-aside"><div className="intro-icon"><Leaf size={31} /></div><h2>{tr("Better decisions start")}<br />{tr("with better context.")}</h2><p>{tr("Draw a boundary. Understand the resource.")}<br />{tr("See what the data supports.")}</p><div className="source-stack"><span><Sun size={15} />{tr(" Solar irradiation")}</span><span><Wind size={15} />{tr(" Wind resource")}</span><span><MountainIcon />{tr(" Terrain & constraints")}</span></div></div></section>
 <section className="product-preview" aria-label={tr("Live rendered sample analysis preview")}><div className="preview-toolbar"><div><span className="preview-dot" /><b>{tr("Site analysis")}</b><span className="toolbar-divider" /> <MapPin size={13} /><span>{tr("Suceava, Romania")}</span></div><div><span className="demo-chip">{tr("DEMO DATA")}</span><span className="preview-date">{tr("cached sample, captured 2026-10-06")}</span><Link to="/analyze?demo=1">{tr("Open sample ")}<ArrowUpRight size={14} /></Link></div></div><div className="preview-body"><div className="preview-map"><MapView site={SAMPLE_SITE} preview /><div className="preview-map-label"><span><Pentagon size={13} />{tr(" Selected land")}</span><strong>{preview ? fmt(preview.area, 2) : '…'}{tr(" ha ")}<DataBadge type="ESTIMATED" /></strong><small>{tr("Illustrative field boundary")}</small></div><div className="preview-map-tag"><Layers size={13} />{tr(" Satellite imagery")}</div></div><div className="preview-dashboard"><div className="preview-dash-top"><span className="eyebrow">{tr("RESOURCE COMPARISON")}</span><span className="demo-chip">{tr("NASA POWER")}</span></div><h3>{tr("A first look at the possibilities.")}</h3><p className="regional-note">{tr("Regional estimate for the site centroid")}</p><div className="preview-resource"><div className="preview-resource-icon"><Sun size={21} /></div><div><b>{tr("Solar suitability")}</b><p>{preview ? fmt(preview.irradiation, 0) : '…'}{tr(" kWh/m²/yr ")}<DataBadge type="CALCULATED" /></p></div><strong>{preview ? fmt(preview.solar, 0) : '…'}<small>/100</small><DataBadge type="ESTIMATED" /></strong></div><div className="preview-bar"><i style={{
              width: `${preview?.solar ?? 0}%`
            }} /></div><div className="preview-resource wind-preview"><div className="preview-resource-icon"><Wind size={21} /></div><div><b>{tr("Wind suitability")}</b><p>{preview ? fmt(preview.speed, 1) : '…'}{tr(" m/s at 100 m ")}<DataBadge type="ESTIMATED" /></p></div><strong>{preview ? fmt(preview.wind, 0) : '…'}<small>/100</small><DataBadge type="ESTIMATED" /></strong></div><div className="preview-bar wind-bar"><i style={{
              width: `${preview?.wind ?? 0}%`
            }} /></div><div className="preview-estimate"><span><Database size={15} />{tr(" Evidence you can inspect")}</span><p>{tr("Every result traces back to a source or an assumption. Missing data stays missing.")}</p></div><Link className="preview-link" to="/analyze?demo=1">{tr("Explore the sample analysis ")}<ArrowRight size={15} /></Link></div></div><div className="preview-bottom"><span><InfoIcon />{tr(" A planning starting point, grounded in real source data.")}</span><span>{tr("MapLibre · NASA POWER · OpenStreetMap")}</span></div></section>
 <section className="data-strip" id="data-sources"><p>{tr("BUILT ON OPEN, ESTABLISHED DATA")}</p><div><span className="source-name"><span className="nasa-word">{tr("NASA")}</span>{tr(" POWER")}</span><span className="source-name"><Compass size={21} />{tr(" OpenStreetMap")}</span><span className="source-name"><Layers size={21} />{tr(" Open-Meteo")}</span><span className="source-name"><Pentagon size={21} />{tr(" Turf.js")}</span></div></section>
 <section className="how-section" id="how-it-works"><div className="section-intro"><span className="eyebrow">{tr("FROM MAP TO MEANING")}</span><h2>{tr("A small process. ")}<br />{tr("A clearer starting point.")}</h2><p>{tr("Understand what a location could support ")}<br />{tr("before committing to a detailed study.")}</p></div><div className="how-cards">{[{
          icon: <MapPin size={21} />,
          title: 'Find your location',
          text: 'Search for a place or enter coordinates. Explore the map in the view that works for you.'
        }, {
          icon: <Pentagon size={21} />,
          title: 'Define your land',
          text: 'Draw the boundary of your site. Check its area and edit the vertices to refine your selection.'
        }, {
          icon: <ChartNoAxesCombined size={21} />,
          title: 'Compare the potential',
          text: 'Review resource scores, production assumptions, environmental checks and data limitations.'
        }].map((item, i) => <article key={item.title}><span className="how-number">0{i + 1}</span><div className="how-icon">{item.icon}</div><h3>{tr(item.title)}</h3><p>{tr(item.text)}</p></article>)}</div></section>
 <section className="honesty-section"><div><span className="eyebrow">{tr("TRANSPARENCY BY DESIGN")}</span><h2>{tr("Know what’s measured.")}<br />{tr("See what’s assumed.")}</h2><p>{tr("Regional estimates can help you ask better questions.")}<br />{tr("They work best when their limits are visible.")}</p></div><div className="honesty-list"><p><DataBadge type="MEASURED" /><span>{tr("Source-provided API data, including modeled climate grids.")}</span></p><p><DataBadge type="CALCULATED" /><span>{tr("Deterministic calculations from publicly available inputs.")}</span></p><p><DataBadge type="ESTIMATED" /><span>{tr("Planning models with assumptions you can see and change.")}</span></p><Link to="/analyze" className="button-link primary">{tr("Start your site analysis ")}<ArrowRight size={15} /></Link></div></section></main>;
}
function MountainIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m3 20 8-15 10 15H3Z M8 11l3 3 3-3" /></svg>;
}
function InfoIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 11v6 M12 7v1" /></svg>;
}
