import {ro,roMessages} from './ro';
export type Language='en'|'ro';
let activeLanguage:Language='en';
export const getLanguage=():Language=>activeLanguage;
export const setActiveLanguage=(language:Language):void=>{activeLanguage=language;};
export const localeFor=(language:Language):string=>language==='ro'?'ro-RO':'en-GB';
const escape=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=Object.entries(roMessages).map(([source,target])=>({source,target,regex:new RegExp('^'+source.split(/\{\d+\}/).map(escape).join('([\\s\\S]*?)')+'$')}));
function translateCore(value:string,language:Language,depth:number):string{
 if(language==='en'||depth>6)return value;
 const trimmed=value.trim();const leading=value.match(/^\s*/)?.[0]??'',trailing=value.match(/\s*$/)?.[0]??'';
 const direct=ro[trimmed]??roMessages[trimmed];if(direct!==undefined)return leading+direct+trailing;
 for(const pattern of patterns){const match=pattern.regex.exec(trimmed);if(!match)continue;
 const numericalSource=/^(Overall suitability|Why not solar or wind\? The available|Both resource|Their |Its score|Land is too |Mapped (water|forest|buildings)|No turbines)/.test(pattern.source)||pattern.source.includes('higher available resource score');
 const translated=pattern.target.replace(/\{(\d+)\}/g,(_,index:string)=>{const captured=match[Number(index)+1]??'';if(numericalSource&&/^-?\d+(\.\d+)?$/.test(captured)){const decimals=captured.includes('.')?captured.split('.')[1].length:0;return new Intl.NumberFormat(localeFor(language),{minimumFractionDigits:decimals,maximumFractionDigits:decimals,useGrouping:false}).format(Number(captured));}return translateCore(captured,language,depth+1);});return leading+translated+trailing;
 }
 return value;
}
/** Source text is the stable English key; unknown API payload text is left intact. */
export const translate=(value:string,language:Language=getLanguage()):string=>translateCore(value,language,0);
