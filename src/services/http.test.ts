import {afterEach,describe,expect,it,vi} from 'vitest';
import {jsonRequest} from './http';
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
describe('typed source failure handling',()=>{
 it('returns a network error instead of data on connection failure',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('offline')));const r=await jsonRequest('https://test.invalid/offline',{},false);expect(r.ok).toBe(false);if(!r.ok)expect(r.error.kind).toBe('network');});
 it('backs off 429 responses and returns a typed rate-limit error',async()=>{vi.useFakeTimers();const fetch=vi.fn().mockResolvedValue(new Response('{}',{status:429}));vi.stubGlobal('fetch',fetch);const pending=jsonRequest('https://test.invalid/limited',{},false);await vi.runAllTimersAsync();const r=await pending;expect(fetch).toHaveBeenCalledTimes(3);expect(r.ok).toBe(false);if(!r.ok)expect(r.error.kind).toBe('rate_limit');});
 it('caches verified payloads without substituting another source',async()=>{const fetch=vi.fn().mockResolvedValue(new Response('{"source":"live"}',{status:200}));vi.stubGlobal('fetch',fetch);await jsonRequest('https://test.invalid/cached');const r=await jsonRequest('https://test.invalid/cached');expect(fetch).toHaveBeenCalledTimes(1);expect(r).toEqual({ok:true,data:{source:'live'}});});
});
