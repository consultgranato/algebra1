const fs=require('node:fs'),math=require('../assets/math-engine.js');
const fixtures=JSON.parse(fs.readFileSync(0,'utf8'));const failures=[];
for(const f of fixtures){
 if(!math.matches(f.input,f.key,f.policy))failures.push({id:f.id,type:'valid answer rejected',input:f.input,key:f.key});
 if(math.matches(f.wrong,f.key,f.policy))failures.push({id:f.id,type:'incorrect answer accepted',input:f.wrong,key:f.key});
}
process.stdout.write(JSON.stringify({correctCases:fixtures.length,incorrectCases:fixtures.length,failures}));
