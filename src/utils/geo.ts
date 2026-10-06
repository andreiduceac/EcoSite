import { area, centroid, length, polygonToLine, kinks, booleanValid } from '@turf/turf';
import type { SitePolygon, SiteGeometry, Coordinate, Result } from '../types';
import { THRESHOLDS } from '../config/thresholds';
export function validCoordinate({lat,lon}:Coordinate):boolean { return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat)<=90 && Math.abs(lon)<=180; }
export function geometry(site:SitePolygon):SiteGeometry {
 const ring=site.geometry.coordinates[0]; const c=centroid(site).geometry.coordinates;
 return {areaHa:area(site)/10000,areaM2:area(site),perimeterKm:length(polygonToLine(site),{units:'kilometers'}),centroid:{lon:c[0],lat:c[1]},vertices:ring.length-1,antimeridian:ring.some((p,i)=>i>0&&Math.abs(p[0]-ring[i-1][0])>180)};
}
export function validatePolygon(site:SitePolygon):Result<SiteGeometry> {
 try {
 const rings=site.geometry.coordinates;
 if (!rings.length || rings[0].length<4) return invalid('Select at least 3 vertices to close a polygon.');
 if(rings.some(r=>r.some(p=>p.length<2||!validCoordinate({lon:p[0],lat:p[1]})))) return invalid('The polygon contains invalid coordinates.');
 if(rings.some(r=>r[0][0]!==r.at(-1)?.[0]||r[0][1]!==r.at(-1)?.[1]))return invalid('Close the polygon by clicking its first vertex.');
 if(!booleanValid(site)||kinks(site).features.length>0)return invalid('The polygon intersects itself. Move the crossing vertices.');
 const g=geometry(site);
 if(g.antimeridian)return invalid('This polygon crosses the antimeridian. Split it into polygons on either side before analyzing.');
 if(g.areaHa<THRESHOLDS.minAreaHa)return invalid(`Land is too small (${g.areaHa.toFixed(2)} ha). Select at least 0.5 ha.`);
 if(g.areaHa>THRESHOLDS.maxAreaHa)return invalid(`Land is too large (${g.areaHa.toFixed(0)} ha). Select no more than 5,000 ha.`);
 return {ok:true,data:g};
 } catch {return invalid('The polygon could not be read. Delete it and draw a new boundary.');}
}
function invalid(message:string):Result<SiteGeometry>{return {ok:false,error:{kind:'invalid_input',message}};}
