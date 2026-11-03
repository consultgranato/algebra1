/* One mathematical representation drives the plot, labels and accessible table. */
(function(root,factory){var api=factory(typeof module==='object'&&module.exports?require('./math-engine.js'):root.Alg1Math);if(typeof module==='object'&&module.exports)module.exports=api;else root.Alg1Graphs=api;})(typeof window==='undefined'?this:window,function(math){
  'use strict';var serial=0;
  var colors=['#6540a6','#087f83','#b45332','#355e9b'];
  function escape(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function format(n){return Math.abs(n)<1e-9?'0':String(Math.round(n*1000)/1000);}
  function relation(source){var m=math.norm(source).match(/^(.+?)(<=|>=|=|<|>)(.+)$/);if(!m)throw Error('Use an equation or inequality, such as y = 2x + 1.');function variables(n){if(n.op==='var'&&!['x','y'].includes(n.name))throw Error('Graph relations may use x and y only.');if(n.a)variables(n.a);if(n.b)variables(n.b);}variables(math.parse(m[1]));variables(math.parse(m[3]));return {left:math.parse(m[1]),right:math.parse(m[3]),operator:m[2],source:source,explicit:m[1]==='y'?math.parse(m[3]):null,vertical:m[1]==='x'?math.parse(m[3]):null};}
  function value(r,x,y){return math.evaluateNode(r.left,{x:x,y:y})-math.evaluateNode(r.right,{x:x,y:y});}
  function samples(spec){return (spec.expressions||[]).map(function(e){var r=relation(e),rows=[];[-2,-1,0,1,2,3,4].forEach(function(x){try{if(r.explicit)rows.push([x,math.evaluateNode(r.explicit,{x:x})]);}catch(err){}});return {expression:e,rows:rows};});}
  function svg(spec){
    var id='a1-plot-'+(++serial),W=520,H=400,P=42,size=316;
    if(spec.interval){var interval=spec.interval,leftX=P+(interval.min+6)/12*(W-2*P),rightX=P+(interval.max+6)/12*(W-2*P),marks='';for(var tick=-6;tick<=6;tick++){var xx=P+(tick+6)/12*(W-2*P);marks+='<line x1="'+xx+'" y1="74" x2="'+xx+'" y2="86" stroke="#697386"/><text x="'+xx+'" y="108" text-anchor="middle">'+tick+'</text>';}return '<svg class="a1-coordinate-plot" viewBox="0 0 520 140" role="img" aria-label="'+escape(spec.description)+'"><g font-family="system-ui,sans-serif" font-size="18" fill="#475467"><line x1="42" y1="80" x2="478" y2="80" stroke="#697386"/>'+marks+'<line x1="'+leftX+'" y1="80" x2="'+rightX+'" y2="80" stroke="'+colors[0]+'" stroke-width="4"/><circle cx="'+leftX+'" cy="80" r="7" fill="'+(interval.minClosed?colors[0]:'#fff')+'" stroke="'+colors[0]+'" stroke-width="3"/><circle cx="'+rightX+'" cy="80" r="7" fill="'+(interval.maxClosed?colors[0]:'#fff')+'" stroke="'+colors[0]+'" stroke-width="3"/></g></svg>';}
    if(spec.numberLine){var n=spec.numberLine,min=-6,max=6,cx=P+(n.value-min)/(max-min)*(W-2*P),right=n.operator.includes('>'),closed=n.operator.includes('='),ray=right?W-P:P;
      var line='<line x1="'+P+'" y1="80" x2="'+(W-P)+'" y2="80" stroke="#697386" stroke-width="1.5"/>';
      for(var k=min;k<=max;k++){var xx=P+(k-min)/(max-min)*(W-2*P);line+='<line x1="'+xx+'" y1="74" x2="'+xx+'" y2="86" stroke="#697386"/><text x="'+xx+'" y="108" text-anchor="middle">'+k+'</text>';}
      line+='<line x1="'+cx+'" y1="80" x2="'+ray+'" y2="80" stroke="'+colors[0]+'" stroke-width="4"/><path d="M'+(ray+(right?-10:10))+',72 L'+ray+',80 L'+(ray+(right?-10:10))+',88" fill="none" stroke="'+colors[0]+'" stroke-width="3"/><circle cx="'+cx+'" cy="80" r="7" fill="'+(closed?colors[0]:'#fff')+'" stroke="'+colors[0]+'" stroke-width="3"/>';
      return '<svg class="a1-coordinate-plot" viewBox="0 0 520 140" role="img" aria-labelledby="'+id+'-title '+id+'-desc"><title id="'+id+'-title">Number line</title><desc id="'+id+'-desc">'+escape(spec.description||((closed?'Closed':'Open')+' circle at '+n.value+', ray extends '+(right?'right':'left')+'.'))+'</desc><g font-family="system-ui,sans-serif" font-size="18" fill="#475467">'+line+'</g></svg>';
    }
    var range=spec.range||[-6,6,-6,6],xmin=range[0],xmax=range[1],ymin=range[2],ymax=range[3];
    // Square coordinate units, even when the horizontal and vertical ranges differ.
    var scale=Math.min((W-2*P)/(xmax-xmin),(H-2*P)/(ymax-ymin)),sx=spec.equalScale===false?(W-2*P)/(xmax-xmin):scale,sy=spec.equalScale===false?(H-2*P)/(ymax-ymin):scale,width=(xmax-xmin)*sx,height=(ymax-ymin)*sy,left=(W-width)/2,top=(H-height)/2;
    function X(x){return left+(x-xmin)*sx;}function Y(y){return top+(ymax-y)*sy;}
    var out='<defs><clipPath id="'+id+'-clip"><rect x="'+left+'" y="'+top+'" width="'+width+'" height="'+height+'"/></clipPath></defs>';
    var tick=Math.max(1,Math.ceil((xmax-xmin)/12));
    for(var x=Math.ceil(xmin/tick)*tick;x<=xmax;x+=tick)out+='<line x1="'+X(x)+'" y1="'+top+'" x2="'+X(x)+'" y2="'+(top+height)+'" class="a1-grid-line"/>'+(x!==0?'<text x="'+X(x)+'" y="'+(Y(Math.max(ymin,Math.min(ymax,0)))+19)+'" text-anchor="middle">'+format(x)+'</text>':'');
    for(var y=Math.ceil(ymin/tick)*tick;y<=ymax;y+=tick)out+='<line x1="'+left+'" y1="'+Y(y)+'" x2="'+(left+width)+'" y2="'+Y(y)+'" class="a1-grid-line"/>'+(y!==0?'<text x="'+(X(Math.max(xmin,Math.min(xmax,0)))-9)+'" y="'+(Y(y)+4)+'" text-anchor="end">'+format(y)+'</text>':'');
    if(ymin<=0&&ymax>=0)out+='<line x1="'+left+'" y1="'+Y(0)+'" x2="'+(left+width)+'" y2="'+Y(0)+'" class="a1-axis-line"/>';
    if(xmin<=0&&xmax>=0)out+='<line x1="'+X(0)+'" y1="'+top+'" x2="'+X(0)+'" y2="'+(top+height)+'" class="a1-axis-line"/>';
    out+='<text x="'+(left+width+15)+'" y="'+(Y(0)+5)+'">x</text><text x="'+(X(0)+7)+'" y="'+(top-12)+'">y</text><text x="'+(X(0)-10)+'" y="'+(Y(0)+19)+'">0</text>';
    out+='<g clip-path="url(#'+id+'-clip)">';
    (spec.expressions||[]).forEach(function(source,index){var r=relation(source),color=colors[index%colors.length],dash=/^[<>]$/.test(r.operator)?' stroke-dasharray="8 6"':'';
      if(r.explicit){var points=[],path='',shading=[],pen=false;for(var i=0;i<=480;i++){var xx=xmin+(xmax-xmin)*i/480;try{var yy=math.evaluateNode(r.explicit,{x:xx});if(!Number.isFinite(yy)||Math.abs(yy)>1e5){pen=false;continue;}points.push([X(xx),Y(yy)]);path+=(!pen?'M':'L')+X(xx).toFixed(2)+','+Y(yy).toFixed(2)+' ';pen=true;}catch(err){pen=false;}}
        if(r.operator!=='='&&points.length){var boundary=r.operator.includes('<')?Y(ymin):Y(ymax);shading=[[X(xmin),boundary]].concat(points,[[X(xmax),boundary]]);out+='<polygon points="'+shading.map(function(p){return p.map(function(n){return Math.max(-10000,Math.min(10000,n)).toFixed(2);}).join(',');}).join(' ')+'" fill="'+color+'" fill-opacity=".12"/>';}
        out+='<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="3"'+dash+'/>';
      }else if(r.vertical){var vx=math.evaluateNode(r.vertical,{});if(r.operator!=='='){var from=r.operator.includes('<')?left:X(vx),to=r.operator.includes('<')?X(vx):left+width;out+='<rect x="'+from+'" y="'+top+'" width="'+Math.max(0,to-from)+'" height="'+height+'" fill="'+color+'" fill-opacity=".12"/>';}out+='<line x1="'+X(vx)+'" y1="'+top+'" x2="'+X(vx)+'" y2="'+(top+height)+'" stroke="'+color+'" stroke-width="3"'+dash+'/>';}
      else { if(r.operator!=='=')throw Error('For shaded inequalities, write y or x alone on the left side.'); // Marching squares for implicit relations, including circles.
        var grid=90,dx=(xmax-xmin)/grid,dy=(ymax-ymin)/grid,segments='';
        for(var ix=0;ix<grid;ix++)for(var iy=0;iy<grid;iy++){var corners=[[xmin+ix*dx,ymin+iy*dy],[xmin+(ix+1)*dx,ymin+iy*dy],[xmin+(ix+1)*dx,ymin+(iy+1)*dy],[xmin+ix*dx,ymin+(iy+1)*dy]],hits=[];
          for(var e=0;e<4;e++){var a=corners[e],b=corners[(e+1)%4];try{var va=value(r,a[0],a[1]),vb=value(r,b[0],b[1]);if((va<0)!==(vb<0)){var t=va/(va-vb);hits.push([X(a[0]+t*(b[0]-a[0])),Y(a[1]+t*(b[1]-a[1]))]);}}catch(err){}}
          for(var h=0;h+1<hits.length;h+=2)segments+='M'+hits[h].join(',')+'L'+hits[h+1].join(',');
        }out+='<path d="'+segments+'" fill="none" stroke="'+color+'" stroke-width="3"'+dash+'/>';
      }
    });
    if(Number.isFinite(spec.asymptote))out+='<line x1="'+left+'" y1="'+Y(spec.asymptote)+'" x2="'+(left+width)+'" y2="'+Y(spec.asymptote)+'" stroke="#087f83" stroke-width="2.5" stroke-dasharray="7 5"/>';
    if(Number.isFinite(spec.axisOfSymmetry))out+='<line x1="'+X(spec.axisOfSymmetry)+'" y1="'+top+'" x2="'+X(spec.axisOfSymmetry)+'" y2="'+(top+height)+'" stroke="#b45332" stroke-width="2" stroke-dasharray="7 5"/>';
    (spec.points||[]).forEach(function(p){out+='<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="5" fill="#fff" stroke="'+colors[0]+'" stroke-width="2.5"/>'+(spec.labelPoints===false?'':'<text x="'+Math.min(left+width-85,Math.max(left+4,X(p[0])+9))+'" y="'+Math.min(top+height-8,Math.max(top+18,Y(p[1])-10))+'" class="a1-point-label">('+format(p[0])+', '+format(p[1])+')</text>');});
    out+='</g>';if(spec.xLabel)out+='<text x="260" y="393" text-anchor="middle">'+escape(spec.xLabel)+'</text>';if(spec.yLabel)out+='<text x="12" y="20">'+escape(spec.yLabel)+'</text>';
    return '<svg class="a1-coordinate-plot" viewBox="0 0 '+W+' '+H+'" role="img" aria-labelledby="'+id+'-title '+id+'-desc"><title id="'+id+'-title">Coordinate graph</title><desc id="'+id+'-desc">'+escape(spec.description||'Coordinate plane with equal-sized units on both axes.')+'</desc><g font-family="system-ui,sans-serif" font-size="16" fill="#475467">'+out+'</g></svg>';
  }
  function figure(spec,options){options=options||{};var description=spec.description||'Explore the relationship between the horizontal input x and the vertical output y.';
    var rows=spec.points&&spec.points.length?spec.points.map(function(p){return [format(p[0]),format(p[1])];}):[];
    if(!rows.length&&(options.showExpressions||options.table)){var sampled=samples(spec);if(sampled.length===1)rows=sampled[0].rows.map(function(p){return p.map(format);});}
    var accessible='<details class="a1-graph-description"><summary>Read the graph description'+(rows.length?' and coordinates':'')+'</summary><p>'+escape(description)+'</p>'+(rows.length?'<table><caption>Coordinates shown or sampled on the graph</caption><thead><tr><th scope="col">x</th><th scope="col">y</th></tr></thead><tbody>'+rows.map(function(p){return '<tr><td>'+p[0]+'</td><td>'+p[1]+'</td></tr>';}).join('')+'</tbody></table>':'')+'</details>';
    return '<figure class="a1-graph-figure">'+(options.title?'<figcaption class="a1-graph-title">'+escape(options.title)+'</figcaption>':'')+svg(spec)+(options.showExpressions?'<div class="a1-graph-legend">'+(spec.expressions||[]).map(function(e,i){return '<span style="--curve:'+colors[i%colors.length]+'">'+escape(e)+'</span>';}).join('')+'</div>':'')+accessible+'</figure>';
  }
  return {svg:svg,figure:figure,samples:samples,relation:relation,value:value,escape:escape};
});
