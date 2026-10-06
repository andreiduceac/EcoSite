import climate from './field-climate.json';
import hourly2022 from './field-hourly-2022.json';
import hourly2023 from './field-hourly-2023.json';
import hourly2024 from './field-hourly-2024.json';
import { parseClimate,parseWind } from '../services/nasaPower';
import { CAPTURED } from './sampleSite';
import type { Climate,DailyWind,Result } from '../types';
export function demoClimate():Result<Climate>{return parseClimate(climate,CAPTURED);}
export function demoWind():Result<DailyWind>{const results=[hourly2022,hourly2023,hourly2024].map(parseWind);if(results.some(r=>!r.ok))return {ok:false,error:{kind:'no_data',message:'The cached hourly fixture could not be read.'}};return {ok:true,data:{observations:results.flatMap(r=>r.ok?r.data.observations:[]),period:'2022-01-01 – 2024-12-31 · hourly cached sample, captured '+CAPTURED}};}
