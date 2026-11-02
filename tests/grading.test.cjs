const {test}=require('node:test');const assert=require('node:assert/strict');
const math=require('../assets/math-engine.js');const {units}=require('../scripts/content.cjs');
const cases=[
 ['exponential caret','y=5(3^x)','y=5(3^x)',true],
 ['linear is not exponential','y=5(3x)','y=5(3^x)',false],
 ['HTML power conversion','x^2','x<sup>2</sup>',true],
 ['multiplication is not power','x2','x<sup>2</sup>',false],
 ['logical union','x > 4 or x < -3','x>4 or x<-3',true],
 ['union reordered','x < -3 or x > 4','x>4 or x<-3',true],
 ['AND cannot replace OR','x > 4 and x < -3','x>4 or x<-3',false],
 ['chain equivalence','x>-1 and x<3','-1<x<3',true],
 ['open endpoint','-1<=x<3','-1<x<3',false],
 ['fraction endpoint','x>=3.2','x>=16/5',true],
 ['wrong endpoint','x>=1.6','x>=16/5',false],
 ['wrong variable','y=7','x=7',false],
 ['implicit variable','7','x=7',true],
 ['singular/plural','no real solutions','no real solution',true],
 ['PM roots','x=±5','x=5 or x=-5',true],
 ['one root missing','5','x=5 or x=-5',false],
 ['root decimal ordering','3.732,0.268','x=2+√3 or x=2-√3',true,{absoluteTolerance:.0005}],
 ['root decimal without policy','3.732,0.268','x=2+√3 or x=2-√3',false],
 ['bad approximation','3.73,0.27','x=2+√3 or x=2-√3',false,{absoluteTolerance:.0005}],
 ['sqrt keyboard','2+sqrt(3),2-sqrt(3)','x=2+√3 or x=2-√3',true],
 ['large powers differ','(x+2)^9','(x+2)^8',false],
 ['factor order','(x+3)(x+2)','(x+2)(x+3)',true,{answerForm:'factored'}],
 ['factor task requires factors','x^2+5x+6','(x+2)(x+3)',false,{answerForm:'factored'}],
 ['partial factorization','2(x^2-1)','2(x-1)(x+1)',false,{answerForm:'factored'}],
 ['GCF incomplete','3(x^2+x)','3x(x+1)',false,{answerForm:'factored'}],
 ['GCF accepts further correct factoring','4x(x+1)(3x-1)','4x(3x^2+2x-1)',true,{answerForm:'gcf'}],
 ['GCF must include common variable','4(3x^3+2x^2-x)','4x(3x^2+2x-1)',false,{answerForm:'gcf'}],
 ['factor signs','(-x+1)(-x-1)','(x-1)(x+1)',true,{answerForm:'factored'}],
 ['expansion requires expansion','(x+2)(x+3)','x^2+5x+6',false,{answerForm:'expanded'}],
 ['like terms uncombined','x+x','2x',false,{answerForm:'expanded'}],
 ['variable products uncombined','x*x+x','x^2+x',false,{answerForm:'expanded'}],
 ['reduced fraction','2/4','1/2',false,{answerForm:'reduced'}],
 ['equation fraction need not be reduced','x=2/4','x=1/2',true],
 ['pair preserves order','(4,3)','(3,4)',false],
 ['named pair','y=4,x=3','(3,4)',true],
 ['unary minus precedence','-3^2','-9',true],
 ['parentheses change sign','(-3)^2','-9',false],
 ['negative exponent','x^-4','1/x^4',true],
 ['domain-changing cancellation','x/x','1',false],
 ['zero expansion','0.0','0',true,{answerForm:'expanded'}],
 ['invalid expression','x***2','x^2',false],
 ['script is not math','alert(1)','1',false],
 ['empty answer','','0',false]
];
for(const [name,input,key,expected,policy] of cases)test(name,()=>assert.equal(math.matches(input,key,policy),expected));
for(const unit of units())test(unit.file+' answer-key and input round trips',()=>{
 for(const p of Object.values(unit.banks).flat().concat(unit.test)){
  assert.ok(!/<\/?\w/.test(p.a),'answer key must be plain math: '+p.a);
  assert.ok(math.matches(p.a,p.a,p),'canonical answer rejected: '+JSON.stringify(p));
  const student=p.a.replace(/\^\((-?\d+)\)/g,'^$1');
  assert.ok(math.matches(student,p.a,p),'caret answer rejected: '+student);
 }
});
test('superscript markup cannot swallow adjacent factors',()=>{
 for(const unit of units())for(const p of Object.values(unit.banks).flat().concat(unit.test,unit.vocabulary)){
  for(const field of ['q','eq','h'])for(const m of (p[field]||'').matchAll(/<sup>(.*?)<\/sup>/g))assert.match(m[1],/^(?:-?\d+|[a-z]|n|−\d+)$/,unit.file+' '+field+': '+m[0]);
 }
});
