// Browser checks use only visible controls and rendered document state.
export async function runDesign(tab,origin){
 const results=[];const check=(name,ok)=>{if(!ok)throw Error(name);results.push(name);};
 await tab.goto(origin+'/index.html');await tab.playwright.domSnapshot();
 check('homepage fits viewport',await tab.playwright.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await tab.playwright.getByRole('button',{name:'Open graphing workspace',exact:true}).click();await tab.playwright.domSnapshot();
 for(const name of ['Line','Quadratic','Exponential','System','Circle','Inequality']){await tab.playwright.getByRole('button',{name,exact:true}).click();await tab.playwright.domSnapshot();check(name+' preset renders',await tab.playwright.locator('#a1-workspace-canvas svg').count()===1);check(name+' reports success',!(await tab.playwright.locator('.a1-workspace-status').innerText()).includes('Enter'));}
 await tab.playwright.getByRole('textbox',{name:'Equations and inequalities'}).fill('y = x^2');await tab.playwright.getByRole('button',{name:'Plot the graph',exact:true}).click();await tab.playwright.getByRole('spinbutton',{name:'Trace at x ='}).fill('3');await tab.playwright.domSnapshot();check('quadratic trace computes 9',(await tab.playwright.locator('#a1-graph-trace').innerText()).includes('(3, 9)'));
 await tab.playwright.getByRole('textbox',{name:'Equations and inequalities'}).fill('not a relation');await tab.playwright.getByRole('button',{name:'Plot the graph',exact:true}).click();await tab.playwright.domSnapshot();check('invalid graph input gets readable error',(await tab.playwright.locator('.a1-workspace-status').innerText()).includes('Use an equation'));
 await tab.playwright.getByRole('button',{name:'× Close',exact:true}).click();await tab.playwright.domSnapshot();
 let notes=0;for(const file of ['unit1-4.html',...Array.from({length:12},(_,i)=>'unit'+(i+5)+'.html')]){
  await tab.goto(origin+'/'+file);await tab.playwright.domSnapshot();const count=await tab.playwright.locator('.tg-card').count();
  for(let i=0;i<count;i++){await tab.playwright.locator('.tg-card').nth(i).press('Enter');await tab.playwright.domSnapshot();check(file+' note '+i+' opens',await tab.playwright.locator('#modal-body').isVisible());check(file+' note '+i+' fits reader',await tab.playwright.evaluate(()=>{const el=document.querySelector('#modal-body');return el.scrollWidth<=el.clientWidth+1;}));check(file+' note '+i+' diagrams have descriptions',await tab.playwright.locator('#modal-body svg').evaluateAll(es=>es.every(e=>e.getAttribute('aria-label')||e.getAttribute('aria-labelledby'))));await tab.playwright.getByRole('button',{name:'✕ Close',exact:true}).click();await tab.playwright.domSnapshot();notes++;}
  for(const name of ['Vocabulary','Practice','Practice Test']){await tab.playwright.getByRole('tab',{name,exact:true}).click();await tab.playwright.domSnapshot();check(file+' '+name+' fits viewport',await tab.playwright.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 }
 check('all 66 note topics opened',notes===66);
 await tab.goto(origin+'/unit15.html');await tab.playwright.getByRole('tab',{name:'Practice Test',exact:true}).click();await tab.playwright.domSnapshot();
 for(const [name,value] of [['a','3'],['b','-1'],['c','7']])await tab.playwright.getByRole('textbox',{name,exact:true}).fill(value);
 await tab.playwright.getByRole('button',{name:'✓ Submit test',exact:true}).click();await tab.playwright.domSnapshot();
 check('labeled multipart answers grade correctly',(await tab.playwright.locator('.pcard').filter({hasText:'Identify a, b, c:'}).innerText()).includes('✓ Correct!'));
 check('submitted feedback fits mobile viewport',await tab.playwright.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));return results;
}
