/* Mathematical answers are data, never JavaScript. No eval and no sampled-x tests.
   Polynomial identities use exact rational coefficients; approximations are opt-in. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Alg1Math = api;
})(typeof window === 'undefined' ? this : window, function () {
  'use strict';
  function clean(value) {
    var s = String(value == null ? '' : value);
    s = s.replace(/<sup>(.*?)<\/sup>/gi, '^($1)')
      .replace(/<br\s*\/?\s*>/gi, ' ')
      .replace(/<\/?(?:span|strong|em|b|i)\b[^>]*>/gi, '');
    var entities = {minus:'-',times:'*',divide:'/',middot:'*',sdot:'*',nbsp:' ',le:'<=',ge:'>=',ne:'!=',radic:'√',plusmn:'±',sup1:'^1',sup2:'^2',sup3:'^3',frasl:'/',amp:'&'};
    s = s.replace(/&([a-z0-9]+);/gi, function (m,k) {return entities[k.toLowerCase()] || m;})
      .replace(/&#(x[0-9a-f]+|\d+);/gi, function (_, n) { return String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):+n); });
    var supers = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, function(run) {return '^('+Array.from(run).map(function(c){return c==='⁻'?'-':c==='⁺'?'+':supers.indexOf(c);}).join('')+')';});
    return s.toLowerCase().replace(/[−–—]/g,'-').replace(/[×⋅·∙]/g,'*').replace(/÷/g,'/')
      .replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/≠/g,'!=').replace(/∞/g,'inf')
      .replace(/=</g,'<=').replace(/=>/g,'>=').trim();
  }
  function norm(s) {return clean(s).replace(/\s+/g,'');}
  function gcd(a,b) {a=a<0n?-a:a;b=b<0n?-b:b;while(b){var t=b;b=a%b;a=t;}return a||1n;}
  function rat(n,d) {d=d===undefined?1n:d;if(!d)throw Error('division by zero');if(d<0n){n=-n;d=-d;}var g=gcd(n,d);return [n/g,d/g];}
  function decimal(s) {var a=s.split('.');return rat(BigInt(a.join('')||'0'),10n**BigInt((a[1]||'').length));}
  function add(a,b) {return rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);}
  function mul(a,b) {return rat(a[0]*b[0],a[1]*b[1]);}
  function rkey(r) {return r[0]+'/'+r[1];}
  function parse(source) {
    if(source.length>500)throw Error('expression too long');
    var tokens=[],re=/\s*(sqrt|\d*\.\d+|\d+|[a-z]|[+\-*/^()%√])/gy,m,pos=0;
    while(pos<source.length){re.lastIndex=pos;m=re.exec(source);if(!m)throw Error('unsupported expression');tokens.push(m[1]);pos=re.lastIndex;}
    var at=0,depth=0;
    function take(){return tokens[at++];}
    function primary(){
      if(++depth>40)throw Error('nesting limit');
      var t=take(),node;
      if(t==='('){node=sum();if(take()!==')')throw Error('missing parenthesis');}
      else if(t==='sqrt'||t==='√'){node={op:'sqrt',a:primary()};}
      else if(t&&/^(\d|\.)/.test(t))node={op:'num',r:decimal(t)};
      else if(t&&/^[a-z]$/.test(t))node={op:'var',name:t};
      else throw Error('expected value');
      if(tokens[at]==='%'){at++;node={op:'/',a:node,b:{op:'num',r:rat(100n)}};}
      depth--;return node;
    }
    function power(){var a=primary();if(tokens[at]==='^'){at++;a={op:'^',a:a,b:unary()};}return a;}
    function unary(){if(tokens[at]==='+'){at++;return unary();}if(tokens[at]==='-'){at++;return {op:'neg',a:unary()};}return power();}
    function product(){var a=unary();while(at<tokens.length){var t=tokens[at];if(t==='*'||t==='/'){at++;a={op:t,a:a,b:unary()};}else if(t==='('||t==='sqrt'||t==='√'||/^[a-z]$/.test(t||'')){a={op:'*',a:a,b:unary()};}else break;}return a;}
    function sum(){var a=product();while(tokens[at]==='+'||tokens[at]==='-'){var t=take();a={op:t,a:a,b:product()};}return a;}
    var result=sum();if(at!==tokens.length)throw Error('unexpected token');return result;
  }
  function constant(n) {
    if(n.op==='num')return Number(n.r[0])/Number(n.r[1]);
    if(n.op==='var')throw Error('not constant');
    var a=constant(n.a),b=n.b?constant(n.b):0;
    var v=n.op==='neg'?-a:n.op==='sqrt'?Math.sqrt(a):n.op==='+'?a+b:n.op==='-'?a-b:n.op==='*'?a*b:n.op==='/'?a/b:n.op==='^'?Math.pow(a,b):NaN;
    if(!Number.isFinite(v))throw Error('non-real value');return v;
  }
  // A monomial key is a sorted list of variable powers. Negative powers are
  // retained, so domain-changing cancellation is never used to prove constants.
  function monokey(vars){return Object.keys(vars).sort().filter(function(k){return vars[k]!==0;}).map(function(k){return k+':'+vars[k];}).join(',');}
  function vars(key){var out={};if(key)key.split(',').forEach(function(p){var a=p.split(':');out[a[0]]=+a[1];});return out;}
  function merge(a,b){var p=vars(a);Object.entries(vars(b)).forEach(function(e){p[e[0]]=(p[e[0]]||0)+e[1];});return monokey(p);}
  function pAdd(a,b,sign){var o=Object.assign({},a);Object.keys(b).forEach(function(k){o[k]=add(o[k]||rat(0n),mul(b[k],rat(BigInt(sign))));if(!o[k][0])delete o[k];});return o;}
  function pMul(a,b){var o={};Object.keys(a).forEach(function(x){Object.keys(b).forEach(function(y){var k=merge(x,y);o[k]=add(o[k]||rat(0n),mul(a[x],b[y]));if(!o[k][0])delete o[k];});});if(Object.keys(o).length>100)throw Error('polynomial limit');return o;}
  function polynomial(n){
    if(n.op==='num')return n.r[0]?{'':n.r}:{};
    if(n.op==='var'){var o={};o[n.name+':1']=rat(1n);return o;}
    var a=polynomial(n.a);
    if(n.op==='neg')return pMul({'':rat(-1n)},a);
    if(n.op==='sqrt')throw Error('radical');
    if(n.op==='^'){
      var e=constant(n.b);if(!Number.isInteger(e)||Math.abs(e)>32)throw Error('unsupported power');
      if(e<0){var ks=Object.keys(a);if(ks.length!==1)throw Error('non-monomial inverse');var v=vars(ks[0]),r=a[ks[0]];Object.keys(v).forEach(function(k){v[k]*=e;});var out={};out[monokey(v)]=rat(r[1]**BigInt(-e),r[0]**BigInt(-e));return out;}
      var p={'':rat(1n)};for(var i=0;i<e;i++)p=pMul(p,a);return p;
    }
    var b=polynomial(n.b);
    if(n.op==='+')return pAdd(a,b,1);if(n.op==='-')return pAdd(a,b,-1);if(n.op==='*')return pMul(a,b);
    if(n.op==='/'){var keys=Object.keys(b);if(keys.length!==1)throw Error('non-monomial denominator');var k=keys[0],r=b[k],iv=vars(k);Object.keys(iv).forEach(function(v){iv[v]=-iv[v];});var inv={};inv[monokey(iv)]=rat(r[1],r[0]);return pMul(a,inv);}
    throw Error('unsupported expression');
  }
  function pKey(p){return Object.keys(p).sort().map(function(k){return k+'='+rkey(p[k]);}).join('|');}
  function astKey(n){
    try{return 'p:'+pKey(polynomial(n));}catch(e){}
    if(n.op==='+'||n.op==='*'){var list=[];function collect(x){if(x.op===n.op){collect(x.a);collect(x.b);}else list.push(astKey(x));}collect(n);return n.op+'('+list.sort().join(';')+')';}
    return n.op+'('+astKey(n.a)+(n.b?';'+astKey(n.b):'')+')';
  }
  function unreduced(s){var bad=false;s.replace(/(?:^|[^\w.])(\d+)\s*\/\s*(\d+)(?![\d.])/g,function(_,n,d){if(gcd(BigInt(n),BigInt(d))>1n)bad=true;return _;});return bad;}
  function expanded(n){
    if(n.op==='num'&&n.r[0]===0n)return true;
    var seen={};function term(x){
      var powers={},coefficients=0;
      function monomial(y){
        if(y.op==='neg')return monomial(y.a);
        if(y.op==='*')return monomial(y.a)&&monomial(y.b);
        if(y.op==='var'){if(powers[y.name])return false;powers[y.name]=true;return true;}
        if(y.op==='^'&&y.a.op==='var'){var e=constant(y.b);if(!Number.isInteger(e)||e<1||powers[y.a.name])return false;powers[y.a.name]=true;return true;}
        try{constant(y);return ++coefficients===1;}catch(e){return false;}
      }
      if(!monomial(x))return false;
      var p=polynomial(x),keys=Object.keys(p);if(keys.length!==1)return false;var k=keys[0];if(seen[k])return false;seen[k]=true;return true;
    }
    function sum(x){return x.op==='+'||x.op==='-'?sum(x.a)&&sum(x.b):term(x);}
    try{return sum(n);}catch(e){return false;}
  }
  function factorShape(n){
    var factors=[],monomial='';
    function visit(x){
      if(x.op==='*'){visit(x.a);visit(x.b);return;}
      if(x.op==='neg'){visit(x.a);return;}
      if(x.op==='^'&&x.a.op!=='var'){var e=constant(x.b);if(Number.isInteger(e)&&e>0&&e<=32){for(var i=0;i<e;i++)visit(x.a);return;}}
      var p=polynomial(x),ks=Object.keys(p).sort();
      if(ks.length<=1){if(ks.length)monomial=merge(monomial,ks[0]);return;}
      var lead=p[ks[0]],out={};ks.forEach(function(k){out[k]=mul(p[k],rat(lead[1],lead[0]));});factors.push(pKey(out));
    }
    visit(n);return monomial+'|'+factors.sort().join(';');
  }
  function gcfShape(n){
    var mono='',coefficient=rat(1n);
    function visit(x){if(x.op==='*'){visit(x.a);visit(x.b);return;}if(x.op==='neg'){coefficient=mul(coefficient,rat(-1n));visit(x.a);return;}var p=polynomial(x),ks=Object.keys(p);if(ks.length===1){mono=merge(mono,ks[0]);coefficient=mul(coefficient,p[ks[0]]);}}
    visit(n);if(coefficient[0]<0n)coefficient[0]=-coefficient[0];return mono+'|'+rkey(coefficient);
  }
  function expressionEq(a,b,policy){
    try{
      var A=parse(a),B=parse(b),form=policy.answerForm;
      if(form==='reduced'&&unreduced(a))return false;
      if(form==='expanded'&&!expanded(A))return false;
      if(form==='factored'&&factorShape(A)!==factorShape(B))return false;
      if(form==='gcf'&&gcfShape(A)!==gcfShape(B))return false;
      function restrictions(n,out){out=out||{};function names(x){if(x.op==='var')out[x.name]=true;if(x.a)names(x.a);if(x.b)names(x.b);}if(n.op==='/')names(n.b);if(n.op==='^'){try{if(constant(n.b)<0)names(n.a);}catch(e){}}if(n.a)restrictions(n.a,out);if(n.b)restrictions(n.b,out);return Object.keys(out).sort().join(',');}
      if(restrictions(A)!==restrictions(B))return false;
      if(astKey(A)===astKey(B))return true;
      var x=constant(A),y=constant(B),t=policy.absoluteTolerance;
      // A typed decimal approximation is only accepted with an item-specific tolerance.
      return Math.abs(x-y)<=(t===undefined?1e-12:t);
    }catch(e){return false;}
  }
  function alias(s){
    if(/^(no(real)?solutions?|nosol|ns|none|emptyset|empty|\{\}|∅)$/.test(s))return 'none';
    if(/^(allrealnumbers?|allreals?|arn|infinitelymany(solutions)?|infinitesolutions)$/.test(s))return 'all';
    if(/^(yes|true|function|isafunction|yesitisafunction)$/.test(s))return 'yes';
    if(/^(no|false|notafunction|notfunction|nofunction)$/.test(s))return 'no';
    if(/^(undefined|undef|dne|doesnotexist)$/.test(s))return 'undefined';
    return null;
  }
  function splitTop(s){var out=[],depth=0,start=0;for(var i=0;i<s.length;i++){if(s[i]==='('||s[i]==='{')depth++;if(s[i]===')'||s[i]==='}')depth--;if(!depth&&(s[i]===','||s[i]===';')){out.push(s.slice(start,i));start=i+1;}}out.push(s.slice(start));return out;}
  function scalarEq(a,b,policy){
    var A=/^([a-z])=(.+)$/.exec(a),B=/^([a-z])=(.+)$/.exec(b);
    if(A&&B&&A[1]!==B[1])return false;
    return expressionEq(A?A[2]:a,B?B[2]:b,policy);
  }
  function relation(s){var parts=s.split(/(<=|>=|<|>)/);if(parts.length!==3)return null;var l=parts[0],op=parts[1],r=parts[2];if(/^[a-z]$/.test(r)&&!(/^[a-z]$/.test(l))){var x=l;l=r;r=x;op={'<':'>','>':'<','<=':'>=','>=':'<='}[op];}return [l,op,r];}
  function inequalityEq(a,b,policy){
    // AND and OR remain separate; chained inequalities are ANDs.
    function clauses(s){if(s.includes('||'))return {join:'or',parts:s.split('||')};if(s.includes('&&'))return {join:'and',parts:s.split('&&')};var p=s.split(/(<=|>=|<|>)/);if(p.length===5)return {join:'and',parts:[p.slice(0,3).join(''),p.slice(2).join('')]};return {join:'single',parts:[s]};}
    var A=clauses(a),B=clauses(b);if(A.join!==B.join||A.parts.length!==B.parts.length)return false;
    var remaining=B.parts.slice();return A.parts.every(function(v){var x=relation(v);if(!x)return false;var i=remaining.findIndex(function(w){var y=relation(w);return y&&x[1]===y[1]&&expressionEq(x[0],y[0],{})&&expressionEq(x[2],y[2],policy);});if(i<0)return false;remaining.splice(i,1);return true;});
  }
  function matches(input,key,policy){
    policy=policy||{};
    if(input==null||!String(input).trim()||String(input).length>1000)return false;
    var a=clean(input),b=clean(key);
    function logic(s){return s.replace(/\s+or\s+/g,'||').replace(/\s+and\s+/g,'&&').replace(/\s+/g,'');}
    a=logic(a);b=logic(b);if(!b)return false;
    if(/[<>]/.test(a+b))return inequalityEq(a,b,policy);
    var aa=alias(a),bb=alias(b);if(aa||bb)return !!aa&&aa===bb;
    // Natural-language answers have no algebraic interpretation.
    if(a===b)return !(policy.answerForm==='reduced'&&unreduced(a));
    function expandPM(s){return s.includes('±')?[s.replace('±','+'),s.replace('±','-')]:null;}
    var pmA=expandPM(a),pmB=expandPM(b);
    var isPairA=/^\(.*\)$/.test(a)&&splitTop(a.slice(1,-1)).length>1;
    var isPairB=/^\(.*\)$/.test(b)&&splitTop(b.slice(1,-1)).length>1;
    var A=pmA||splitTop(a.replace(/\|\|/g,',')),B=pmB||splitTop(b.replace(/\|\|/g,','));
    if(isPairA||isPairB){
      if(isPairA)A=splitTop(a.slice(1,-1));if(isPairB)B=splitTop(b.slice(1,-1));
      function pair(xs){if(xs.every(function(x){return /^[xy]=/.test(x);})){var obj={};xs.forEach(function(x){obj[x[0]]=x.slice(2);});return Object.keys(obj).length===2&&obj.x!==undefined&&obj.y!==undefined?[obj.x,obj.y]:null;}return xs;}
      A=pair(A);B=pair(B);return !!A&&!!B&&A.length===B.length&&A.every(function(v,i){return scalarEq(v,B[i],policy);});
    }
    if(A.length>1||B.length>1){if(A.length!==B.length||a.includes('&&')||b.includes('&&'))return false;var left=B.slice();return A.every(function(v){var i=left.findIndex(function(w){return scalarEq(v,w,policy);});if(i<0)return false;left.splice(i,1);return true;});}
    if(a.includes('&&')||b.includes('&&'))return false;
    // Equations with compound left sides are compared side-by-side, never stripped.
    if(a.includes('=')&&b.includes('=')&&!/^[a-z]=/.test(a+b)){
      var ea=a.split('='),eb=b.split('=');return ea.length===2&&eb.length===2&&expressionEq(ea[0],eb[0],{})&&expressionEq(ea[1],eb[1],policy);
    }
    return scalarEq(a,b,policy);
  }
  return {clean:clean,norm:norm,matches:matches,parse:parse,polynomialKey:function(s){return pKey(polynomial(parse(norm(s))));}};
});
