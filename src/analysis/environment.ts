import { area,intersect,featureCollection,union,booleanIntersects } from '@turf/turf';
import type { Feature,Polygon,MultiPolygon } from 'geojson';
import type { Climate,SitePolygon,OsmData } from '../types';
import { completeMonths,annualTotal } from './solar';
import { ENVIRONMENT_MODEL } from '../config/defaults';
import { clamp } from '../utils/format';
export type EnvironmentResult={score:number|null;hardFlag:boolean;protectedOverlap:number;waterOverlap:number;forestOverlap:number;buildingOverlap:number;precipitation:number|null;flags:string[];reason?:string};
function overlap(osm:OsmData,site:SitePolygon,category:string):number {
 const intersections:Feature<Polygon|MultiPolygon>[]=[];
 for(const item of osm.features){if(item.category!==category)continue;if(item.feature.geometry.type!=='Polygon'&&item.feature.geometry.type!=='MultiPolygon')continue;const f=item.feature as Feature<Polygon|MultiPolygon>;const clipped=intersect(featureCollection([site,f]));if(clipped)intersections.push(clipped);}
 if(!intersections.length)return 0;const combined=intersections.length===1?intersections[0]:union(featureCollection(intersections));return combined?clamp(area(combined)/area(site)*100):0;
}
export function analyzeEnvironment(osm:OsmData,site:SitePolygon,climate:Climate|null):EnvironmentResult{
 const protectedOverlap=overlap(osm,site,'protected'),waterOverlap=overlap(osm,site,'water'),forestOverlap=overlap(osm,site,'forest'),buildingOverlap=overlap(osm,site,'building');
 const hardFlag=osm.features.some(f=>f.category==='protected'&&booleanIntersects(site,f.feature));
 const monthly=climate?completeMonths(climate.parameters.PRECTOTCORR):null;const precipitation=monthly?annualTotal(monthly):null;const flags:string[]=[];
 if(hardFlag)flags.push('Protected-area intersection. Environmental review required.');if(waterOverlap>0)flags.push(`Mapped water overlaps ${waterOverlap.toFixed(1)}% of the boundary.`);if(forestOverlap>0)flags.push(`Mapped forest overlaps ${forestOverlap.toFixed(1)}% of the boundary.`);if(buildingOverlap>0)flags.push(`Mapped buildings overlap ${buildingOverlap.toFixed(1)}% of the boundary.`);
 const score=osm.incompleteAreas?null:clamp(100-(hardFlag?ENVIRONMENT_MODEL.protectedPenalty:0)-waterOverlap/100*ENVIRONMENT_MODEL.waterPenalty-forestOverlap/100*ENVIRONMENT_MODEL.forestPenalty-(precipitation!==null&&precipitation>ENVIRONMENT_MODEL.wetThreshold?ENVIRONMENT_MODEL.wetPenalty:0));
 return {score,hardFlag,protectedOverlap,waterOverlap,forestOverlap,buildingOverlap,precipitation,flags,reason:osm.incompleteAreas?'Some OSM area boundaries were incomplete. Environmental score excluded.':undefined};
}
