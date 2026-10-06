import type { ComponentKey, ComponentScores } from '../types';
import { WEIGHTS } from '../config/weights';
import { clamp } from '../utils/format';
export function calculateScore(components:ComponentScores,weights=WEIGHTS){
 const keys=Object.keys(components) as ComponentKey[];const included=keys.filter(k=>components[k].score!==null&&Number.isFinite(components[k].score));const total=included.reduce((sum,k)=>sum+weights[k],0);
 const appliedWeights=Object.fromEntries(keys.map(k=>[k,total>0&&included.includes(k)?weights[k]/total:0])) as Record<ComponentKey,number>;
 const overall=total>0?included.reduce((sum,k)=>sum+clamp(components[k].score!)*appliedWeights[k],0):null;
 return {components,weights,appliedWeights,overall,excluded:keys.filter(k=>!included.includes(k))};
}
