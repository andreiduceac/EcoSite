import type { Climate, MonthlyValues } from '../types';
import { MONTHS } from '../types';
import type { SolarInputs } from '../config/defaults';
import { DAYS, SOLAR_MODEL } from '../config/defaults';
import { THRESHOLDS } from '../config/thresholds';
import { clamp } from '../utils/format';
export function completeMonths(values:MonthlyValues|undefined):number[]|null {if(!values)return null;const output:number[]=[];for(const m of MONTHS){const n=values[m];if(n===undefined||!Number.isFinite(n))return null;output.push(n);}return output;}
export function annualTotal(values:number[]):number {return values.reduce((sum,n,i)=>sum+n*DAYS[i],0);}
export type SolarResult={annualIrradiation:number;seasonalVariation:number;tilt:number;azimuth:number;score:number;tiltWarning?:string;production:null|{capacityKwp:number;annualGwh:number;mwhPerHa:number;modules:number;performanceRatio:number;temperatureDerate:number;usableHa:number};productionMissing?:string};
export function analyzeSolar(climate:Climate,latitude:number,areaHa:number,inputs:SolarInputs):SolarResult|null {
 const irradiance=completeMonths(climate.parameters.ALLSKY_SFC_SW_DWN);if(!irradiance||irradiance.some(v=>v<0))return null;
 const annualIrradiation=annualTotal(irradiance);const seasonalVariation=Math.min(...irradiance)>0?Math.max(...irradiance)/Math.min(...irradiance):Infinity;
 const penalty=clamp((seasonalVariation-SOLAR_MODEL.seasonalBaseline)*SOLAR_MODEL.seasonalPenaltyFactor,0,SOLAR_MODEL.seasonalPenaltyMax);
 const base=clamp((annualIrradiation-THRESHOLDS.solarLow)/(THRESHOLDS.solarHigh-THRESHOLDS.solarLow)*100);
 const result:SolarResult={annualIrradiation,seasonalVariation,tilt:clamp(SOLAR_MODEL.tiltLatitudeFactor*Math.abs(latitude)+SOLAR_MODEL.tiltOffset,0,90),azimuth:latitude>=0?180:0,score:clamp(base-penalty),production:null};
 if(Math.abs(latitude)<25||Math.abs(latitude)>50)result.tiltWarning='Tilt is an extrapolation outside the source’s validated 25–50° latitude range.';
 const temperature=completeMonths(climate.parameters.T2M);if(!temperature){result.productionMissing='Complete monthly temperature data is missing; production not assessed.';return result;}
 if(areaHa<=0||inputs.moduleEfficiency<=0||inputs.moduleEfficiency>100||inputs.panelWattage<=0||inputs.usableLand<=0||inputs.usableLand>100||inputs.groundCoverage<=0||inputs.groundCoverage>1||inputs.systemLosses<0||inputs.systemLosses>=100){result.productionMissing='Production inputs must be within their permitted ranges.';return result;}
 const usableHa=areaHa*inputs.usableLand/100;const capacityKwp=usableHa*10000*inputs.moduleEfficiency/100*inputs.groundCoverage;
 const temperatureDerate=annualIrradiation>0?irradiance.reduce((sum,g,i)=>sum+g*DAYS[i]*Math.max(0,temperature[i]-SOLAR_MODEL.temperatureThresholdC)*SOLAR_MODEL.temperatureCoefficient,0)/annualIrradiation:0;
 const performanceRatio=clamp(1-inputs.systemLosses/100-temperatureDerate,0,1);const annualGwh=capacityKwp*annualIrradiation*performanceRatio/1e6;
 result.production={capacityKwp,annualGwh,mwhPerHa:annualGwh*1000/areaHa,modules:Math.floor(capacityKwp*1000/inputs.panelWattage),performanceRatio,temperatureDerate,usableHa};return result;
}
