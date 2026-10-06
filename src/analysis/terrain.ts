import { polygon,intersect,featureCollection,area,distance,point } from '@turf/turf';
import type { Feature,Polygon,MultiPolygon,FeatureCollection } from 'geojson';
import type { ElevationGrid,SitePolygon } from '../types';
import { TERRAIN_MODEL } from '../config/defaults';
import { clamp } from '../utils/format';
export type TerrainResult={meanSlope:number;maxSlope:number;under10Percent:number;meanElevation:number;aspectFavor:number;coveragePercent:number;score:number;cells:FeatureCollection;spacingM:number;samples:number};
export function analyzeTerrain(grid:ElevationGrid,site:SitePolygon,latitude:number):TerrainResult|null{
 const byKey=new Map(grid.samples.map(s=>[`${s.row}:${s.col}`,s]));const cells:Feature<Polygon|MultiPolygon>[]=[];let totalArea=0,slopeArea=0,underArea=0,aspectArea=0,maxSlope=0;
 for(const s of grid.samples){const west=byKey.get(`${s.row}:${s.col-1}`),east=byKey.get(`${s.row}:${s.col+1}`),south=byKey.get(`${s.row-1}:${s.col}`),north=byKey.get(`${s.row+1}:${s.col}`);const x1=west??s,x2=east??s,y1=south??s,y2=north??s;if(x1===x2||y1===y2)continue;
 const dx=distance(point(x1.position),point(x2.position),{units:'meters'}),dy=distance(point(y1.position),point(y2.position),{units:'meters'});if(!dx||!dy)continue;
 const gx=(x2.elevation-x1.elevation)/dx,gy=(y2.elevation-y1.elevation)/dy;const slope=Math.atan(Math.hypot(gx,gy))*180/Math.PI;const aspect=(Math.atan2(-gx,-gy)*180/Math.PI+360)%360;const favored=latitude>=0?180:0;const favor=slope<1?1:(1+Math.cos((aspect-favored)*Math.PI/180))/2;
 const dLat=grid.spacingM/111320/2,dLon=dLat/Math.cos(s.position[1]*Math.PI/180);const [lon,lat]=s.position;const cell=polygon([[[lon-dLon,lat-dLat],[lon+dLon,lat-dLat],[lon+dLon,lat+dLat],[lon-dLon,lat+dLat],[lon-dLon,lat-dLat]]]);
 const clipped=intersect(featureCollection([cell,site]));if(!clipped)continue;const a=area(clipped);clipped.properties={slope,aspect,elevation:s.elevation};cells.push(clipped);totalArea+=a;slopeArea+=slope*a;underArea+=slope<TERRAIN_MODEL.favorableSlope?a:0;aspectArea+=favor*a;maxSlope=Math.max(maxSlope,slope);
 }
 if(!totalArea)return null;
 const meanSlope=slopeArea/totalArea,aspectFavor=aspectArea/totalArea;return {meanSlope,maxSlope,under10Percent:underArea/totalArea*100,meanElevation:grid.samples.reduce((sum,s)=>sum+s.elevation,0)/grid.samples.length,aspectFavor,coveragePercent:Math.min(100,totalArea/area(site)*100),score:clamp((1-meanSlope/TERRAIN_MODEL.maximumSlope)*TERRAIN_MODEL.slopeWeight+aspectFavor*TERRAIN_MODEL.aspectWeight),cells:featureCollection(cells),spacingM:grid.spacingM,samples:grid.samples.length};
}
