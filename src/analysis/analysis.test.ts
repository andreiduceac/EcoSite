import { describe,it,expect } from 'vitest';
import { analyzeSolar } from './solar';
import { analyzeWind,gamma,genericPower,weibullFit,windRose } from './wind';
import { calculateScore } from './scoring';
import { recommend } from './recommend';
import { DEFAULTS } from '../config/defaults';
import type { Climate,MonthlyValues,ComponentScores } from '../types';
import { MONTHS } from '../types';
import { SAMPLE_SITE } from '../data/sampleSite';
const monthly=(v:number):MonthlyValues=>Object.fromEntries(MONTHS.map(m=>[m,v]));
const climate:Climate={parameters:{ALLSKY_SFC_SW_DWN:monthly(4),T2M:monthly(20),WS50M:monthly(6)},source:'test',period:'test'};
describe('solar known-input arithmetic',()=>{
 it('integrates 365 days and derives capacity without a tilt gain',()=>{const s=analyzeSolar(climate,45,10,DEFAULTS)!;expect(s.annualIrradiation).toBe(1460);expect(s.tilt).toBeCloseTo(37.3);expect(s.production?.capacityKwp).toBeCloseTo(5880);expect(s.production?.annualGwh).toBeCloseTo(7.382928);expect(s.score).toBeCloseTo(50.90909);expect(s.production?.modules).toBe(13066);});
 it('temperature losses and module wattage behave independently',()=>{const c={...climate,parameters:{...climate.parameters,T2M:monthly(35)}};const s=analyzeSolar(c,-45,10,{...DEFAULTS,panelWattage:500})!;expect(s.azimuth).toBe(0);expect(s.production?.performanceRatio).toBeCloseTo(.82);expect(s.production?.capacityKwp).toBe(5880);expect(s.production?.modules).toBe(11760);});
 it('missing temperature excludes production, missing resource excludes solar',()=>{expect(analyzeSolar({...climate,parameters:{ALLSKY_SFC_SW_DWN:monthly(4)}},45,10,DEFAULTS)?.production).toBeNull();expect(analyzeSolar({...climate,parameters:{}},45,10,DEFAULTS)).toBeNull();});
});
describe('wind transparent models',()=>{
 it('extrapolates speed with power law',()=>{const w=analyzeWind(climate,null,SAMPLE_SITE,10,DEFAULTS)!;expect(w.meanHub).toBeCloseTo(6*2**.14);expect(w.prevailing).toBeNull();expect(w.positions).toHaveLength(0);expect(w.cfMethod).toContain('bands');});
 it('bins north across 0 degrees and energy weights by v cubed',()=>{const r=windRose({observations:[{date:'1',speed:3,direction:359},{date:'2',speed:6,direction:1},{date:'3',speed:4,direction:180}],period:'test'},{...DEFAULTS,hubHeight:50});expect(r[0].frequency).toBeCloseTo(200/3);expect(r[0].meanSpeed).toBe(4.5);expect(r[0].energyWeight).toBe(243);});
 it('generic curve and Weibull are bounded and Gamma is accurate',()=>{expect(gamma(1)).toBeCloseTo(1);expect(gamma(1.5)).toBeCloseTo(Math.sqrt(Math.PI)/2);expect(genericPower(3)).toBe(0);expect(genericPower(12)).toBe(1);expect(genericPower(25)).toBe(0);const f=weibullFit(Array.from({length:200},(_,i)=>3+i%10))!;expect(f.cf).toBeGreaterThan(0);expect(f.cf).toBeLessThan(1);expect(f.mean).toBe(7.5);});
});
const components:ComponentScores={solar:{score:80,type:'ESTIMATED'},wind:{score:40,type:'ESTIMATED'},environment:{score:null,type:'ESTIMATED',reason:'offline'},terrain:{score:null,type:'ESTIMATED'},infrastructure:{score:null,type:'ESTIMATED'}};
describe('scoring and recommendation',()=>{
 it('renormalizes available weights with exact hand-checked result',()=>{const s=calculateScore(components);expect(s.overall).toBeCloseTo((80*40+40*25)/65);expect(s.appliedWeights.solar).toBeCloseTo(40/65);expect(s.appliedWeights.environment).toBe(0);expect(s.excluded).toHaveLength(3);});
 it('returns no score when every component is missing',()=>{const all=Object.fromEntries(Object.keys(components).map(k=>[k,{score:null,type:'ESTIMATED'}])) as ComponentScores;expect(calculateScore(all).overall).toBeNull();});
 it('applies recommendation thresholds and hard flags',()=>{expect(recommend(39,90,80,false).type).toBe('LOW_SUITABILITY');expect(recommend(80,90,80,true).type).toBe('LOW_SUITABILITY');expect(recommend(70,70,65,false).type).toBe('SOLAR_PLUS_WIND');expect(recommend(70,85,60,false).type).toBe('SOLAR');expect(recommend(70,50,80,false).type).toBe('WIND');expect(recommend(70,null,80,false).whyNot).toContain('Not assessed');expect(recommend(null,null,null,false).type).toBeNull();});
});
