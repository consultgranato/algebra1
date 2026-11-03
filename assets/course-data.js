(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Alg1Course=api;})(typeof window==='undefined'?this:window,function(){
  'use strict';
  var units={
    '1-4':{notes:13,topics:['unit1','unit2','unit3','unit4']},
    '5':{notes:4,topics:['5.1','5.2','5.3','5.4']},
    '6':{notes:5,topics:['6.1','6.2','6.3','6.4','6.5']},
    '7':{notes:4,topics:['7.1','7.2','7.3','7.4']},
    '8':{notes:5,topics:['8.1','8.2','8.3','8.4','8.5']},
    '9':{notes:4,topics:['9.1','9.2','9.3','9.4']},
    '10':{notes:7,topics:['10.1','10.2','10.3','10.4','10.5','10.6','10.7']},
    '11':{notes:3,topics:['11.1','11.2','11.3']},
    '12':{notes:4,topics:['12.1','12.2','12.3','12.4']},
    '13':{notes:4,topics:['13.1','13.2','13.3','13.4']},
    '14':{notes:4,topics:['14.1','14.2','14.3','14.4']},
    '15':{notes:5,topics:['15.1','15.2','15.3','15.4','15.5']},
    '16':{notes:4,topics:['16.1','16.2','16.3','16.4']}
  };
  function score(u,id){u=u||{};var m=units[id];if(!m)return 0;var opened=Object.keys(u.notesRead||{}).filter(function(k){return /^\d+$/.test(k)&&+k<m.notes;}).length;var strong=m.topics.filter(function(t){return u.practice&&u.practice[t]&&u.practice[t].best>=80;}).length;function pct(rec){return rec&&Number.isFinite(rec.best)?Math.max(0,Math.min(100,rec.best))/100:0;}return Math.round(15*opened/m.notes+35*strong/m.topics.length+35*pct(u.test)+15*pct(u.vocab));}
  function migrate(u){
    if(!u||u.gradingVersion===3)return u;
    var next=Object.assign({},u,{gradingVersion:3});
    if(u.practice||u.test||u.vocab){next.earlierScores={version:u.gradingVersion||1,practice:u.practice,test:u.test,vocab:u.vocab,previous:u.earlierScores};delete next.practice;delete next.test;delete next.vocab;}
    return next;
  }
  return {units:units,score:score,migrate:migrate};
});
