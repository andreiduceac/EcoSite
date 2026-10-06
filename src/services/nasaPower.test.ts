import {describe,it,expect} from 'vitest';
import {parseClimate,parseWind} from './nasaPower';
import climate from '../data/suceava-climate.json';
import daily from '../data/suceava-daily.json';
describe('NASA response parsing',()=>{it('reads real captured values without substitutes',()=>{const r=parseClimate(climate);expect(r.ok).toBe(true);if(r.ok)expect(r.data.parameters.ALLSKY_SFC_SW_DWN?.JAN).toBe(1.1878);});it('rejects invalid daily wind directions',()=>expect(parseWind(daily).ok).toBe(false));it('preserves missing months',()=>{const r=parseClimate({properties:{parameter:{T2M:{JAN:-999,FEB:0}}}});expect(r.ok).toBe(true);if(r.ok){expect(r.data.parameters.T2M?.JAN).toBeUndefined();expect(r.data.parameters.T2M?.FEB).toBe(0);}});});
