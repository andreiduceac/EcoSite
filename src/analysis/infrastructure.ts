import { distance,point,nearestPointOnLine,polygonToLine,centroid } from '@turf/turf';
import type { Feature,LineString,Polygon } from 'geojson';
import type { OsmData,SitePolygon } from '../types';
import { THRESHOLDS } from '../config/thresholds';
import { clamp } from '../utils/format';
export type InfrastructureResult={roadKm:number|null;powerKm:number|null;substationKm:number|null;score:number|null;excluded:string[]};
export function analyzeInfrastructure(osm:OsmData,site:SitePolygon):InfrastructureResult{
 const c=centroid(site);function nearest(category:string):number|null{const values:number[]=[];for(const f of osm.features){if(f.category!==category)continue;const g=f.feature.geometry;
 if(g.type==='Point')values.push(distance(c,point(g.coordinates),{units:'kilometers'}));
 else if(g.type==='LineString')values.push(nearestPointOnLine(f.feature as Feature<LineString>,c,{units:'kilometers'}).properties.dist??Infinity);
 else if(g.type==='Polygon'){const line=polygonToLine(f.feature as Feature<Polygon>);if(line.type==='Feature'&&line.geometry.type==='LineString')values.push(nearestPointOnLine(line as Feature<LineString>,c,{units:'kilometers'}).properties.dist??Infinity);}
 }return values.length?Math.min(...values):null;}
 const roadKm=nearest('road'),powerKm=nearest('powerLine'),substationKm=nearest('substation');const parts=[{name:'road',value:roadKm,max:THRESHOLDS.roadMaxKm},{name:'power line',value:powerKm,max:THRESHOLDS.powerMaxKm},{name:'substation',value:substationKm,max:THRESHOLDS.substationMaxKm}];const available=parts.filter(p=>p.value!==null);const score=available.length?available.reduce((s,p)=>s+clamp((1-p.value!/p.max)*100),0)/available.length:null;
 return {roadKm,powerKm,substationKm,score,excluded:parts.filter(p=>p.value===null).map(p=>`${p.name}: none mapped within the ${osm.radiusKm} km buffer`)};
}
