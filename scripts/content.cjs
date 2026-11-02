// Execute only repository-authored inline scripts in an isolated, inert DOM.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function units(root=path.join(__dirname,'..')) {
 const dummy=new Proxy(function(){},{get(t,k){if(k==='length')return 0;if(k==='children')return [];return dummy;},apply(){return dummy;},set(){return true;}});
 return fs.readdirSync(root).filter(f=>/^unit.*\.html$/.test(f)).map(file=>{
  const html=fs.readFileSync(path.join(root,file),'utf8');const ctx={document:dummy,window:{},console,setTimeout(){},clearTimeout(){},Math,encodeURIComponent,decodeURIComponent};vm.createContext(ctx);
  for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],ctx,{timeout:1000});
  const data=vm.runInContext('({banks:BANKS,test:T,vocabulary:VQB,notes:typeof TOPICS!=="undefined"?TOPICS:null,noteTags:typeof TOPIC_TAGS!=="undefined"?TOPIC_TAGS:null})',ctx);
  return {file,...data};
 });
}
module.exports={units};
if(require.main===module)process.stdout.write(JSON.stringify(units(),null,2));
