import { describe,expect,it } from 'vitest';
import { polygon } from '@turf/turf';
import { validatePolygon,validCoordinate } from './geo';
import { SAMPLE_SITE } from '../data/sampleSite';
describe('polygon validation',()=>{
 it('calculates a valid field with closed boundary',()=>{const r=validatePolygon(SAMPLE_SITE);expect(r.ok).toBe(true);if(r.ok){expect(r.data.areaHa).toBeGreaterThan(10);expect(r.data.centroid.lat).toBeCloseTo(47.665);expect(r.data.perimeterKm).toBeGreaterThan(1);}});
 it('rejects self intersections',()=>{expect(validatePolygon(polygon([[[26,47],[26.1,47.1],[26,47.1],[26.1,47],[26,47]]])).ok).toBe(false);});
 it('rejects tiny and huge areas',()=>{for(const d of [0.000001,2])expect(validatePolygon(polygon([[[26,47],[26+d,47],[26+d,47+d],[26,47+d],[26,47]]])).ok).toBe(false);});
 it('rejects invalid coordinates',()=>{expect(validCoordinate({lat:91,lon:26})).toBe(false);expect(validCoordinate({lat:47,lon:NaN})).toBe(false);});
 it('notes unsupported antimeridian boundaries',()=>{const r=validatePolygon(polygon([[[179.999,0],[-179.999,0],[-179.999,0.01],[179.999,0.01],[179.999,0]]]));expect(r.ok).toBe(false);if(!r.ok)expect(r.error.message).toContain('antimeridian');});
});
