import type { Coordinate, Result } from '../types';
import { validCoordinate } from '../utils/geo';
import { jsonRequest, failure, isRecord } from './http';
export type SearchPlace=Coordinate&{name:string};
let lastRequest=0;
export async function searchPlaces(query:string):Promise<Result<SearchPlace[]>>{
 const text=query.trim();if(!text)return failure('invalid_input','Enter a city, address, or latitude, longitude.');
 if(/^[\d\s.,+\-]+$/.test(text)){const pair=text.split(',').map(Number);const c={lat:pair[0],lon:pair[1]};return pair.length===2&&validCoordinate(c)?{ok:true,data:[{...c,name:`${c.lat}, ${c.lon}`}]}:failure('invalid_input','Invalid coordinates. Use latitude, longitude within ±90°, ±180°.');}
 const delay=Math.max(0,1100-(Date.now()-lastRequest));if(delay)await new Promise<void>(r=>setTimeout(r,delay));lastRequest=Date.now();
 const url=`https://nominatim.openstreetmap.org/search?${new URLSearchParams({q:text,format:'jsonv2',limit:'5'})}`;
 const result=await jsonRequest(url);if(!result.ok)return result;
 if(!Array.isArray(result.data))return failure('no_data','Search returned an unreadable response.');
 const places:SearchPlace[]=[];for(const place of result.data){if(isRecord(place)&&typeof place.display_name==='string'){const lat=Number(place.lat),lon=Number(place.lon);if(validCoordinate({lat,lon}))places.push({lat,lon,name:place.display_name});}}
 return {ok:true,data:places};
}
