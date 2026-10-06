import type { Climate,DailyWind,ElevationGrid,OsmData,Result,SitePolygon,ComponentScores } from '../types';
import type { SolarInputs,WindInputs } from '../config/defaults';
import { DEFAULTS } from '../config/defaults';
import { geometry } from '../utils/geo';
import { analyzeSolar } from './solar';
import { analyzeWind } from './wind';
import { analyzeTerrain } from './terrain';
import { analyzeEnvironment } from './environment';
import { analyzeInfrastructure } from './infrastructure';
import { calculateScore } from './scoring';
import { recommend } from './recommend';
export type RawAnalysis={climate:Result<Climate>;windHistory:Result<DailyWind>;elevation:Result<ElevationGrid>;osm:Result<OsmData>;mode:'live'|'demo';completedAt:string;siteKey:string};
export function evaluate(raw:RawAnalysis,site:SitePolygon,solarInputs:SolarInputs=DEFAULTS,windInputs:WindInputs=DEFAULTS){
 const g=geometry(site);const climate=raw.climate.ok?raw.climate.data:null;
 const solar=climate?analyzeSolar(climate,g.centroid.lat,g.areaHa,solarInputs):null;
 const wind=climate?analyzeWind(climate,raw.windHistory.ok?raw.windHistory.data:null,site,g.areaHa,windInputs):null;
 const terrain=raw.elevation.ok?analyzeTerrain(raw.elevation.data,site,g.centroid.lat):null;
 const environment=raw.osm.ok?analyzeEnvironment(raw.osm.data,site,climate):null;
 const infrastructure=raw.osm.ok?analyzeInfrastructure(raw.osm.data,site):null;
 const climateReason=raw.climate.ok?'Required monthly values are missing.':raw.climate.error.message;
 const components:ComponentScores={
  solar:{score:solar?.score??null,type:'ESTIMATED',reason:solar?undefined:climateReason},wind:{score:wind?.score??null,type:'ESTIMATED',reason:wind?undefined:climateReason},
  environment:{score:environment?.score??null,type:'ESTIMATED',reason:raw.osm.ok?environment?.reason:raw.osm.error.message},
  terrain:{score:terrain?.score??null,type:'ESTIMATED',reason:raw.elevation.ok?'Too few adjacent elevation samples to calculate slope.':raw.elevation.error.message},
  infrastructure:{score:infrastructure?.score??null,type:'ESTIMATED',reason:raw.osm.ok?'No required infrastructure mapped in the search area.':raw.osm.error.message}
 };
 const scores=calculateScore(components);return {geometry:g,climate,solar,wind,terrain,environment,infrastructure,scores,recommendation:recommend(scores.overall,solar?.score??null,wind?.score??null,environment?.hardFlag??false)};
}
export type Analysis=ReturnType<typeof evaluate>;
