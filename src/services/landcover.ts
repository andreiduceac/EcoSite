import type { Result } from '../types';
export function getLandcover():Result<never>{return {ok:false,error:{kind:'no_data',message:'ESA WorldCover/CORINE point sampling is not integrated. Forest and water checks use mapped OSM polygons only; land cover is Not assessed.'}};}
