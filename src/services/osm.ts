import { bbox,buffer,point,lineString,polygon,booleanPointInPolygon } from '@turf/turf';
import type { Feature,Polygon,Position } from 'geojson';
import type { Result,SitePolygon,OsmData,OsmFeature } from '../types';
import { API } from '../config/defaults';
import { jsonRequest,failure,isRecord } from './http';
type Tags=Record<string,string>;
function parseTags(raw:unknown):Tags{const tags:Tags={};if(isRecord(raw))for(const [key,v] of Object.entries(raw))if(typeof v==='string')tags[key]=v;return tags;}
function category(t:Tags):OsmFeature['category']|null{
 if(t.boundary==='protected_area'||t.leisure==='nature_reserve'||t.protect_class)return 'protected';
 if(t.natural==='water'||t.waterway==='riverbank'||t.landuse==='reservoir')return 'water';
 if(t.natural==='wood'||t.landuse==='forest')return 'forest';
 if(t.power==='line'||t.power==='minor_line')return 'powerLine';if(t.power==='substation')return 'substation';
 if(t.highway&&!['footway','path','steps','pedestrian','cycleway','bridleway'].includes(t.highway))return 'road';if(t.building)return 'building';return null;
}
function coordinates(raw:unknown):Position[]{if(!Array.isArray(raw))return [];const out:Position[]=[];for(const p of raw)if(isRecord(p)&&typeof p.lat==='number'&&typeof p.lon==='number')out.push([p.lon,p.lat]);return out;}
const same=(a:Position,b:Position)=>a[0]===b[0]&&a[1]===b[1];
function joinRings(segments:Position[][]):{rings:Position[][];incomplete:boolean}{const pending=segments.map(s=>[...s]);const rings:Position[][]=[];let incomplete=false;while(pending.length){let ring=pending.shift()!;let changed=true;while(!same(ring[0],ring.at(-1)!)&&changed){changed=false;for(let i=0;i<pending.length;i++){const next=pending[i];if(same(ring.at(-1)!,next[0])){ring=ring.concat(next.slice(1));pending.splice(i,1);changed=true;break;}if(same(ring.at(-1)!,next.at(-1)!)){ring=ring.concat([...next].reverse().slice(1));pending.splice(i,1);changed=true;break;}if(same(ring[0],next.at(-1)!)){ring=next.slice(0,-1).concat(ring);pending.splice(i,1);changed=true;break;}if(same(ring[0],next[0])){ring=[...next].reverse().slice(0,-1).concat(ring);pending.splice(i,1);changed=true;break;}}}if(ring.length>=4&&same(ring[0],ring.at(-1)!))rings.push(ring);else incomplete=true;}return {rings,incomplete};}
export function parseOsm(raw:unknown):Result<OsmData>{
 if(!isRecord(raw)||!Array.isArray(raw.elements))return failure('no_data','Overpass returned an unreadable response.');if(typeof raw.remark==='string')return failure('no_data',`Overpass did not complete the query: ${raw.remark}`);
 const features:OsmFeature[]=[];let incompleteAreas=0;
 for(const el of raw.elements){if(!isRecord(el))continue;const tags=parseTags(el.tags);const cat=category(tags);if(!cat)continue;const id=`${String(el.type)}-${String(el.id)}`;
 try{
 let feature:Feature|null=null;
 if(el.type==='node'&&typeof el.lon==='number'&&typeof el.lat==='number')feature=point([el.lon,el.lat]);
 if(el.type==='way'){const coords=coordinates(el.geometry);if(coords.length>=4&&same(coords[0],coords.at(-1)!)&&['protected','forest','water','building','substation'].includes(cat))feature=polygon([coords]);else if(coords.length>=2&&!['protected','forest','water','building'].includes(cat))feature=lineString(coords);}
 if(el.type==='relation'&&Array.isArray(el.members)){
 const outer:Position[][]=[],inner:Position[][]=[];
 for(const m of el.members){if(isRecord(m)){const c=coordinates(m.geometry);if(c.length>=2)(m.role==='inner'?inner:outer).push(c);}}
 const o=joinRings(outer),h=joinRings(inner);if(o.incomplete||h.incomplete)incompleteAreas++;
 const polys:Feature<Polygon>[]=[];for(const ring of o.rings){const outline=polygon([ring]);const holes=h.rings.filter(r=>booleanPointInPolygon(point(r[0]),outline));polys.push(polygon([ring,...holes]));}
 for(let i=0;i<polys.length;i++)features.push({id:`${id}-${i}`,category:cat,feature:polys[i],name:tags.name});
 if(!polys.length&&['protected','forest','water'].includes(cat))incompleteAreas++;continue;
 }
 if(feature)features.push({id,category:cat,feature,name:tags.name});else if(['protected','forest','water'].includes(cat))incompleteAreas++;
 }catch{if(['protected','forest','water'].includes(cat))incompleteAreas++;}
 }
 return {ok:true,data:{features,incompleteAreas,source:'OpenStreetMap via Overpass',fetchedAt:new Date().toISOString(),radiusKm:API.osmBufferKm}};
}
export async function getOsm(site:SitePolygon):Promise<Result<OsmData>>{
 const expanded=buffer(site,API.osmBufferKm,{units:'kilometers'});if(!expanded)return failure('invalid_input','Cannot calculate a search area for this boundary.');const b=bbox(expanded),s=bbox(site);const bounds=`${b[1]},${b[0]},${b[3]},${b[2]}`,siteBounds=`${s[1]},${s[0]},${s[3]},${s[2]}`;
 const query=`[out:json][timeout:25];(nwr["highway"](${bounds});nwr["power"~"^(line|minor_line|substation)$"](${bounds});nwr["boundary"="protected_area"](${bounds});nwr["leisure"="nature_reserve"](${bounds});nwr["natural"~"^(water|wood)$"](${bounds});nwr["landuse"~"^(forest|reservoir)$"](${bounds});nwr["waterway"="riverbank"](${bounds});nwr["building"](${siteBounds}););out geom;`;
 const r=await jsonRequest('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({data:query}).toString()});return r.ok?parseOsm(r.data):r;
}
