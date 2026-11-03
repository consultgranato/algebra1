// Export only mathematical graph data for a separate SymPy implementation.
const {units}=require('./content.cjs'),G=require('../assets/graphs');const graphs=[];
for(const u of units())for(const [group,bank] of Object.entries({...u.banks,test:u.test}))for(const [i,p] of bank.entries())if(p.graph){const probes=[];for(const expression of p.graph.expressions){const r=G.relation(expression);if(r.explicit)for(const x of [-2,-1,0,1,2,3,4]){try{probes.push({expression,x,y:require('../assets/math-engine').evaluateNode(r.explicit,{x})});}catch{}}}graphs.push({id:u.file+':'+group+':'+i,...p.graph,probes});}
process.stdout.write(JSON.stringify(graphs));
