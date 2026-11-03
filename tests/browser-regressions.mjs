// Runs against the supported Codex browser Tab interface. All assertions inspect
// rendered controls and feedback, never hidden answer banks or page globals.
export async function run(tab, origin) {
  const results=[];
  function check(name,ok){if(!ok)throw Error(name);results.push(name);}
  async function section(name){await tab.playwright.getByRole('tab',{name,exact:true}).click();await tab.playwright.domSnapshot();}
  await tab.goto(origin+'/unit6.html');await tab.reload();await tab.playwright.domSnapshot();await section('Practice Test');
  const inequality=tab.playwright.locator('.pcard').filter({has:tab.playwright.locator('[data-math-source="4(2x - 1) >= 3(x + 4)"]')});
  const union=tab.playwright.locator('.pcard').filter({hasText:'2x > 8 OR x + 1 < -2'});
  await inequality.getByRole('textbox').fill('x >= 3.2');
  await union.getByRole('textbox').fill('x > 4 and x < -3');
  await tab.playwright.getByRole('button',{name:'✓ Submit test',exact:true}).click();await tab.playwright.domSnapshot();
  await inequality.locator('.fb').waitFor({state:'visible'});
  check('correct inequality accepted',(await inequality.innerText()).includes('✓ Correct!'));
  check('AND answer rejected for OR question',(await union.innerText()).includes('✗ Answer:'));
  await tab.goto(origin+'/unit12.html');await tab.reload();await tab.playwright.domSnapshot();await section('Practice Test');
  // Locate by the visible table if its wording changes slightly.
  const tableCards=await tab.playwright.locator('.pcard').all();let tested=false;
  for(const card of tableCards){const text=await card.innerText();
    const m=text.match(/y=(\d+),(\d+),(\d+)/);if(m&&/equation/i.test(text)){const a=+m[1],b=+m[2]/a;await card.getByRole('textbox').fill(`y=${a}(${b}^x)`);tested=true;}
  }
  check('exponential table questions present',tested);
  await tab.playwright.getByRole('button',{name:'✓ Submit test',exact:true}).click();await tab.playwright.domSnapshot();
  await tab.playwright.locator('#rbtn').waitFor({state:'visible'});
  for(const text of await tab.playwright.locator('#tlist .pcard').allTextContents()){if(/y=\d+,\d+,\d+/.test(text)&&/equation/i.test(text))check('caret exponential accepted: '+text,text.includes('✓ Correct!'));}
  await tab.goto(origin+'/unit16.html');await tab.reload();await tab.playwright.domSnapshot();await section('Practice Test');
  const noRoots=tab.playwright.locator('.pcard').filter({hasText:'x = ___ or'});
  await noRoots.getByRole('textbox').fill('no real solutions');
  await tab.playwright.getByRole('button',{name:'✓ Submit test',exact:true}).click();await tab.playwright.domSnapshot();
  await noRoots.locator('.fb').waitFor({state:'visible'});
  check('requested plural phrase accepted',(await noRoots.innerText()).includes('✓ Correct!'));
  await tab.goto(origin+'/unit15.html');await tab.reload();await tab.playwright.domSnapshot();
  await tab.playwright.getByRole('button',{name:'Practice topic 15.1',exact:true}).press('Enter');await tab.playwright.domSnapshot();
  check('keyboard practice shortcut opens practice',await tab.playwright.getByRole('tab',{name:'Practice',exact:true}).getAttribute('aria-selected')==='true');
  check('keyboard shortcut does not open notes modal',!(await tab.playwright.getByRole('button',{name:'✕ Close',exact:true}).isVisible()));
  await tab.goto(origin+'/unit5.html');await tab.reload();await tab.playwright.domSnapshot();await section('Practice');
  const practice=await tab.playwright.locator('#plist .pcard').all();let usedHint=false;
  for(const card of practice){
    const question=await card.locator('.pq-q').innerText();
    const eq=((await card.locator('.pmath').getAttribute('data-math-source')) || (await card.locator('.pmath').innerText())).replace(/[−–]/g,'-').replace(/\s+/g,'');
    let value,m;
    if((m=question.match(/Is x = (-?\d+) a solution/))){const x=+m[1];const r=eq.match(/^(-?\d+)x([+-]\d+)=(-?\d+)$/);if(!r)throw Error('Unsupported fixture equation '+eq);value=+r[1]*x+(+r[2])===+r[3]?'yes':'no';}
    else if((m=eq.match(/^x([+-]\d+)=(-?\d+)$/)))value=String(+m[2]-(+m[1]));
    else if((m=eq.match(/^(-?\d+)x=(-?\d+)$/)))value=String(+m[2]/+m[1]);
    else if((m=eq.match(/^x[÷/](\d+)=(-?\d+)$/)))value=String(+m[1]*+m[2]);
    else throw Error('Unsupported fixture equation '+eq);
    if(!usedHint){await card.getByRole('button',{name:/Hint/}).click();await tab.playwright.domSnapshot();check('hint use recorded on question',await tab.playwright.locator('#pc0').getAttribute('data-hint-used')==='true');usedHint=true;}
    await card.getByRole('textbox').fill(value);await card.getByRole('button',{name:'Check',exact:true}).click();await tab.playwright.domSnapshot();
  }
  await tab.playwright.locator('#p-results').waitFor({state:'visible'});
  const practiceResult=await tab.playwright.locator('#p-results').innerText();
  check('guided practice distinguished from independent first try',practiceResult.includes('First try without hints: 4/5')&&practiceResult.includes('Final correct, including retries: 5/5'));
  await tab.goto(origin+'/index.html');await tab.reload();await tab.playwright.domSnapshot();
  const unit5=await tab.playwright.locator('.unit-card[href="unit5.html"]').innerText();
  check('homepage uses all four practice topics',unit5.includes('1/4 topics strong')&&unit5.includes('9%'));
  return results;
}
