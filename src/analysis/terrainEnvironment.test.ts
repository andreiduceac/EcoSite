import {describe,it,expect} from 'vitest';
import {polygon,lineString} from '@turf/turf';
import {analyzeTerrain} from './terrain';
import {analyzeEnvironment} from './environment';
import {analyzeInfrastructure} from './infrastructure';
import {parseOsm} from '../services/osm';
import type {OsmData,ElevationGrid} from '../types';
const site=polygon([[[26,47],[26.003,47],[26.003,47.003],[26,47.003],[26,47]]]);
const osm:OsmData={features:[],source:'test',fetchedAt:'test',incompleteAreas:0,radiusKm:5};
describe('terrain and environment',()=>{
 it('flat measured grid yields zero slope and favorable flat score',()=>{const grid:ElevationGrid={samples:Array.from({length:9},(_,i)=>({row:Math.floor(i/3),col:i%3,position:[26+i%3*.001,47+Math.floor(i/3)*.001],elevation:100})),spacingM:90,source:'test'};const t=analyzeTerrain(grid,site,47)!;expect(t.meanSlope).toBe(0);expect(t.maxSlope).toBe(0);expect(t.under10Percent).toBe(100);expect(t.score).toBe(100);expect(t.cells.features.length).toBe(9);});
 it('flags protected overlap and avoids double counting',()=>{const data={...osm,features:[{id:'1',category:'protected' as const,feature:site},{id:'2',category:'protected' as const,feature:site}]};const e=analyzeEnvironment(data,site,null);expect(e.hardFlag).toBe(true);expect(e.protectedOverlap).toBeCloseTo(100);expect(e.score).toBe(25);});
 it('excludes incomplete area coverage',()=>expect(analyzeEnvironment({...osm,incompleteAreas:1},site,null).score).toBeNull());
 it('missing mapped infrastructure remains missing',()=>{const r=analyzeInfrastructure(osm,site);expect(r.score).toBeNull();expect(r.roadKm).toBeNull();expect(r.excluded).toHaveLength(3);});
 it('calculates distance to actual line geometry',()=>{const data={...osm,features:[{id:'1',category:'road' as const,feature:lineString([[26,47.0015],[26.003,47.0015]])}]};expect(analyzeInfrastructure(data,site).roadKm).toBeCloseTo(0,3);});
 it('rejects timed-out Overpass replies and joins relation rings',()=>{expect(parseOsm({elements:[],remark:'timed out'}).ok).toBe(false);const r=parseOsm({elements:[{type:'relation',id:1,tags:{boundary:'protected_area'},members:[{role:'outer',geometry:[{lat:47,lon:26},{lat:47,lon:26.01},{lat:47.01,lon:26.01}]},{role:'outer',geometry:[{lat:47.01,lon:26.01},{lat:47.01,lon:26},{lat:47,lon:26}]}]}]});expect(r.ok).toBe(true);if(r.ok){expect(r.data.features).toHaveLength(1);expect(r.data.incompleteAreas).toBe(0);}});
});
