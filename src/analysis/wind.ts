import { bbox, buffer, booleanPointInPolygon, point, destination, distance } from '@turf/turf';
import type { Position } from 'geojson';
import type { Climate, DailyWind, SitePolygon } from '../types';
import { WIND_MODEL, WIND_BANDS, DAYS } from '../config/defaults';
import type { WindInputs } from '../config/defaults';
import { THRESHOLDS } from '../config/thresholds';
import { clamp } from '../utils/format';
import { completeMonths } from './solar';
export const SECTORS=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
export type RoseSector={direction:string;degrees:number;frequency:number;meanSpeed:number;energyWeight:number;count:number};
export function windRose(history:DailyWind,inputs:WindInputs):RoseSector[]{
 const scale=(inputs.hubHeight/WIND_MODEL.referenceHeight)**inputs.shearExponent;
 const result=SECTORS.map((direction,i)=>({direction,degrees:i*360/WIND_MODEL.sectors,frequency:0,meanSpeed:0,energyWeight:0,count:0}));let total=0;
 for(const o of history.observations){if(o.speed<0||o.direction<0||o.direction>360)continue;const bin=result[Math.floor((o.direction+360/WIND_MODEL.sectors/2)%360/(360/WIND_MODEL.sectors))];bin.count++;const v=o.speed*scale;bin.meanSpeed+=v;bin.energyWeight+=v**3;total++;}
 if(!total)return [];for(const bin of result){bin.frequency=bin.count/total*100;bin.meanSpeed=bin.count?bin.meanSpeed/bin.count:0;}return result;
}
// Lanczos approximation for Gamma; arguments in this model are positive.
export function gamma(z:number):number {const p=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];if(z<0.5)return Math.PI/(Math.sin(Math.PI*z)*gamma(1-z));z-=1;let x=0.99999999999980993;for(let i=0;i<p.length;i++)x+=p[i]/(z+i+1);const t=z+p.length-0.5;return Math.sqrt(2*Math.PI)*t**(z+0.5)*Math.exp(-t)*x;}
export function genericPower(speed:number):number {if(speed<WIND_MODEL.cutIn||speed>=WIND_MODEL.cutOut)return 0;if(speed>=WIND_MODEL.rated)return 1;return (speed**3-WIND_MODEL.cutIn**3)/(WIND_MODEL.rated**3-WIND_MODEL.cutIn**3);}
export function weibullFit(speeds:number[]):{shape:number;scale:number;mean:number;cf:number}|null {
 if(speeds.length<WIND_MODEL.minimumObservations)return null;const mean=speeds.reduce((a,b)=>a+b,0)/speeds.length;if(mean<=0)return null;
 const sd=Math.sqrt(speeds.reduce((s,v)=>s+(v-mean)**2,0)/speeds.length);
 const shape=clamp(sd>0?(sd/mean)**WIND_MODEL.weibullCvExponent:WIND_MODEL.weibullMaxK,WIND_MODEL.weibullMinK,WIND_MODEL.weibullMaxK);const scale=mean/gamma(1+1/shape);
 let cf=0;for(let v=0;v<WIND_MODEL.cutOut;v+=WIND_MODEL.integrationStep){const next=v+WIND_MODEL.integrationStep;const probability=Math.exp(-((v/scale)**shape))-Math.exp(-((next/scale)**shape));cf+=genericPower((v+next)/2)*probability;}
 return {shape,scale,mean,cf:clamp(cf,0,1)};
}
export type WindResult={mean50:number;meanHub:number;score:number;rose:RoseSector[];prevailing:number|null;energyDirection:number|null;capacityFactor:number;cfMethod:string;weibull:ReturnType<typeof weibullFit>;positions:Position[];annualGwh:number|null;layoutReason:string;historyPeriod?:string};
export function layoutTurbines(site:SitePolygon,heading:number,inputs:WindInputs):Position[]{
 if(inputs.rotorDiameter<=0||inputs.setbackM<0)return [];
 const inner=buffer(site,-inputs.setbackM/1000,{units:'kilometers'});if(!inner)return [];
 const b=bbox(site);const origin=point([b[0],b[1]]);const w=distance(origin,point([b[2],b[1]]),{units:'kilometers'});const h=distance(origin,point([b[0],b[3]]),{units:'kilometers'});const diagonal=Math.hypot(w,h);const cross=inputs.rotorDiameter*WIND_MODEL.crosswindD/1000;const down=inputs.rotorDiameter*WIND_MODEL.downwindD/1000;
 const positions:Position[]=[];const steps=Math.ceil(diagonal/Math.min(cross,down));if(steps>200)return [];
 for(let i=-steps;i<=steps;i++)for(let j=-steps;j<=steps;j++){const row=destination(origin,i*down,heading,{units:'kilometers'});const p=destination(row,j*cross,heading+90,{units:'kilometers'});if(booleanPointInPolygon(p,inner))positions.push(p.geometry.coordinates);}
 return positions;
}
export function analyzeWind(climate:Climate,history:DailyWind|null,site:SitePolygon,areaHa:number,inputs:WindInputs):WindResult|null{
 const monthly=completeMonths(climate.parameters.WS50M);if(!monthly||inputs.hubHeight<=0)return null;
 const mean50=monthly.reduce((s,v,i)=>s+v*DAYS[i],0)/365;const factor=(inputs.hubHeight/WIND_MODEL.referenceHeight)**inputs.shearExponent;const meanHub=mean50*factor;const score=clamp((meanHub-THRESHOLDS.windLow)/(THRESHOLDS.windHigh-THRESHOLDS.windLow)*100);
 const rose=history?windRose(history,inputs):[];const enough=rose.reduce((s,b)=>s+b.count,0)>=WIND_MODEL.minimumDirectionObservations;
 const prevailing=enough?[...rose].sort((a,b)=>b.frequency-a.frequency)[0].degrees:null;const energyDirection=enough?[...rose].sort((a,b)=>b.energyWeight-a.energyWeight)[0].degrees:null;
 const weibull=history?weibullFit(history.observations.map(o=>o.speed*factor)):null;const capacityFactor=weibull?.cf??WIND_BANDS.find(b=>meanHub<b.max)!.cf;
 let layoutReason='Conceptual only: 5D crosswind × 8D downwind, after the setback.';let positions:Position[]=[];
 if(score<THRESHOLDS.windLayoutMinimum)layoutReason=`No turbines proposed: wind score is below ${THRESHOLDS.windLayoutMinimum}.`;
 else if(areaHa<THRESHOLDS.windAreaMinimumHa)layoutReason=`No turbines proposed: at least ${THRESHOLDS.windAreaMinimumHa} ha is required by this model.`;
 else if(prevailing===null)layoutReason='Not assessed: a valid directional distribution is needed to align the layout.';
 else {positions=layoutTurbines(site,prevailing,inputs);if(!positions.length)layoutReason='No turbine centers fit the setback and spacing constraints.';}
 return {mean50,meanHub,score,rose:enough?rose:[],prevailing,energyDirection,capacityFactor,cfMethod:weibull?'Weibull fit of source speed observations; generic power curve':'Mean-speed bands; wind distribution unavailable',weibull,positions,annualGwh:prevailing!==null&&score>=THRESHOLDS.windLayoutMinimum&&areaHa>=THRESHOLDS.windAreaMinimumHa?positions.length*inputs.turbineRatedMw*8760*capacityFactor/1000:null,layoutReason,historyPeriod:history?.period};
}
