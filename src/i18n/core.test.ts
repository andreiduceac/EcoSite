import {afterEach,describe,expect,it} from 'vitest';
import {translate,setActiveLanguage,localeFor} from './core';
import {fmt,disclaimer} from '../utils/format';
import {recommend} from '../analysis/recommend';
afterEach(()=>setActiveLanguage('en'));
describe('English and Romanian presentation',()=>{
 it('translates interface, provenance and disclaimer while preserving English',()=>{expect(translate('Select land','en')).toBe('Select land');expect(translate('Select land','ro')).toBe('Selectează terenul');expect(translate('MEASURED','ro')).toBe('MĂSURAT');expect(translate(disclaimer,'ro')).toContain('consultanța inginerească profesională');});
 it('translates generated recommendations with real numbers and nested reasons',()=>{
 const combined=recommend(75,73.5,70.2,false);expect(translate(combined.reasons[0],'ro')).toContain('solar 73,5, eolian 70,2');
 const solar=recommend(65,72.1,45.2,false);expect(translate(solar.reasons[0],'ro')).toContain('72,1/100');expect(translate(solar.whyNot,'ro')).toContain('De ce nu eolian?');expect(translate(solar.whyNot,'ro')).toContain('45,2');
 const low=recommend(32.5,30,20,false);expect(translate(low.reasons[0],'ro')).toContain('32,5');
 });
 it('handles dynamic errors and preserves unknown source payloads',()=>{expect(translate('NASA POWER returned no monthly wind values.','ro')).toBe('NASA POWER nu a returnat valori lunare pentru eolian.');expect(translate('Provider detail: unknown condition 42','ro')).toBe('Provider detail: unknown condition 42');expect(translate(' Not assessed ','ro')).toBe(' Neevaluat ');});
 it('formats decimal separators without altering calculations',()=>{setActiveLanguage('ro');expect(fmt(1234.56,2)).toBe('1.234,56');setActiveLanguage('en');expect(fmt(1234.56,2)).toBe('1,234.56');expect(localeFor('ro')).toBe('ro-RO');});
});
