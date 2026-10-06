import { translate } from '../i18n/core';
import maplibregl from 'maplibre-gl';
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import { bbox, featureCollection, centroid } from '@turf/turf';
import { TERRAIN_OVERLAY } from '../config/defaults';
import type { SitePolygon, Coordinate } from '../types';
import type { FeatureCollection, Position } from 'geojson';
export type MapStyle = 'Map'|'Satellite'|'Terrain';
export interface MapProvider {
 setSite(site:SitePolygon|null,fit?:boolean):void; center(coordinate:Coordinate):void;
 draw():void; edit():void; delete():void; setStyle(style:MapStyle):void;
 setTurbines(positions:Position[]):void; setSlope(cells:FeatureCollection|null):void; dispose():void;
}
export function createMapProvider(container:HTMLElement,onChange:(site:SitePolygon|null)=>void,onError:(message:string)=>void,preview=false):MapProvider{
 const key=import.meta.env.VITE_MAPTILER_KEY as string|undefined;
 const map=new maplibregl.Map({container,center:preview?[26.25,47.65]:[25,46],zoom:preview?13.5:6.3,maxZoom:19,style:{version:8,sources:{
  street:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'},
  satellite:{type:'raster',tiles:[key?`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${key}`:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],tileSize:256,attribution:key?'© MapTiler':'Source: Esri, Vantor, Earthstar Geographics, GIS User Community'},
  terrain:{type:'raster',tiles:['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],tileSize:256,maxzoom:17,attribution:'© OpenStreetMap contributors, SRTM | © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'},
  site:{type:'geojson',data:featureCollection([])}
 },layers:[{id:'street',type:'raster',source:'street',layout:{visibility:preview?'none':'visible'}},{id:'satellite',type:'raster',source:'satellite',layout:{visibility:preview?'visible':'none'}},{id:'terrain',type:'raster',source:'terrain',layout:{visibility:'none'}},{id:'site-fill',type:'fill',source:'site',paint:{'fill-color':'#57a575','fill-opacity':0.18}},{id:'site-line',type:'line',source:'site',paint:{'line-color':'#81c394','line-width':2.5}}]},attributionControl:{compact:true}});
 map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');map.addControl(new maplibregl.ScaleControl({unit:'metric'}),'bottom-right');
 let draw:TerraDraw|null=null;let site:SitePolygon|null=null;let ready=false;let suppress=false;let centroidMarker:maplibregl.Marker|null=null;let turbineMarkers:maplibregl.Marker[]=[];
 let turbinePositions:Position[]=[];let slopeData:FeatureCollection|null=null;
 const showSite=()=>{if(!ready)return;(map.getSource('site') as maplibregl.GeoJSONSource).setData(site?featureCollection([site]):featureCollection([]));centroidMarker?.remove();centroidMarker=null;if(site){const el=document.createElement('div');el.className='map-centroid';centroidMarker=new maplibregl.Marker({element:el}).setLngLat(centroid(site).geometry.coordinates as [number,number]).addTo(map);}};
 const syncDraw=()=>{if(!draw||preview)return;suppress=true;draw.clear();if(site)draw.addFeatures([{type:'Feature',id:'selected-site',geometry:site.geometry,properties:{mode:'polygon'}}]);suppress=false;};
 const emit=()=>{if(suppress||!draw)return;const p=draw.getSnapshot().find(f=>f.geometry.type==='Polygon'&&f.properties.mode==='polygon'&&!f.properties.currentlyDrawing);site=p&&p.geometry.type==='Polygon'?{type:'Feature',geometry:p.geometry,properties:{}}:null;showSite();onChange(site);};
 const setTurbines=(positions:Position[])=>{turbinePositions=positions;turbineMarkers.forEach(m=>m.remove());turbineMarkers=[];if(!ready)return;for(const position of positions){const el=document.createElement('div');el.className='map-turbine';el.textContent='✣';el.title=translate('Conceptual turbine position');turbineMarkers.push(new maplibregl.Marker({element:el}).setLngLat(position as [number,number]).addTo(map));}};
 map.on('load',()=>{ready=true;if(!preview){draw=new TerraDraw({adapter:new TerraDrawMapLibreGLAdapter({map}),modes:[new TerraDrawPolygonMode({styles:{fillColor:'#57a575',fillOpacity:0.15,outlineColor:'#81c394',outlineWidth:2}}),new TerraDrawSelectMode({flags:{polygon:{feature:{draggable:true,coordinates:{midpoints:true,draggable:true,deletable:true}}}}})]});draw.start();draw.setMode('select');draw.on('finish',()=>{emit();draw?.setMode('select');});draw.on('change',()=>{if(draw?.getMode()==='select')emit();});syncDraw();}showSite();setTurbines(turbinePositions);if(slopeData)renderSlope(slopeData);if(site){const b=bbox(site);map.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:75,maxZoom:15,duration:0});}});
 map.on('error',e=>{if(e.error?.message.includes('401')||e.error?.message.includes('403'))onError('Map tiles are unavailable. MapTiler setup: add VITE_MAPTILER_KEY to .env, restrict it to this domain, then restart the app. You can also switch to Map.');else onError('Some map tiles could not load. Check your connection or switch the basemap.');});
 const renderSlope=(cells:FeatureCollection|null)=>{
  if(!ready)return;if(map.getLayer('slope'))map.removeLayer('slope');if(map.getSource('slope'))map.removeSource('slope');if(!cells?.features.length)return;
  const b=bbox(cells);const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const ctx=canvas.getContext('2d');if(!ctx)return;
  const project=(p:Position)=>[(p[0]-b[0])/(b[2]-b[0])*1024,(b[3]-p[1])/(b[3]-b[1])*1024];
  for(const cell of cells.features){const g=cell.geometry;if(g.type!=='Polygon'&&g.type!=='MultiPolygon')continue;ctx.fillStyle=Number(cell.properties?.slope)<TERRAIN_OVERLAY.lowSlope?TERRAIN_OVERLAY.colors[0]:Number(cell.properties?.slope)<TERRAIN_OVERLAY.mediumSlope?TERRAIN_OVERLAY.colors[1]:TERRAIN_OVERLAY.colors[2];const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;for(const rings of polys){ctx.beginPath();for(const ring of rings){for(let i=0;i<ring.length;i++){const [x,y]=project(ring[i]);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();}ctx.fill('evenodd');}}
  map.addSource('slope',{type:'image',url:canvas.toDataURL(),coordinates:[[b[0],b[3]],[b[2],b[3]],[b[2],b[1]],[b[0],b[1]]]});map.addLayer({id:'slope',type:'raster',source:'slope',paint:{'raster-opacity':.55,'raster-resampling':'nearest','raster-fade-duration':0}},'site-fill');
 };
 const observer=new ResizeObserver(()=>map.resize());observer.observe(container);
 return {setSite(next,fit=false){if(next===site)return;site=next;syncDraw();showSite();if(fit&&ready&&site){const b=bbox(site);map.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:65,maxZoom:15,duration:500});}},center(c){map.flyTo({center:[c.lon,c.lat],zoom:13,duration:700});},draw(){if(!draw)return;suppress=true;draw.clear();suppress=false;site=null;showSite();onChange(null);draw.setMode('polygon');},edit(){draw?.setMode('select');},delete(){suppress=true;draw?.clear();suppress=false;site=null;showSite();onChange(null);},setStyle(style){for(const [label,id] of [['Map','street'],['Satellite','satellite'],['Terrain','terrain']])map.setLayoutProperty(id,'visibility',label===style?'visible':'none');},setTurbines,setSlope(cells){slopeData=cells;if(ready)renderSlope(cells);},dispose(){observer.disconnect();draw?.stop();map.remove();}};
}
