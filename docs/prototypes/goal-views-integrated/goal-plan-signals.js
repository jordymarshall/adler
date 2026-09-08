// Shared, disposable display calculation for the existing A overview and C goal study.
// Closed opportunities only; this is not an adaptive difficulty policy or a goal forecast.
window.goalPlanSignals=function(actions,through,{oneDay=false}={}){
  const opportunities=actions.flatMap(a=>a.days.filter(d=>d<=through).map(day=>({day,amount:a.reports[day],target:typeof a.target==='function'?a.target(day):a.target})));
  const known=opportunities.filter(o=>o.amount!==undefined);
  const met=known.filter(o=>o.amount>=o.target).length;
  const missed=known.length-met,unknown=opportunities.length-known.length;
  const extra=known.some(o=>o.amount>o.target);
  const label=missed?'Behind plan':unknown?'Needs an update':!opportunities.length?'No actions due':extra?'Above plan':'On plan';
  let run=0,rest=0,unconfirmed=false;
  if(!oneDay&&opportunities.length){
    const first=Math.min(...opportunities.map(o=>o.day));
    for(let day=first;day<=through;day++){
      const due=opportunities.filter(o=>o.day===day);
      if(due.some(o=>o.amount!==undefined&&o.amount<o.target)){run=0;rest=0;unconfirmed=false;}
      else if(due.some(o=>o.amount===undefined)){run=0;rest=0;unconfirmed=true;}
      else if(due.length){run++;}
      else if(run){run++;rest++;}
    }
  }
  return {label,kind:missed?'behind':unknown?'unknown':extra?'above':'on',met,due:opportunities.length,unknown,through,run:oneDay?null:run,rest,unconfirmed};
};
window.goalPlanSignalText=function(signal){
  const progress=signal.met+'/'+signal.due+' due actions met';
  const run=signal.run===null?'':signal.unconfirmed?'Streak unconfirmed':signal.run?signal.run+'-day streak':'No current streak';
  return {progress,run};
};

// Compare one action's quantities only. Unreported opportunities have no assumed value.
window.goalInputComparison=function(targets,reports,through){
  const due=targets.filter(([d])=>d<=through),known=due.filter(([d])=>reports[d]!==undefined);
  const planned=known.reduce((n,[,v])=>n+v,0),reported=known.reduce((n,[d])=>n+reports[d],0);
  return {planned,reported,unknown:due.length-known.length,count:known.length,
    below:known.reduce((n,[d,v])=>n+Math.max(0,v-reports[d]),0),above:known.reduce((n,[d,v])=>n+Math.max(0,reports[d]-v),0)};
};
// Fill only adjacent, reported, planned days. Split where the two lines cross.
window.goalPlanGapFill=function(points){
  let svg='';
  const fill=(a,b)=>{
    const below=(a.actual-a.planned||b.actual-b.planned)>0;
    svg+='<path class="plan-gap '+(below?'below':'above')+'" d="M'+a.x+','+a.planned+'L'+b.x+','+b.planned+'L'+b.x+','+b.actual+'L'+a.x+','+a.actual+'Z" fill="'+(below?'#ead0a5':'#cbd9eb')+'" opacity=".6" pointer-events="none"/>';
  };
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];if(!a||!b||b.day-a.day!==1)continue;
    const da=a.actual-a.planned,db=b.actual-b.planned;if(!da&&!db)continue;
    if(da*db<0){const t=da/(da-db),cross={x:a.x+(b.x-a.x)*t,planned:a.planned+(b.planned-a.planned)*t};cross.actual=cross.planned;fill(a,cross);fill(cross,b);}else fill(a,b);
  }
  return svg;
};

window.goalStreakBadge=function(signal,key){
  if(signal.run===null)return '';
  const muted=signal.unconfirmed||!signal.run,label=signal.unconfirmed?'Streak awaiting a report':signal.run+'-day streak. Planned days off preserve an intact run.';
  return '<span class="streak-badge '+(muted?'is-muted':'')+'" role="img" aria-label="'+label+'" title="'+label+'"><svg class="streak-flame" viewBox="0 0 28 36" aria-hidden="true"><defs><linearGradient id="streak-fill-'+key+'" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="#ffd37d"/><stop offset=".5" stop-color="#f39b45"/><stop offset="1" stop-color="#d76535"/></linearGradient></defs><path d="M15.4 1.5c1.7 8.1-5.9 9.3-4.2 15.2 1.5-1.1 2.2-3.1 2-5.2 6.6 3.3 11.5 8.9 10.2 15.3-1 5.2-5.1 8-10 8-5.9 0-10.1-4-10.1-9.7 0-6.9 6.3-10.4 7.6-15.4.6-2.2.6-4.4.5-6.1 1.4 1.4 2.1 2.8 2.2 4.1 1.4-2 1.8-3.9 1.8-6.2Z" fill="url(#streak-fill-'+key+')"/><path d="M15 19.2c.4 4.4-5.9 5.5-5.9 9.4 0 2.8 1.7 4.7 4.6 4.7 3.4 0 5.5-2.5 4.7-5.8-.6-2.4-2.6-3.8-3.4-8.3Z" fill="#ffe3a1"/><path d="M7.3 21.1c-1.5 2.1-1.9 4.2-1.2 6.1" fill="none" stroke="#ffd69a" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></svg><strong>'+ (signal.unconfirmed?'?':signal.run)+'</strong></span>';
};
