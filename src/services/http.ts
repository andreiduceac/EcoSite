import type { Result } from '../types';
import { API } from '../config/defaults';
const cache = new Map<string,{expires:number;data:unknown}>();
export const failure = <T>(kind:'network'|'rate_limit'|'invalid_input'|'no_data',message:string):Result<T>=>({ok:false,error:{kind,message}});
export function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value);}
export async function jsonRequest(url:string,options:RequestInit={},useCache=true):Promise<Result<unknown>> {
 const key=url+(options.body??''); const hit=cache.get(key);
 if(useCache&&hit&&hit.expires>Date.now())return {ok:true,data:hit.data};
 if(useCache){try{const saved:unknown=JSON.parse(sessionStorage.getItem('eco:'+key)??'null');if(isRecord(saved)&&typeof saved.expires==='number'&&saved.expires>Date.now()){cache.set(key,{expires:saved.expires,data:saved.data});return {ok:true,data:saved.data};}}catch{/* Storage may be unavailable; memory cache still works. */}}
 for(let attempt=0;attempt<=API.retries;attempt++){
  try{
   const response=await fetch(url,{...options,signal:AbortSignal.timeout(API.timeoutMs)});
   if(response.status===429){if(attempt<API.retries){const header=Number(response.headers.get('Retry-After'));await new Promise<void>(resolve=>setTimeout(resolve,Math.min(Number.isFinite(header)&&header>0?header*1000:1000*2**attempt,10000)));continue;}return failure('rate_limit','The source is rate limited (HTTP 429). Retry in a few minutes.');}
   if(!response.ok)return failure(response.status===400||response.status===422?'invalid_input':'network',`The source returned HTTP ${response.status}. Retry later.`);
   const data:unknown=await response.json();
   if(useCache){const value={expires:Date.now()+API.cacheTtlMs,data};cache.set(key,value);try{sessionStorage.setItem('eco:'+key,JSON.stringify(value));}catch{/* Cache quota does not affect analysis. */}}
   return {ok:true,data};
  }catch(error){return failure('network',typeof navigator!=='undefined'&&!navigator.onLine?'You are offline. Connect to the internet or use Demo Mode.':error instanceof Error&&error.name==='TimeoutError'?'The source timed out. Retry later.':'The source could not be reached. Check your connection or retry later.');}
 }
 return failure('network','Request failed.');
}
