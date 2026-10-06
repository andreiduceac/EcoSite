const {chromium}=require('/opt/codex/runtimes/cua/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();await p.goto('http://127.0.0.1:5173/analyze');const result=await p.evaluate(async()=>{
 const [{getClimate},{getElevation},{getOsm},{SAMPLE_SITE},{analyzeTerrain}]=await Promise.all([import('/src/services/nasaPower.ts'),import('/src/services/elevation.ts'),import('/src/services/osm.ts'),import('/src/data/sampleSite.ts'),import('/src/analysis/terrain.ts')]);
 const [climate,elevation,osm]=await Promise.all([getClimate({lat:47.665,lon:26.205}),getElevation(SAMPLE_SITE),getOsm(SAMPLE_SITE)]);
 const terrain=elevation.ok?analyzeTerrain(elevation.data,SAMPLE_SITE,47.665):null;
 return {climate:climate.ok?{ok:true,jan:climate.data.parameters.ALLSKY_SFC_SW_DWN.JAN}:climate,elevation:elevation.ok?{ok:true,samples:elevation.data.samples.length,spacing:elevation.data.spacingM}:elevation,terrain:terrain?{meanSlope:terrain.meanSlope,cells:terrain.cells.features.length,coverage:terrain.coveragePercent}:null,osm:osm.ok?{ok:true,features:osm.data.features.length,incomplete:osm.data.incompleteAreas}:osm};
 });console.log(JSON.stringify(result,null,2));await b.close();})().catch(e=>{console.error(e);process.exit(1)});
