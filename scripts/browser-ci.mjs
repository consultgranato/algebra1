import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { run } from '../tests/browser-regressions.mjs';
import { runDesign } from '../tests/design-browser.mjs';
const server=spawn('python',['-m','http.server','8778','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
  for(let i=0;i<50;i++){try{await fetch('http://127.0.0.1:8778/index.html');break;}catch{await new Promise(r=>setTimeout(r,100));}}
  browser=await chromium.launch({headless:true});
  const errors=[],results=[];
  for(const width of [1280,390]){
    const page=await browser.newPage({viewport:{width,height:900}});
    page.on('pageerror',e=>errors.push(e.message));
    const playwright=new Proxy({domSnapshot:()=>page.locator('body').innerText()},{get(target,key){return key in target?target[key]:typeof page[key]==='function'?page[key].bind(page):page[key];}});
    const tab={goto:page.goto.bind(page),reload:page.reload.bind(page),playwright};
    results.push({width,checks:(await run(tab,'http://127.0.0.1:8778')).length,designChecks:(await runDesign(tab,'http://127.0.0.1:8778')).length});
    for(const file of ['unit1-4.html',...Array.from({length:12},(_,i)=>'unit'+(i+5)+'.html')]){
      await page.goto('http://127.0.0.1:8778/'+file);
      for(const name of ['Notes','Vocabulary','Practice','Practice Test'])await page.getByRole('tab',{name,exact:true}).click();
    }
    await page.close();
  }
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({viewports:results,allUnitSectionsOpened:13,errors},null,2));
}finally{if(browser)await browser.close();server.kill();}
