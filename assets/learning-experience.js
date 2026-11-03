(function(){
 'use strict';
 var W=window,G=W.Alg1Graphs,M=W.Alg1Math,focusBeforeGraph=null,graphRange=6;
 function $(s,r){return (r||document).querySelector(s);}function $$(s,r){return Array.from((r||document).querySelectorAll(s));}
 function hook(name,after){var before=W[name];if(typeof before!=='function')return;W[name]=function(){var result=before.apply(this,arguments);after.apply(this,arguments);return result;};}
 function problem(card){var m=/^([pt])c(\d+)$/.exec(card.id);if(!m)return null;return (m[1]==='p'?(typeof pset!=='undefined'?pset:[]):(typeof tset!=='undefined'?tset:[]))[+m[2]];}
 function mathNode(n){
  if(n.op==='num')return n.r[1]===1n?'<mn>'+n.r[0]+'</mn>':'<mfrac><mn>'+n.r[0]+'</mn><mn>'+n.r[1]+'</mn></mfrac>';
  if(n.op==='var')return '<mi>'+n.name+'</mi>';
  if(n.op==='neg')return '<mrow><mo>−</mo>'+(['+','-'].includes(n.a.op)?'<mo>(</mo>'+mathNode(n.a)+'<mo>)</mo>':mathNode(n.a))+'</mrow>';
  if(n.op==='sqrt')return '<msqrt>'+mathNode(n.a)+'</msqrt>';
  if(n.op==='/')return '<mfrac>'+mathNode(n.a)+mathNode(n.b)+'</mfrac>';
  if(n.op==='^')return '<msup><mrow>'+((['+','-','neg','*','/'].includes(n.a.op))?'<mo>(</mo>'+mathNode(n.a)+'<mo>)</mo>':mathNode(n.a))+'</mrow>'+mathNode(n.b)+'</msup>';
  function group(x){return ['+','-','neg'].includes(x.op)?'<mrow><mo>(</mo>'+mathNode(x)+'<mo>)</mo></mrow>':mathNode(x);}
  if(n.op==='*')return '<mrow>'+group(n.a)+'<mo>'+(n.a.op==='num'&&n.b.op==='num'?'·':'&#x2062;')+'</mo>'+group(n.b)+'</mrow>';
  return '<mrow>'+mathNode(n.a)+'<mo>'+(n.op==='-'?'−':'+')+'</mo>'+(n.op==='-'&&['+','-'].includes(n.b.op)?'<mo>(</mo>'+mathNode(n.b)+'<mo>)</mo>':mathNode(n.b))+'</mrow>';
 }
 function typeset(source){
  var s=M.clean(source);if(/[a-z]{2,}|\b[fghk]\(|[,;]|[!?]/.test(s))return null;
  try{var pieces=s.split(/(<=|>=|=|<|>)/),out='';for(var i=0;i<pieces.length;i++){if(i%2)out+='<mo>'+G.escape(pieces[i].replace('<=','≤').replace('>=','≥'))+'</mo>';else out+=mathNode(M.parse(pieces[i].replace(/\s+/g,'')));}return '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow>'+out+'</mrow></math>';}catch(e){return null;}
 }
 function cards(){
  $$('#plist .pcard,#tlist .pcard').forEach(function(card){var p=problem(card);if(!p)return;
   if(p.eq&&!card.dataset.typeset){var eq=$('.pmath',card),html=typeset(p.eq);if(eq&&html){eq.innerHTML=html;eq.setAttribute('data-math-source',M.clean(p.eq));}card.dataset.typeset='true';}
   if(p.graph&&!$('.a1-graph-figure',card)){var old=$('svg',card);if(old){var parent=old.parentElement;if(parent!==card&&parent.childElementCount===1)parent.remove();else old.remove();}$('.pq-q',card).insertAdjacentHTML('afterend',G.figure(p.graph));}
   if(p.answerFields&&!card.dataset.fields){
    var original=$('.ai',card);if(!original)return;original.type='hidden';original.setAttribute('aria-hidden','true');
    var fieldset=document.createElement('fieldset');fieldset.className='a1-answer-fields';var legend=document.createElement('legend');legend.textContent='Your answers';fieldset.appendChild(legend);
    p.answerFields.forEach(function(f,i){var label=document.createElement('label'),text=document.createElement('span'),input=document.createElement('input');text.textContent=f.label;input.type='text';input.id=original.id+'-field-'+i;input.autocomplete='off';input.spellcheck=false;input.setAttribute('data-field-key',f.key);label.append(text,input);fieldset.appendChild(label);
     input.addEventListener('input',function(){original.value=Array.from(fieldset.querySelectorAll('input')).map(function(el,j){return p.answerFields[j].key+'='+el.value;}).join(', ');});
     input.addEventListener('keydown',function(e){if(e.key==='Enter'&&card.id[0]==='p'){e.preventDefault();W.check(+card.id.slice(2),'p');}});
    });original.before(fieldset);card.dataset.fields='true';
   }
   $$('.a1-answer-fields input',card).forEach(function(input){input.disabled=$('.ai',card).disabled;});
  });
  var meta=$('#pmeta');if(meta&&typeof BANKS!=='undefined'&&typeof curTopic!=='undefined'&&BANKS[curTopic]&&typeof pset!=='undefined')meta.textContent='Showing '+pset.length+' of '+BANKS[curTopic].length+' questions · '+curTopic;
 }
 function plain(el){return el.textContent.replace(/\s+/g,' ').trim();}
 function practiceTag(tag){return typeof UNIT!=='undefined'&&String(UNIT.id)==='1-4'?'unit'+tag.split('.')[0]:tag;}
 function jumpToPractice(tag){if(W.closeTopic)W.closeTopic();var tab=$('#tab-practice');if(tab)tab.click();var target=$$('.tpbtn').find(function(b){return (b.getAttribute('onclick')||'').includes("'"+practiceTag(tag)+"'");});if(target)target.click();var first=$('#plist input:not([type=hidden])');if(first)first.focus();}
 function noteGraphs(body,tag){
  var specs=(W.Alg1NoteGraphs||{})[tag];if(!specs)return;
  var originals=$$('svg',body).filter(function(s){return !s.closest('.a1-graph-figure');});
  originals.forEach(function(svg,i){var spec=specs[i];if(!spec){svg.remove();return;}spec=Object.assign({},spec,{range:spec.bounds||[-6,6,-6,6]});var div=document.createElement('div');div.innerHTML=G.figure(spec,{showExpressions:true,title:spec.illustrative?'Concept illustration':'Worked-example graph',table:true});var fig=div.firstElementChild;svg.replaceWith(fig);var host=fig.parentElement;host.style.removeProperty('width');host.style.removeProperty('height');if(host.classList.contains('a1-diagram')){host.style.removeProperty('display');host.classList.add('a1-redrawn-diagram');}
  });
  if(specs.length>originals.length){var last=$$('.a1-graph-figure',body).pop();for(var i=originals.length;i<specs.length;i++){var spec=Object.assign({},specs[i],{range:specs[i].bounds||[-6,6,-6,6]});if(last){last.insertAdjacentHTML('afterend',G.figure(spec,{showExpressions:true,title:'Compare the graphs',table:true}));last=last.nextElementSibling;}}}
 }
 function lessonGraphs(body){
  $$('[data-lesson-graph]',body).forEach(function(el){el.innerHTML=G.figure({expressions:['y=2(x-1)(x-5)'],points:[[1,0],[3,-8],[5,0]],range:[-7,9,-10,6],axisOfSymmetry:3,description:'The curve meets the x-axis at (1,0) and (5,0), and turns at (3,-8). The vertical dashed guide runs through x=3.'},{showExpressions:true,title:'Read the zeros, axis and vertex',table:true});});
  $$('[data-quadratic-explorer]',body).forEach(function(el){
   el.className='a1-quadratic-explorer';el.innerHTML='<div class="a1-explorer-controls">'+[['a','Vertical scale',-3,3,.5,1],['h','Horizontal shift',-4,4,.5,0],['k','Vertical shift',-4,4,.5,0]].map(function(f){return '<label>'+f[1]+' <output data-value="'+f[0]+'">'+f[5]+'</output><input type="range" aria-label="'+f[1]+'" data-parameter="'+f[0]+'" min="'+f[2]+'" max="'+f[3]+'" step="'+f[4]+'" value="'+f[5]+'"></label>';}).join('')+'</div><div class="a1-explorer-plot"></div><p class="a1-explorer-status" aria-live="polite"></p>';
   function draw(){var v={};$$('input',el).forEach(function(input){var key=input.dataset.parameter;v[key]=+input.value;$('[data-value='+key+']',el).textContent=key+' = '+input.value;});var expr='y='+v.a+'(x'+(v.h<0?'+':'-')+Math.abs(v.h)+')^2'+(v.k<0?'-':'+')+Math.abs(v.k);$('.a1-explorer-plot',el).innerHTML=G.figure({expressions:['y=x^2',expr],points:[[v.h,v.k]],description:'The purple curve is the parent y=x squared. The teal curve is the transformed relation, with its marked point at ('+v.h+', '+v.k+').',range:[-6,6,-6,6]},{showExpressions:true,table:true});$('.a1-explorer-status',el).textContent=v.a===0?'a = 0: the graph is the horizontal line y = '+v.k+'. It is no longer quadratic.':'Vertex ('+v.h+', '+v.k+'). Opens '+(v.a>0?'upward':'downward')+'. '+(Math.abs(v.a)>1?'Vertically stretched compared with the parent.':Math.abs(v.a)<1?'Vertically compressed compared with the parent.':'Same vertical scale as the parent.');}
   $$('input',el).forEach(function(input){input.addEventListener('input',draw);});draw();
  });
 }
 function note(index){
  var body=$('#modal-body'),tag=plain($('#modal-tag'));if(!body)return;
  var footer=$('.a1-note-foot',body),supplement=(W.Alg1LessonSupplements||{})[tag];
  if(supplement){var box=document.createElement('section');box.className='a1-lesson-extension';box.innerHTML=supplement;if(footer)footer.before(box);else body.appendChild(box);}
  var cross=(W.Alg1SourceCrosswalk||{})[tag];if(cross){var p=document.createElement('p');p.className='a1-source-crosswalk';p.textContent=cross;var nav=$('.a1-note-nav',body);if(nav)nav.after(p);else body.prepend(p);}
  noteGraphs(body,tag);lessonGraphs(body);
  $$('.a1-squish',body).forEach(function(figure){
   var buttons=$$('button[data-axis]',figure);
   buttons.forEach(function(button){button.addEventListener('click',function(){
    var domain=button.dataset.axis==='x';
    buttons.forEach(function(key){key.setAttribute('aria-pressed',String(key===button));});
    $('.a1-squish-x',figure).toggleAttribute('hidden',!domain);
    $('.a1-squish-y',figure).toggleAttribute('hidden',domain);
    $('[role=status]',figure).textContent=domain?'Domain = {1, 2, 3}. All three x-values are used.':'Range = {1, 3}. The two points at y = 3 share one output.';
   });});
  });
  $$('.a1-eq, .a1-lesson-extension .eq',body).forEach(function(row){
   // Keep labels, existing fractions, and explanatory text in their original markup.
   if(row.childElementCount)return;
   var formatted=typeset(plain(row));
   if(formatted)row.innerHTML=formatted;
  });
  $$('.a1-note table, .a1-lesson-extension table',body).forEach(function(table){
   if(table.closest('.a1-graph-figure'))return;
   var frame=document.createElement('div');
   frame.className='a1-note-table';
   table.before(frame);
   frame.appendChild(table);
  });
  $$('svg:not(.a1-coordinate-plot):not([role=img])',body).forEach(function(svg){var labels=$$('text',svg).map(plain).join('; ');svg.setAttribute('role','img');svg.setAttribute('aria-label','Instructional diagram: '+labels);svg.removeAttribute('width');svg.removeAttribute('height');});
  $$('img',body).forEach(function(img){var figure=img.closest('figure');if(!figure)return;var details=document.createElement('details');details.className='a1-source-scan';var summary=document.createElement('summary');summary.textContent='View the original packet illustration';figure.before(details);details.append(summary,figure);});
  var reflection=document.createElement('section');reflection.className='a1-reflection';reflection.innerHTML='<h3>Reread, summarize, and reflect</h3><p>Explain the main rule in your own words. Show one example, then describe a mistake someone might make and how to catch it. Try the next practice set without a hint.</p>';if(footer)footer.before(reflection);else body.appendChild(reflection);
  var oldPractice=$('#a1-note-practice');if(!oldPractice&&footer){var button=document.createElement('button');button.type='button';button.className='a1-cta primary';button.textContent='Practice '+practiceTag(tag)+' →';button.addEventListener('click',function(){jumpToPractice(tag);});$('.a1-note-foot-btns',footer).prepend(button);}
  var header=$('.topic-modal-header'),meta=$('.a1-note-meta',header);if(meta)meta.remove();meta=document.createElement('div');meta.className='a1-note-meta';var words=plain(body).split(/\s+/).length;meta.textContent='Learning notes · About '+Math.max(2,Math.ceil(words/170))+' minutes · Examples + practice';header.appendChild(meta);
  var paging=$('.a1-note-pagination',header);if(paging)paging.remove();paging=document.createElement('div');paging.className='a1-note-pagination';var count=$$('.tg-card').length;[['← Previous',index-1],['Next →',index+1]].forEach(function(pair){var b=document.createElement('button');b.type='button';b.textContent=pair[0];b.disabled=pair[1]<0||pair[1]>=count;b.addEventListener('click',function(){W.openTopic(pair[1]);});paging.appendChild(b);});meta.appendChild(paging);
  $$('.joke',body).forEach(function(joke){var details=document.createElement('details');details.className='a1-aside';var summary=document.createElement('summary');summary.textContent='A lighter moment';joke.before(details);details.append(summary,joke);joke.classList.remove('a1-aside');});
  // Include supplemental headings in the existing reading index.
  var nav=$('.a1-note-nav',body);if(nav)$$('.a1-lesson-extension .note-h',body).forEach(function(h,i){h.id='a1-extra-'+i;var a=document.createElement('a');a.href='#'+h.id;a.textContent=plain(h);a.addEventListener('click',function(e){e.preventDefault();body.scrollTop+=h.getBoundingClientRect().top-body.getBoundingClientRect().top-nav.offsetHeight-12;});nav.appendChild(a);});
  body.scrollTop=0;
 }
 function workspace(){
  var modal=$('.desmos-modal');
  if(!modal){var trigger=document.createElement('button');trigger.type='button';trigger.id='desmos-trigger';trigger.className='desmos-trigger';trigger.textContent='Open graphing workspace';trigger.addEventListener('click',function(){W.openDesmos();});document.body.appendChild(trigger);var overlay=document.createElement('div');overlay.id='desmos-overlay';overlay.className='desmos-overlay';overlay.innerHTML='<div class="desmos-modal"><div class="desmos-modal-header"><span class="desmos-modal-title">Graphing workspace</span><button type="button" class="desmos-close">× Close</button></div></div>';document.body.appendChild(overlay);modal=$('.desmos-modal');$('.desmos-close',modal).addEventListener('click',function(){W.closeDesmos();});overlay.addEventListener('click',function(e){if(e.target===overlay)W.closeDesmos();});}
  var frame=$('#desmos-iframe');if(frame)frame.remove();
  var title=$('.desmos-modal-title',modal);if(title)title.textContent='Graphing workspace';
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Graphing workspace');var area=document.createElement('div');area.className='a1-workspace';
  area.innerHTML='<form class="a1-workspace-tools"><label for="a1-graph-input">Equations and inequalities</label><textarea id="a1-graph-input" spellcheck="false" aria-describedby="a1-graph-help">y = x^2</textarea><p id="a1-graph-help">Use one relation per line. Enter up to four equations or inequalities. Use the symbols below or type your own.</p><button type="submit">Plot the graph</button><p>Start with a familiar shape</p><div class="a1-workspace-presets">'+[['Line','y = 2x + 1'],['Quadratic','y = (x - 2)^2 - 1'],['Exponential','y = 2^x'],['System','y = x + 1\ny = -x + 3'],['Circle','x^2 + y^2 = 25'],['Inequality','y >= x - 1']].map(function(p){return '<button type="button" data-preset="'+G.escape(p[1])+'">'+p[0]+'</button>';}).join('')+'</div><p>Everything plots here on this site. No account or external calculator is needed.</p></form><section class="a1-workspace-plot" aria-label="Graph result"><div class="a1-workspace-status" role="status"></div><div class="a1-workspace-zoom"><button type="button" data-zoom="in" aria-label="Zoom in on graph">Zoom in</button><button type="button" data-zoom="out" aria-label="Zoom out on graph">Zoom out</button><button type="button" data-zoom="reset">Reset view</button></div><div id="a1-workspace-canvas"></div><div class="a1-graph-evaluate"><label for="a1-graph-x">Trace at x = </label><input id="a1-graph-x" type="number" step="0.5" value="0"><output id="a1-graph-trace" aria-live="polite"></output></div></section>';
  modal.appendChild(area);var input=$('#a1-graph-input'),status=$('.a1-workspace-status',area);
  var keypad=document.createElement('div');
  keypad.className='a1-math-keypad';
  keypad.setAttribute('role','group');
  keypad.setAttribute('aria-label','Insert math symbols');
  [
   ['x','x','Insert x'], ['y','y','Insert y'], ['−','-','Minus'],
   ['×','*','Multiply'], ['÷','/','Divide'], ['x²','^2','Square'],
   ['xⁿ','^','Raise to a power'], ['√','sqrt()','Square root',1],
   ['( )','()','Parentheses',1], ['=','=','Equals'], ['<','<','Less than'],
   ['>','>','Greater than'], ['≤','<=','Less than or equal to'], ['≥','>=','Greater than or equal to']
  ].forEach(function(key){
   var button=document.createElement('button');
   button.type='button';
   button.textContent=key[0];
   button.title=key[2];
   button.setAttribute('aria-label',key[2]);
   button.addEventListener('click',function(){
    var caret=input.selectionStart+key[1].length-(key[3]||0);
    input.setRangeText(key[1],input.selectionStart,input.selectionEnd);
    input.focus();
    input.setSelectionRange(caret,caret);
   });
   keypad.appendChild(button);
  });
  input.after(keypad);
  function expressions(){return input.value.split(/[\n;,]+/).map(function(x){return x.trim();}).filter(Boolean);}
  function trace(){var result=[];try{expressions().forEach(function(e,i){var r=G.relation(e);if(r.explicit){var x=+$('#a1-graph-x').value,y=M.evaluateNode(r.explicit,{x:x});result.push('Relation '+(i+1)+': ('+x+', '+(Math.round(y*1000)/1000)+')');}});$('#a1-graph-trace').textContent=result.join(' · ')||'Use a relation in y = … form to trace a value.';}catch(e){$('#a1-graph-trace').textContent='The relation is undefined at this x-value.';}}
  function plot(){try{var es=expressions();if(!es.length||es.length>4)throw Error('Enter between one and four relations.');var spec={expressions:es,range:[-graphRange,graphRange,-graphRange,graphRange],description:'Coordinate graph of the entered relations. Both axes have equal-sized units.'};var figure=G.figure(spec,{showExpressions:true,table:true});$('#a1-workspace-canvas').innerHTML=figure;$$('.a1-graph-legend span',area).forEach(function(label){
   var formatted=typeset(label.textContent);
   if(formatted)label.innerHTML=formatted.replace('display="block"','display="inline"');
  });status.classList.remove('error');status.textContent=es.length+' relation'+(es.length===1?'':'s')+' plotted · equal-sized coordinate units';trace();}catch(e){status.classList.add('error');status.textContent=e.message;}}
  $('form',area).addEventListener('submit',function(e){e.preventDefault();plot();});$$('[data-preset]',area).forEach(function(b){b.addEventListener('click',function(){input.value=b.dataset.preset;graphRange=6;plot();});});$$('[data-zoom]',area).forEach(function(b){b.addEventListener('click',function(){graphRange=b.dataset.zoom==='reset'?6:Math.max(1.5,Math.min(48,graphRange*(b.dataset.zoom==='in'?.75:1.5)));plot();});});$('#a1-graph-x').addEventListener('input',trace);
  function open(encoded){focusBeforeGraph=document.activeElement;if(encoded){input.value=decodeURIComponent(encoded).split(',').join('\n');graphRange=6;}$('#desmos-overlay').classList.add('open');document.body.style.overflow='hidden';plot();input.focus();}
  W.openDesmos=function(){open();};W.openDesmosWithEq=function(encoded){open(encoded);};W.closeDesmos=function(){$('#desmos-overlay').classList.remove('open');document.body.style.overflow=$('#topic-overlay.open')?'hidden':'';if(focusBeforeGraph&&focusBeforeGraph.isConnected)focusBeforeGraph.focus();};
  modal.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();W.closeDesmos();}if(e.key==='Tab'){var controls=$$('button,input,textarea,summary',modal).filter(function(x){return !x.disabled&&x.offsetParent!==null;});if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls[controls.length-1].focus();}else if(!e.shiftKey&&document.activeElement===controls[controls.length-1]){e.preventDefault();controls[0].focus();}}});
  var trigger=$('#desmos-trigger');if(trigger){trigger.textContent='Open graphing workspace';if($('.a1-home-actions'))trigger.remove();}
 }
 function home(){var heading=$('.page-title'),sub=$('.page-sub');if(!heading||!sub)return;heading.textContent='Your Algebra 1 workspace';sub.textContent='Choose a unit to review class notes, see worked examples, and practice for your next quiz or test.';var intro=document.createElement('section');intro.className='a1-home-intro';var copy=document.createElement('div');heading.before(intro);intro.appendChild(copy);var kicker=document.createElement('p');kicker.className='a1-home-kicker';kicker.textContent='Niles North · Course companion';copy.append(kicker,heading,sub);var actions=document.createElement('div');actions.className='a1-home-actions';var units=document.createElement('a');units.href='#course-units';units.textContent='Browse units';var graph=document.createElement('button');graph.type='button';graph.textContent='Open graphing workspace';graph.addEventListener('click',function(){W.openDesmos();});actions.append(units,graph);copy.appendChild(actions);$('.grid').id='course-units';var art=document.createElement('div');art.className='a1-home-art';art.setAttribute('aria-hidden','true');art.innerHTML=G.svg({expressions:['y=(x-1)^2-2','y=x+1'],points:[[1,-2]],range:[-5,5,-5,5],description:'Decorative algebra graph'});intro.appendChild(art);var foot=document.createElement('div');foot.className='a1-home-footer';foot.innerHTML='<p>Read → Explore → Practice → Reflect</p><p>Study progress is guidance, not a course grade.</p>';$('.main').appendChild(foot);}
 function init(){var unitNav=$('#unit-nav');if(unitNav){unitNav.setAttribute('role','navigation');unitNav.setAttribute('aria-label','Course units');var allUnits=$('a',unitNav);allUnits.textContent='All units';var current=$('.np.on',unitNav);if(current)current.setAttribute('aria-current','page');}$$('.topic-modal-close').forEach(function(b){b.setAttribute('aria-label','✕ Close');});home();workspace();hook('openTopic',note);['loadP','loadT','sw','selTopic','check','chk','gradeT'].forEach(function(n){hook(n,cards);});cards();
  // Foundation notes map to grouped practice banks, without relabeling source topics.
  if(typeof UNIT!=='undefined'&&String(UNIT.id)==='1-4')$$('.tg-card').forEach(function(card){if($('.a1-tg-practice',card))return;var tag=plain($('.tg-tag',card));var b=document.createElement('button');b.type='button';b.className='a1-tg-practice';b.textContent='Practice this';b.setAttribute('aria-label','Practice topic '+tag);b.addEventListener('click',function(e){e.stopPropagation();jumpToPractice(tag);});card.appendChild(b);});
 }
 W.Alg1Typeset=typeset;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
