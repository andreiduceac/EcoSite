import type { Climate, ClimateParameter, MonthlyValues, Coordinate, DailyWind, Result, WindObservation } from '../types';
import { MONTHS } from '../types';
import { validCoordinate } from '../utils/geo';
import { API } from '../config/defaults';
import { jsonRequest, failure, isRecord } from './http';
const PARAMETERS:ClimateParameter[]=['ALLSKY_SFC_SW_DWN','CLRSKY_SFC_SW_DWN','T2M','PRECTOTCORR','WS10M','WS50M','WD50M'];
function values(raw:unknown):Record<string,unknown>|null {if(!isRecord(raw)||!isRecord(raw.properties)||!isRecord(raw.properties.parameter))return null;return raw.properties.parameter;}
export function parseClimate(raw:unknown,captured?:string):Result<Climate>{
 const params=values(raw);if(!params)return failure('no_data','NASA POWER returned no readable monthly climate data.');
 const output:Climate['parameters']={};
 for(const key of PARAMETERS){const data=params[key];if(!isRecord(data))continue;const months:MonthlyValues={};for(const month of [...MONTHS,'ANN'] as const){const n=data[month];if(typeof n==='number'&&Number.isFinite(n)&&n!==-999&&n>-900&&(key!=='WD50M'||n>=0&&n<=360)&&(key==='T2M'||n>=0))months[month]=n;}if(Object.keys(months).length)output[key]=months;}
 if(!Object.keys(output).length)return failure('no_data','NASA POWER returned only missing or invalid values.');
 const header=isRecord(raw)&&isRecord(raw.header)?raw.header:null;
 return {ok:true,data:{parameters:output,source:'NASA POWER',period:header&&typeof header.range==='string'?header.range:'Climatology period not supplied',captured}};
}
export function parseWind(raw:unknown):Result<DailyWind>{
 const params=values(raw);if(!params||!isRecord(params.WS50M)||!isRecord(params.WD50M))return failure('no_data','NASA returned no wind time series.');
 const directions=params.WD50M;const observations:WindObservation[]=[];
 for(const [date,speed] of Object.entries(params.WS50M)){const direction=directions[date];if(typeof speed==='number'&&speed>=0&&speed<100&&typeof direction==='number'&&direction>=0&&direction<=360)observations.push({date,speed,direction:direction%360});}
 if(observations.length<100)return failure('no_data','Wind time series has fewer than 100 valid speed/direction pairs. Invalid source directions were excluded.');
 const header=isRecord(raw)&&isRecord(raw.header)?raw.header:null;
 return {ok:true,data:{observations,period:header?`${String(header.start??'')}–${String(header.end??'')}`:'Time period unavailable'}};
}
function pointUrl(c:Coordinate,temporal:'climatology'|'daily'|'hourly',extra:Record<string,string>={}):string{
 const params=new URLSearchParams({parameters:temporal==='climatology'?PARAMETERS.join(','):'WS50M,WD50M',community:'RE',longitude:c.lon.toFixed(API.coordinateDecimals),latitude:c.lat.toFixed(API.coordinateDecimals),format:'JSON',...extra});return `https://power.larc.nasa.gov/api/temporal/${temporal}/point?${params}`;
}
export async function getClimate(c:Coordinate):Promise<Result<Climate>>{if(!validCoordinate(c))return failure('invalid_input','Invalid centroid coordinates.');const r=await jsonRequest(pointUrl(c,'climatology'));return r.ok?parseClimate(r.data):r;}
export async function getDailyWind(c:Coordinate,years=API.dailyYears):Promise<Result<DailyWind>>{
 if(!validCoordinate(c))return failure('invalid_input','Invalid centroid coordinates.');
 const r=await jsonRequest(pointUrl(c,'daily',{start:`${years[0]}0101`,end:`${years.at(-1)}1231`}));return r.ok?parseWind(r.data):r;
}
export async function getWindHistory(c:Coordinate):Promise<Result<DailyWind>>{
 const daily=await getDailyWind(c);if(daily.ok)return daily;
 if(daily.error.kind==='rate_limit')return daily;
 // Hourly requests are bounded to one calendar year. Stop on rate limiting.
 const successes:DailyWind[]=[];
 for(const year of API.dailyYears){const r=await jsonRequest(pointUrl(c,'hourly',{start:`${year}0101`,end:`${year}1231`}));const parsed=r.ok?parseWind(r.data):r;if(parsed.ok)successes.push(parsed.data);else if(parsed.error.kind==='rate_limit')break;}
 if(!successes.length)return failure('no_data',`Daily and hourly wind history unavailable. ${daily.error.message} Monthly average direction is shown instead.`);
 return {ok:true,data:{observations:successes.flatMap(s=>s.observations),period:successes.map(s=>s.period).join(', ')+' (hourly; daily endpoint rejected)'}};
}
