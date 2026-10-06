import {getLanguage,localeFor} from '../i18n/core';
export const fmt=(value:number,digits=1)=>new Intl.NumberFormat(localeFor(getLanguage()),{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
export const clamp=(n:number,min=0,max=100)=>Math.min(max,Math.max(min,n));
export const disclaimer='EcoSite provides preliminary estimates based on publicly available data. It is for educational and planning purposes and is not professional engineering advice.';
