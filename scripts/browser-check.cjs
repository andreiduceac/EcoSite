const {chromium}=require('/opt/codex/runtimes/cua/lib/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:5173/analyze?demo=1');await page.locator('.dashboard').waitFor();
 await page.getByRole('tab',{name:'Solar',exact:true}).click();const before=await page.locator('.metric').filter({hasText:'Annual electricity'}).innerText();
 await page.getByRole('spinbutton',{name:'Usable land value',exact:true}).fill('50');const after=await page.locator('.metric').filter({hasText:'Annual electricity'}).innerText();console.log('Solar live recalculation',before,'→',after);if(before===after)throw Error('Production did not recalculate');
 await page.getByRole('tab',{name:'Wind',exact:true}).click();await page.locator('.recharts-polar-angle-axis').waitFor();console.log('Wind rose sectors',await page.locator('.recharts-polar-angle-axis-tick').count());
 await page.getByRole('tab',{name:'Methodology',exact:true}).click();console.log('Actual arithmetic',await page.locator('.arithmetic').innerText());
 await page.getByRole('button',{name:'Switch to dark mode'}).click();await page.screenshot({path:'/workspace/scratch/ecosite-dark.png',fullPage:true});
 await page.getByRole('button',{name:'Switch to live data',exact:true}).click();await page.getByRole('heading',{name:'A boundary is the beginning.'}).waitFor();if(await page.locator('.dashboard').count())throw Error('Demo results leaked to live mode');
 await page.getByRole('textbox',{name:'Search location'}).fill('91, 26');await page.getByRole('button',{name:'Submit location search'}).click();await page.getByRole('alert').filter({hasText:'Invalid coordinates'}).waitFor();
 await page.getByRole('textbox',{name:'Search location'}).fill('47.65, 26.25');await page.getByRole('button',{name:'Submit location search'}).click();await page.getByRole('button',{name:'47.65, 26.25'}).click();await page.waitForTimeout(1000);
 await page.getByRole('button',{name:'Select land',exact:true}).click();const box=await page.locator('.map-canvas').boundingBox();const p=(x,y)=>({x:box.x+box.width*x,y:box.y+box.height*y});
 for(const [x,y] of [[.35,.4],[.6,.4],[.6,.6],[.35,.6],[.35,.4]]){const point=p(x,y);await page.mouse.click(point.x,point.y);await page.waitForTimeout(100);}
 await page.getByRole('heading',{name:'Your site is ready to analyze.'}).waitFor({timeout:5000});console.log('Drawn polygon',await page.locator('.selection-summary').innerText());
 await page.getByRole('button',{name:'Edit polygon vertices'}).click();const point=p(.45,.5);await page.mouse.click(point.x,point.y);await page.waitForTimeout(200);const start=p(.35,.4),end=p(.3,.36);await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:10});await page.mouse.up();console.log('Edited polygon',await page.locator('.selection-summary').innerText());
 await page.getByRole('button',{name:'Delete polygon'}).click();await page.getByRole('heading',{name:'A boundary is the beginning.'}).waitFor();console.log('Delete clears analysis and polygon');
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5173');await page.waitForTimeout(1500);await page.screenshot({path:'/workspace/scratch/ecosite-mobile.png',fullPage:true});console.log('Mobile overflow',await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth));
 await page.goto('http://127.0.0.1:5173/analyze?demo=1');await page.locator('.dashboard').waitFor();await page.screenshot({path:'/workspace/scratch/ecosite-mobile-demo.png',fullPage:true});console.log('Mobile demo overflow',await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth));console.log('Page errors',errors);if(errors.length)throw Error(errors.join(';'));await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
