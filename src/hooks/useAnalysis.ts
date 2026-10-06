import {useState,useRef,useEffect} from 'react';
import type {SitePolygon} from '../types';
import type {RawAnalysis} from '../analysis/evaluate';
import {evaluate} from '../analysis/evaluate';
import {getClimate,getWindHistory} from '../services/nasaPower';
import {getElevation} from '../services/elevation';
import {getOsm} from '../services/osm';
import {failure} from '../services/http';
import {geometry} from '../utils/geo';
export type Stage={name:string;state:'pending'|'running'|'done'|'unavailable'};
const STAGES=['Climate & wind history','Elevation & terrain','OSM & constraints','Calculate suitability'];
export function useAnalysis(site:SitePolygon|null,mode:'live'|'demo'){
 const [raw,setRaw]=useState<RawAnalysis|null>(null);const [running,setRunning]=useState(false);const [stages,setStages]=useState<Stage[]>([]);const generation=useRef(0);const [error,setError]=useState('');
 useEffect(()=>{generation.current++;setRaw(null);setRunning(false);setStages([]);setError('');},[site,mode]);
 const run=async()=>{
 if(!site)return;const id=++generation.current;setRaw(null);setError('');setRunning(true);setStages(STAGES.map(name=>({name,state:'pending'})));
 const stage=(index:number,state:Stage['state'])=>{if(id===generation.current)setStages(current=>current.map((s,i)=>i===index?{...s,state}:s));};
 try {
 stage(0,'running');let data:RawAnalysis;
 if(mode==='demo'){
 const fixture=await import('../data/demo');const climate=fixture.demoClimate(),windHistory=fixture.demoWind();stage(0,climate.ok?'done':'unavailable');
 const reason='Not included in this cached NASA sample. Switch to Live data to assess.';
 stage(1,'unavailable');stage(2,'unavailable');data={climate,windHistory,elevation:failure('no_data',reason),osm:failure('no_data',reason),mode,siteKey:JSON.stringify(site.geometry.coordinates),completedAt:new Date().toISOString()};
 }else {
 const c=geometry(site).centroid;const climate=await getClimate(c);const windHistory=await getWindHistory(c);stage(0,climate.ok?'done':'unavailable');if(id!==generation.current)return;
 stage(1,'running');const elevation=await getElevation(site);stage(1,elevation.ok?'done':'unavailable');if(id!==generation.current)return;
 stage(2,'running');const osm=await getOsm(site);stage(2,osm.ok?'done':'unavailable');if(id!==generation.current)return;
 data={climate,windHistory,elevation,osm,mode,siteKey:JSON.stringify(site.geometry.coordinates),completedAt:new Date().toISOString()};
 }
 stage(3,'running');evaluate(data,site);stage(3,'done');if(id===generation.current)setRaw(data);
 }catch{if(id===generation.current)setError('Analysis could not finish. Check the boundary and retry.');}finally{if(id===generation.current)setRunning(false);}
 };
 return {raw,running,stages,error,run};
}
