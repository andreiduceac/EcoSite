import {createContext,useContext,useEffect,useState,useMemo} from 'react';
import type {ReactNode} from 'react';
import {getLanguage,setActiveLanguage,translate,localeFor} from './core';
import type {Language} from './core';
export type LanguageContextValue={language:Language;locale:string;setLanguage:(language:Language)=>void;tr:(value:string)=>string};
export const LanguageContext=createContext<LanguageContextValue|null>(null);
function initialLanguage():Language{try{const saved=localStorage.getItem('ecosite-language');return saved==='ro'?'ro':'en';}catch{return 'en';}}
export function LanguageProvider({children}:{children:ReactNode}){
 const [language,updateLanguage]=useState<Language>(initialLanguage);setActiveLanguage(language);
 const setLanguage=(next:Language)=>{setActiveLanguage(next);updateLanguage(next);try{localStorage.setItem('ecosite-language',next);}catch{/* Switching still works when persistent storage is unavailable. */}};
 useEffect(()=>{document.documentElement.lang=language;document.title=language==='ro'?'EcoSite — Energie regenerabilă, fundamentată pe date':'EcoSite — Renewable energy, grounded in data';const description=document.querySelector('meta[name="description"]');description?.setAttribute('content',language==='ro'?'Analiză preliminară transparentă a terenurilor pentru energie solară și eoliană, bazată pe date publice climatice și geografice.':'Transparent preliminary solar and wind site analysis, powered by public climate and geographic data.');},[language]);
 const value=useMemo<LanguageContextValue>(()=>({language,locale:localeFor(language),setLanguage,tr:(text)=>translate(text,language)}),[language]);
 return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage():LanguageContextValue{const context=useContext(LanguageContext);if(!context)throw new Error('LanguageProvider is required.');return context;}
export const translateCurrent=(text:string)=>translate(text,getLanguage());
