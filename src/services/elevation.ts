import { bbox,point,booleanPointInPolygon,distance } from '@turf/turf';
import type { ElevationGrid,ElevationSample,SitePolygon,Result } from '../types';
import { API,TERRAIN_MODEL } from '../config/defaults';
import { jsonRequest,failure,isRecord } from './http';
export async function getElevation(site:SitePolygon):Promise<Result<ElevationGrid>> {
 const b=bbox(site);const origin=point([b[0],b[1]]);const width=distance(origin,point([b[2],b[1]]),{units:'meters'}),height=distance(origin,point([b[0],b[3]]),{units:'meters'});
 const spacingM=Math.max(TERRAIN_MODEL.minimumGridSpacingM,Math.max(width,height)/TERRAIN_MODEL.gridDivisions);const dx=width>0?(b[2]-b[0])*spacingM/width:0,dy=height>0?(b[3]-b[1])*spacingM/height:0;
 const candidates:Omit<ElevationSample,'elevation'>[]=[];
 for(let row=0;row<=Math.floor(height/spacingM);row++)for(let col=0;col<=Math.floor(width/spacingM);col++){const position=[b[0]+col*dx,b[1]+row*dy];if(booleanPointInPolygon(point(position),site))candidates.push({position,row,col});}
 if(candidates.length<4)return failure('no_data','The selected boundary is too narrow for a 90 m elevation grid. Terrain not assessed.');
 const samples:ElevationSample[]=[];
 for(let i=0;i<candidates.length;i+=API.elevationBatch){const batch=candidates.slice(i,i+API.elevationBatch);const p=new URLSearchParams({latitude:batch.map(v=>v.position[1].toFixed(6)).join(','),longitude:batch.map(v=>v.position[0].toFixed(6)).join(',')});const r=await jsonRequest(`https://api.open-meteo.com/v1/elevation?${p}`);if(!r.ok)return r;
 if(!isRecord(r.data)||!Array.isArray(r.data.elevation)||r.data.elevation.length!==batch.length)return failure('no_data','Elevation returned an incomplete sample grid.');
 const elevations=r.data.elevation;for(let j=0;j<batch.length;j++){const elevation:unknown=elevations[j];if(typeof elevation!=='number'||!Number.isFinite(elevation)||elevation<-500)return failure('no_data','Elevation contains missing sample values.');samples.push({...batch[j],elevation});}}
 return {ok:true,data:{samples,spacingM,source:'Open-Meteo · Copernicus DEM GLO-90 (~90 m)'}};
}
