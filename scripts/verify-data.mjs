import { readFile,writeFile } from 'node:fs/promises';
const params=new URLSearchParams({parameters:'ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,T2M,PRECTOTCORR,WS10M,WS50M,WD50M',community:'RE',longitude:'26.25',latitude:'47.65',format:'JSON'});
const url=`https://power.larc.nasa.gov/api/temporal/climatology/point?${params}`;
let data;
if(process.argv.includes('--cached')){data=JSON.parse(await readFile(new URL('../src/data/suceava-climate.json',import.meta.url)));console.log('Cached sample captured 2026-10-06');}
else{const response=await fetch(url);if(!response.ok)throw new Error(`NASA returned ${response.status}`);data=await response.json();if(process.argv.includes('--capture'))await writeFile(new URL('../src/data/suceava-climate.json',import.meta.url),JSON.stringify(data,null,2));console.log('Live NASA POWER response',new Date().toISOString());}
const p=data.properties.parameter;console.log('Suceava 47.65 N, 26.25 E:',{solarJanuary:p.ALLSKY_SFC_SW_DWN.JAN,solarAnnualDaily:p.ALLSKY_SFC_SW_DWN.ANN,wind50m:p.WS50M.ANN,temperature:p.T2M.ANN});
