// THROWAWAY. This compares overview structures, not coaching tactics or forecasting models.
// All edits are local examples. No app, model, calendar, analytics or persistence API is called.
const variants=['A','B','C'];
const names={A:'Goals first',B:'The shared week',C:'Progress first'};
const params=new URLSearchParams(location.search);
let variant=variants.includes(params.get('variant'))?params.get('variant'):'A';
const days=['Mon 7','Tue 8','Wed 9','Thu 10','Fri 11','Sat 12','Sun 13'];
const goals=[
  {id:'reading',title:'Read 30 books',short:'Reading',area:'Learning',priority:'Maintain',color:'#426d55',outcome:6,total:30,unit:'books',milestone:'Finish book 7',milestoneDetail:'100 / 200 pages reported',input:'Pages per planned day',inputUnit:'pages',target:20,reports:[[1,20],[2,8],[3,0],[4,12],[7,20]],planned:[20,20,20,20,20,0,0],suggested:[20,20,20,20,20,0,0],note:'Trying reading after lunch',review:'14 Sep'},
  {id:'revenue',title:'Reach $100k in revenue',short:'Business',area:'Business',priority:'Focus',color:'#5677ae',outcome:0,total:100000,unit:'revenue',milestone:'First $1,000 reported',milestoneDetail:'Work and revenue tracked separately',input:'Minutes of focused work',inputUnit:'min',target:60,reports:[[1,60],[2,25],[3,0],[4,40],[7,60]],planned:[60,60,60,60,100,0,0],suggested:[60,40,40,40,50,0,0],note:'Trying a morning work window',review:'14 Sep'},
  {id:'day',title:'Cancel my unused subscription',short:'Personal admin',area:'Personal admin',priority:'Today',color:'#a38348',outcome:0,total:1,unit:'confirmation',milestone:'No intermediate milestone',milestoneDetail:'Actions lead directly to the goal',input:'Supporting steps',planned:[0,30,0,0,0,0,0],suggested:[0,30,0,0,0,0,0],note:'Cancellation planned for 5 pm'}
];
function initialState(){return {scenario:'tight',available:[80,90,60,60,70,0,0],applied:false,declined:false,selectedGoal:'reading',messages:[],workspaceState:null,workspaceSummaries:{}};}
let state=initialState(),dialogType='',noticeTimer;
window.getGoalWorkspaceState=()=>state.workspaceState?JSON.parse(JSON.stringify(state.workspaceState)):null;
window.updateGoalWorkspaceState=(next,goalId,summary)=>{
  for(const id of Object.keys(state.workspaceSummaries))if(JSON.stringify(state.workspaceState?.[id])!==JSON.stringify(next[id]))delete state.workspaceSummaries[id];
  state.workspaceState=next;state.workspaceSummaries[goalId]=summary;render();
};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sum=a=>a.reduce((n,v)=>n+v,0);
const minutes=n=>n===0?'0 min':n<60?n+' min':Math.floor(n/60)+'h'+(n%60?' '+n%60+'m':'');
const goalById=id=>goals.find(g=>g.id===id)||goals[0];
const plan=g=>state.applied?g.suggested:g.planned;
const planned=()=>sum(goals.map(g=>sum(plan(g))));
const available=()=>state.available===null?null:sum(state.available);
const overage=()=>available()===null?null:Math.max(0,planned()-available());
const proposalReady=()=>!state.applied&&!state.declined&&state.available?.join(',')==='80,90,60,60,70,0,0';
const totals=()=>days.map((_,i)=>sum(goals.map(g=>plan(g)[i])));
function goalState(g){return {...g,...state.workspaceSummaries[g.id]};}
function rowSignals(g){
  if(state.workspaceSummaries[g.id])return state.workspaceSummaries[g.id].signals;
  if(g.id==='day')return goalPlanSignals([{days:[11],target:1,reports:{11:1}},{days:[17],target:1,reports:{}}],14,{oneDay:true});
  const actions=[{days:[1,2,3,4,7,8],reports:Object.fromEntries(g.reports),target:g.target}];
  if(g.id==='revenue')actions.push({days:[4],target:1,reports:{4:1}});
  return goalPlanSignals(actions,7);
}
function rowComparison(g){const current=goalState(g);return goalInputComparison(current.inputTargets||[1,2,3,4,7,8].map(d=>[d,g.target]),Object.fromEntries(current.reports),7);}
function rowStatus(g){
  const signal=rowSignals(g),text=goalPlanSignalText(signal);
  const t=g.id==='day'?null:rowComparison(g);
  const label=!t?text.progress:t.unknown?t.unknown+' past report'+(t.unknown===1?'':'s')+' missing':t.below?t.below+' '+g.inputUnit+' below plan'+(t.above?' · '+t.above+' extra':''):t.above?t.above+' '+g.inputUnit+' above plan':'Planned amount met';
  return '<button class="row-plan-status" data-goal="'+g.id+'" aria-label="'+esc(label+'. '+text.run+'. Open the same plan and projection.')+'"><span class="quantity-gap '+(t?.unknown?'unknown':t?.below?'below':t?.above?'above':'met')+'">'+label+'</span><span aria-hidden="true">↗</span></button>';
}

function estimateLabel(g){
  const saved=state.workspaceSummaries[g.id];
  if(g.id!=='reading')return g.id==='revenue'?'Open work & outcome ↗':'Open plan ↗';
  if(!saved)return 'Estimated Mar 2028 · open projection ↗';
  return saved.outcome>=30?'Goal reached · open plan ↗':saved.projection?'Estimated '+new Date(saved.projection.date).toLocaleDateString('en-GB',{month:'short',year:'numeric'})+' · open projection ↗':'Estimate needs more reports ↗';
}
function snapshot(){return {...state,variant,goals:goals.map(g=>({id:g.id,outcome:goalState(g).outcome,reportedInput:goalState(g).reports||null,planSignals:rowSignals(g),plannedMinutes:plan(g)})),plannedMinutes:planned(),availableMinutes:available(),overByMinutes:overage()};}
function notice(message){$('#notice').textContent=message;$('#notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').hidden=true,4500);}
function dot(g){return '<i class="dot" style="--goal:'+g.color+'"></i>';}
function goalButton(g,cls='goal-title'){return '<a href="goal-workspace-v2.html?variant=C&goal='+g.id+'" class="'+cls+'" data-goal="'+g.id+'">'+dot(g)+'<span>'+g.title+' '+goalStreakBadge(rowSignals(g),g.id)+'</span></a>';}
function outcome(g){const value=goalState(g).outcome;return g.id==='reading'?value+' <span>/ 30 books</span>':g.id==='revenue'?'$'+value.toLocaleString()+' <span>/ $100k</span>':(value?'Reported':'Pending')+' <span>confirmation</span>';}
function heading(subtitle){return '<div class="page-heading"><div><h1>All goals</h1><p>'+subtitle+'</p></div><span class="date-label">Tue, 8 September 2026</span></div>';}
function timeLegend(){return '<div class="legend">'+goals.map(g=>'<span>'+dot(g)+g.short+' · '+minutes(sum(plan(g)))+'</span>').join('')+'</div>';}
function capacityAction(){return '<button class="text-button" data-open="'+(overage()?(proposalReady()?'proposal':'coach'):'capacity')+'">'+(overage()?(proposalReady()?'See suggested adjustment ↗':'Discuss with Coach ↗'):available()===null?'Set available time ↗':'Edit available time ↗')+'</button>';}
function capacity(){
  const total=planned(),limit=available(),max=Math.max(total,limit||0,60),over=overage();let cursor=0;
  if(limit===null)return '<section class="capacity unknown" aria-label="Shared available time"><div class="capacity-heading"><div><strong>'+minutes(total)+' planned this week</strong><small>Available time not estimated</small></div>'+capacityAction()+'</div><div class="unknown-line"></div>'+timeLegend()+'</section>';
  return '<section class="capacity" aria-label="Shared available time"><div class="capacity-heading"><div><strong>This week · 7–13 Sep</strong><small>'+minutes(total)+' planned / '+minutes(limit)+' available</small></div><button class="text-button" data-open="capacity">Where these hours come from ↗</button></div><div class="time-track" role="img" aria-label="'+minutes(total)+' planned, '+minutes(limit)+' available">'+goals.map(g=>{const width=sum(plan(g))/max*100;const left=cursor;cursor+=width;return '<span class="time-segment" style="--goal:'+g.color+';left:'+left+'%;width:'+width+'%"></span>';}).join('')+(over?'<span class="overrun" style="left:'+limit/max*100+'%;width:'+over/max*100+'%"></span>':'')+'<span class="capacity-line" style="left:calc('+limit/max*100+'% - 1px)"></span></div><div class="time-axis"><span>0 hours</span><span>Black marker = '+minutes(limit)+' available</span><span>'+minutes(max)+'</span></div><div class="capacity-footer">'+timeLegend()+'<div class="quiet-warning">'+(over?'<i class="warning-dot"></i><span>'+minutes(over)+' beyond your available time</span>':'<span>'+minutes(limit-total)+' unallocated</span>')+capacityAction()+'</div></div></section>';
}
function inputGraph(g){
  g=goalState(g);
  if(g.id==='day'){
    const steps=g.supportingSteps||[true,false];
    return '<a class="one-off-work" href="goal-workspace-v2.html?variant=C&goal=day" data-goal="day">'+steps.map((done,i)=>(i?'<span class="connector"></span>':'')+'<span class="step '+(done?'done':'')+'">'+(done?'✓':'·')+'</span>').join('')+'<small>'+steps.filter(Boolean).length+' of 2 supporting steps reported</small></a>';
  }
  const targets=g.inputTargets||[1,2,3,4,7,8].map(d=>[d,g.target]),reports=new Map(g.reports);
  const max=Math.max(g.target,...g.reports.map(r=>r[1]),...targets.map(t=>t[1]));
  const w=340,h=78,x=d=>29+(d-1)/7*290,y=v=>44-v/max*34;
  let connected=false;
  const path=targets.map(([d])=>{if(!reports.has(d)){connected=false;return '';}const command=connected?'L':'M';connected=true;return command+x(d)+','+y(reports.get(d));}).join(' ');
  let previous=null;
  const planned=targets.map(([d,n])=>{const command=previous!==null&&d-previous===1?'L':'M';previous=d;return command+x(d)+','+y(n);}).join(' ');
  const gaps=goalPlanGapFill(targets.map(([d,n])=>d<=7&&reports.has(d)?{day:d,x:x(d),planned:y(n),actual:y(reports.get(d))}:null));
  const stems=targets.filter(([d,n])=>d<=7&&reports.has(d)&&reports.get(d)!==n).map(([d,n])=>'<path d="M'+x(d)+','+y(n)+'V'+y(reports.get(d))+'" stroke="'+(reports.get(d)<n?'#ab854d':'#6881a4')+'" stroke-width="1"/>').join('');
  return '<a class="mini-chart" data-focus="input" data-goal="'+g.id+'" href="goal-workspace-v2.html?variant=C&goal='+g.id+'" aria-label="Open '+g.title+' input history"><svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+g.input+' from 1 to 8 September. Solid marks are reports; dashed line is the plan; question marks are unreported opportunities.">'+gaps+stems+'<path d="'+planned+'" fill="none" stroke="#b6c1b1" stroke-dasharray="3 4"/><line x1="29" y1="44" x2="319" y2="44" stroke="#dbe1d5"/><text x="0" y="14" fill="#66705f" font-size="10">'+max+'</text><text x="12" y="48" fill="#66705f" font-size="10">0</text><path d="'+path+'" stroke="'+g.color+'" fill="none" stroke-width="2.2"/>'+g.reports.map(([d,v])=>'<circle cx="'+x(d)+'" cy="'+y(v)+'" r="3.2" fill="'+g.color+'"><title>'+d+' Sep: '+v+' '+g.inputUnit+' reported</title></circle>').join('')+targets.filter(([d])=>!reports.has(d)).map(([d])=>'<text x="'+x(d)+'" y="32" text-anchor="middle" fill="#737e6d" font-size="13">?<title>'+d+' Sep: no report yet, not zero</title></text>').join('')+[[1,'1 Sep'],[4,'4 Sep'],[8,'8 Sep']].map(([d,label])=>'<text x="'+x(d)+'" y="69" text-anchor="middle" fill="#65705f" font-size="10">'+label+'</text>').join('')+'</svg></a>';
}

function goalRow(g){
  const current=goalState(g),t=g.id==='day'?null:rowComparison(g);
  const r=state.workspaceSummaries[g.id]?.milestoneProjection||(!state.workspaceSummaries[g.id]&&g.id==='reading'?{current:20,early:17,late:25}:null);
  const date=d=>new Date(Date.UTC(2026,8,d)).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).replace('Sept','Sep');
  let outlook=g.id==='reading'?(current.outcome>=30?'Goal completion reported':r?'Around '+date(r.current):'More reports needed'):g.id==='revenue'?'Finish date still unknown':current.outcome?'Cancellation confirmed':'Cancellation planned · 5 pm';
  const meaning=g.id==='reading'?(r?'At recent pace · '+date(r.early)+'–'+date(r.late):'Update your reading progress'):g.id==='revenue'?'Learning how your chosen work relates to results':current.outcome?'Goal result reported':'Due today · before 6 pm';
  return '<tr style="--goal:'+g.color+'"><td>'+goalButton(g)+'<span class="reported">'+outcome(g)+'</span><div class="goal-meta"><span>'+g.area+'</span><span>'+g.priority+'</span></div></td><td><div class="work-label"><strong>'+g.input+'</strong>'+(t?'<span>'+(t.count?t.reported+' / '+t.planned+' '+g.inputUnit+(t.unknown?' on reported days':''):'No quantities reported')+'</span>':'')+'</div>'+inputGraph(g)+(t?'<div class="overview-report-note"><span>Amounts through 7 Sep</span><span>'+(t.unknown?t.unknown+' past reports missing':t.below?t.below+' '+g.inputUnit+' below plan':t.above?t.above+' '+g.inputUnit+' above plan':'Planned amount met')+'</span></div>':'')+'</td><td><span class="eyebrow">'+(g.id==='day'?'Current action':'Next milestone')+'</span><span class="milestone-label">'+(g.id==='day'?'Cancel the subscription':current.milestone)+'</span><button class="outlook-main text-button" data-goal="'+g.id+'" data-focus="plan">'+outlook+' ↗</button><small class="outlook-note">'+meaning+'</small></td></tr>';
}
function compactCapacity(){
  const limit=available(),total=planned(),over=overage();
  return '<details class="capacity-disclosure"><summary><span>This week · 7–13 Sep</span><strong>'+minutes(total)+' planned'+(limit===null?'':' / '+minutes(limit)+' available')+'</strong><span class="capacity-consequence '+(over?'over':'')+'">'+(limit===null?'Available time unknown':over?minutes(over)+' over available time':minutes(limit-total)+' unallocated')+'</span><span class="expand-caption">Breakdown ⌄</span></summary>'+capacity()+'</details>';
}

function VariantA(){return heading('Your current work and where it leads.')+compactCapacity()+'<section aria-label="Goals and their progress"><table class="goals-table"><thead><tr><th scope="col">Goal & reported result</th><th scope="col">Work over time · 1–8 Sep</th><th scope="col">Where this work leads</th></tr></thead><tbody>'+goals.map(goalRow).join('')+'</tbody></table><div class="row-footer"><span>Open a goal to act on its plan.</span><span>Solid = reported · dashed = planned · shaded = difference</span></div></section>';}

function VariantB(){
  const total=planned(),limit=available(),over=overage(),dayTotals=totals();
  return heading('See how your goals share the week.')+'<div class="week-headline"><div><div class="week-total">'+minutes(total)+' <span>planned'+(limit===null?'':' / '+minutes(limit)+' available')+'</span></div><p>'+(limit===null?'Available time has not been estimated.':over?minutes(over)+' needs to move, change, or make room.':'The planned time fits the available hours in this example.')+'</p></div><button class="'+(over?'primary':'')+'" data-open="'+(over?(proposalReady()?'proposal':'coach'):'capacity')+'">'+(over?(proposalReady()?'Review this week’s plan ↗':'Discuss this week ↗'):'Edit available time ↗')+'</button></div><section class="week-surface" aria-label="Shared week"><div class="week-scroll" tabindex="0" role="region" aria-label="7 to 13 September planned time by goal, scroll horizontally"><div class="week-grid"><div class="week-axis" style="text-align:left;padding-left:19px">PLANNED TIME BY GOAL<b>7–13 September</b></div>'+days.map((d,i)=>'<div class="week-axis '+(i===1?'today':'')+'">'+d.split(' ')[0]+'<br><b>'+d.split(' ')[1]+'</b></div>').join('')+goals.map(g=>'<div class="week-label">'+goalButton(g)+'<small>'+minutes(sum(plan(g)))+' this week</small></div>'+plan(g).map((n,i)=>'<div class="week-cell">'+(n?'<button class="day-allocation" style="--goal:'+g.color+'" data-day="'+i+'" aria-label="'+g.title+', '+days[i]+', '+minutes(n)+' planned">'+minutes(n)+'</button>':'<span class="empty-time" aria-label="No planned time">—</span>')+'</div>').join('')).join('')+'<div class="totals-label">Total planned<small>Against available time</small></div>'+dayTotals.map((n,i)=>'<div class="day-total '+(limit!==null&&n>state.available[i]?'over':'')+'"><b>'+minutes(n)+'</b><span>'+(limit===null?'Time unknown':minutes(state.available[i])+' available')+'</span></div>').join('')+'</div></div><div class="week-foot"><span>Durations are estimates for planned work. They do not record completion.</span><button class="text-button" data-open="capacity">Edit available time ↗</button></div></section><div class="row-footer"><span>Open a goal to see its actions, milestones and learning journey.</span><span>Only Adler goal time is shown here. Other commitments reduce available time.</span></div>';
}
function conflictLine(){
  if(overage())return '<div class="conflict-line"><i class="warning-dot"></i><span>Your plans exceed this week’s available time by <strong>'+minutes(overage())+'</strong>.</span>'+capacityAction()+'</div>';
  if(available()===null)return '<div class="conflict-line"><span>Available time has not been estimated.</span>'+capacityAction()+'</div>';
  return '';
}
function graphLegend(g){return '<div class="legend"><span><i class="solid" style="--goal:'+g.color+'"></i>Reported outcome</span>'+(g.id==='reading'?'<span><i class="dashed" style="--goal:'+g.color+'"></i>Conditional estimate</span><span><i class="range"></i>Scenario range</span>':'')+'</div>';}
function graphCaption(g){return g.id==='reading'?'The range widens with uncertainty in future reading pace and book length. It is a scenario range, not a probability of success.':g.id==='revenue'?'Focused work is tracked. We do not yet know how it relates to revenue, so there is no invented finish date.':'The cancellation confirmation is the goal. Completing a supporting step does not establish that result.';}
function VariantC(){
  const selected=goalById(state.selectedGoal);
  return heading('Follow the outcome. Open a goal to see the work behind it.')+conflictLine()+'<section class="progress-layout"><aside class="goal-index" aria-label="Choose a goal to preview"><span class="eyebrow">3 goals · select to preview</span>'+goals.map(g=>'<button class="goal-choice" style="--goal:'+g.color+'" data-select="'+g.id+'" aria-pressed="'+(g.id===selected.id)+'"><span class="goal-title">'+dot(g)+g.title+'</span><span class="reported">'+outcome(g)+'</span><small>'+g.area+' · '+minutes(sum(plan(g)))+' planned this week</small></button>').join('')+'</aside><div class="goal-preview">'+preview(selected)+'</div></section>';
}
function preview(g){
  return '<div class="preview-heading"><div><span class="eyebrow">Goal outcome</span><h2>'+g.title+'</h2><p>'+(g.id==='day'?'Target · today, before 6 pm':'Target · 31 December 2027')+'</p></div><span class="reported">'+outcome(g)+'<small>'+(g.id==='reading'?'Reported 1 Sep':g.id==='revenue'?'Reported 8 Sep':'Not yet reported')+'</small></span></div>'+(g.id==='day'?dayOutcome():'<div class="large-chart" data-chart="'+g.id+'"></div>'+graphLegend(g))+'<p class="chart-caption">'+graphCaption(g)+'</p><div class="mini-basis">'+(g.id==='reading'?'<span>Current estimate · <strong>Mar 2028</strong></span><button class="text-button" data-open="forecast">See the assumptions ↗</button>':g.id==='revenue'?'<span>185 minutes of focused work · 5 / 6 reports</span><button class="text-button" data-open="relationship">What is known ↗</button>':'<span>1 supporting step reported · 1 still planned</span>')+'</div><div class="preview-bottom"><div><span>'+(g.id==='day'?'Next planned action':'Current milestone')+'</span><strong>'+(g.id==='day'?'Cancel the subscription · 5 pm':g.milestone)+'</strong></div><a class="open-goal" data-goal="'+g.id+'" href="goal-workspace-v2.html?variant=C&goal='+g.id+'">Open plan & learning journey →</a></div>';
}
function dayOutcome(){return '<div class="empty-outcome"><span class="outline-node">○</span><h3>Waiting for confirmation</h3><p>The cancellation is planned for 5 pm.<br>Its outcome has not been reported.</p></div>';}
function outcomeSVG(g,width){
  const w=Math.max(300,width),h=275,left=w<500?37:48,right=18,top=25,bottom=48,gw=w-left-right,gh=h-top-bottom;
  const utc=(year,month,day)=>Date.UTC(year,month-1,day),start=utc(2026,6,1),today=utc(2026,9,8),end=g.id==='reading'?utc(2029,10,1):utc(2027,12,31);
  const x=t=>left+(t-start)/(end-start)*gw,y=v=>top+gh*(1-v/g.total),text=(tx,ty,label,anchor='start',fill='#687163',size=11)=>'<text x="'+tx+'" y="'+ty+'" fill="'+fill+'" font-size="'+size+'" text-anchor="'+anchor+'">'+label+'</text>';
  let svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+g.title+' outcome over time'+(g.id==='reading'?', including a conditional forward estimate and broad scenario range':', one reported revenue value and no forecast')+'">';
  const ticks=g.id==='reading'?[0,15,30]:[0,50000,100000];
  svg+=text(left,13,g.id==='reading'?'Books finished':'Revenue', 'start','#4d584b',11);
  svg+=ticks.map(v=>'<line x1="'+left+'" y1="'+y(v)+'" x2="'+(w-right)+'" y2="'+y(v)+'" stroke="#e1e6dc"/>'+text(left-8,y(v)+4,g.id==='reading'?v:v?'$'+v/1000+'k':'$0','end','#687163',10)).join('');
  if(g.id==='reading'){
    const mean=sum(g.reports.map(r=>r[1]))/g.reports.length,rate=mean*5,remaining=24,partial=100,ms=86400000;
    const durations=[(remaining*280-partial)/(rate*.7)*7,(remaining*200-partial)/rate*7,(remaining*160-partial)/(rate*1.3)*7];
    const amount=(t,d)=>Math.min(30,6+24*((t-today)/ms/d));
    const ts=Array.from({length:65},(_,i)=>today+(end-today)*i/64);
    const points=d=>ts.map(t=>[x(t),y(amount(t,d))]);
    const line=ps=>ps.map(([a,b],i)=>(i?'L':'M')+a.toFixed(2)+','+b.toFixed(2)).join(' ');
    svg+='<path d="'+line(points(durations[2]))+' '+points(durations[0]).reverse().map(([a,b])=>'L'+a.toFixed(2)+','+b.toFixed(2)).join(' ')+' Z" fill="#dbe7d6" opacity=".85"/>';
    svg+='<path d="'+line(points(durations[1]))+'" fill="none" stroke="'+g.color+'" stroke-width="2.2" stroke-dasharray="6 5"/>';
    const past=[[utc(2026,6,1),1],[utc(2026,7,1),3],[utc(2026,8,1),4],[utc(2026,9,1),6]];
    svg+='<path d="'+past.map(([t,v],i)=>(i?'L':'M')+x(t)+','+y(v)).join(' ')+'" fill="none" stroke="'+g.color+'" stroke-width="2.3"/>'+past.map(([t,v])=>'<circle cx="'+x(t)+'" cy="'+y(v)+'" r="3" fill="'+g.color+'"><title>'+new Date(t).toISOString().slice(0,10)+': '+v+' books reported</title></circle>').join('');
    const target=x(utc(2027,12,31));
    svg+='<line x1="'+target+'" y1="'+top+'" x2="'+target+'" y2="'+y(0)+'" stroke="#7e8f75" stroke-dasharray="3 4"/>'+text(target+6,top+15,'Target', 'start','#5c6e54',10);
    [[utc(2026,9,8),'Now'],[utc(2027,7,1),'2027'],[utc(2028,7,1),'2028'],[end,'Oct 2029']].forEach(([t,label])=>svg+=text(x(t),h-22,label,t===end?'end':'middle','#687163',10));
  }else{
    svg+='<circle cx="'+x(today)+'" cy="'+y(0)+'" r="4.5" fill="'+g.color+'"><title>8 September 2026: $0 revenue reported</title></circle>';
    svg+=text(left+gw*.6,top+gh*.46,'Finish date unknown','middle','#44513f',w<500?12:15)+text(left+gw*.6,top+gh*.46+23,'No established work → revenue relationship','middle','#687163',w<500?8.5:11);
    [[today,'Now'],[utc(2027,6,1),'Jun 2027'],[end,'Target · Dec 2027']].forEach(([t,label])=>svg+=text(x(t),h-22,label,t===end?'end':'middle','#687163',10));
  }
  return svg+'</svg>';
}
function render(){
  $('#app').innerHTML=({A:VariantA,B:VariantB,C:VariantC})[variant]();
  $('#variant-name').textContent=variant+' · '+names[variant];
  if(!$('#scenario option[value=custom]'))$('#scenario').insertAdjacentHTML('beforeend','<option value="custom" disabled>Edited available time</option>');
  $('#scenario option[value=custom]').hidden=state.scenario!=='custom';
  $('#scenario').value=state.scenario;
  document.body.dataset.variant=variant;document.body.dataset.prototypeState=JSON.stringify(snapshot());
  document.querySelectorAll('[data-chart]').forEach(el=>el.innerHTML=outcomeSVG(goalById(el.dataset.chart),el.clientWidth));
}
function switchVariant(delta){variant=variants[(variants.indexOf(variant)+delta+3)%3];const url=new URL(location.href);url.searchParams.set('variant',variant);history.replaceState(null,'',url);render();}
function comparison(g){return '<div class="comparison"><div>'+dot(g)+' <strong>'+g.short+'</strong><small>'+esc(g.id==='revenue'?'Tue–Fri focus: 60 → 40 min. Friday review: 40 → 10 min.':g.id==='reading'?'Reading amount and timing stay as planned.':'Today’s cancellation stays as planned.')+'</small></div><b>'+minutes(sum(g.planned))+'</b><span>→</span><b class="change-value">'+minutes(sum(g.suggested))+'</b></div>';}
function rationale(){return '<details class="reasoning"><summary>Why consider this change?</summary><div class="evidence-pair"><div><span class="eyebrow">Person’s reports · fictional</span><p>“I have about six hours for my goals this week.”</p><p>“Keep reading and the cancellation. Forty minutes still lets me make useful progress on the work. Ten minutes is enough to review the new feedback.”</p></div><div><span class="eyebrow">Behavioural premise · theory</span><p><strong>COM-B: opportunity includes the external conditions that make action possible.</strong> Here, the reported available time is a concrete constraint. It does not establish a motivation problem.</p></div></div><div class="implication"><span class="eyebrow">Tentative application</span><p>Use the person’s stated useful work sizes to make the remaining commitments fit. The arithmetic establishes time fit, not improved execution or higher revenue.</p><p><strong>What to observe:</strong> whether the planned windows were available and the smaller sessions still produced useful work. There is no result or newly started experiment in this preview.</p></div><details class="reasoning"><summary>Specific source and limits</summary><p><a href="https://link.springer.com/article/10.1186/1748-5908-6-42" target="_blank" rel="noreferrer">Michie, van Stralen & West (2011), The behaviour change wheel</a> · claim:com-b-opportunity · version 2026-09-07.1 · P24 / P7 · grade D, theory.</p><p>The theory motivates considering opportunity. It does not prescribe 40-minute sessions, prove this change will help this person, or establish an hours-to-revenue conversion. Those quantities come from the fictional person’s preferences. This prototype does not run the shared coach or semantic research review.</p></details></details>';}
function capacityBody(focusDay){
  const dayTotals=totals();
  return '<p>Time you can devote to goals after your other commitments. These are editable estimates; this mockup has no connected calendar.</p><form id="capacity-form"><table class="capacity-editor"><thead><tr><th>Day</th><th>Goal time planned</th><th>Time available</th></tr></thead><tbody>'+days.map((d,i)=>'<tr><td><label for="available-'+i+'">'+d+' Sep</label></td><td>'+minutes(dayTotals[i])+'</td><td><label><input id="available-'+i+'" name="day-'+i+'" type="number" min="0" max="1440" step="5" value="'+(state.available?.[i]??'')+'" required'+(focusDay===i?' autofocus':'')+' aria-label="Available minutes on '+d+'"><small>minutes</small></label></td></tr>').join('')+'</tbody></table><p class="source-note">Fictional time estimate · Monday’s reported work stays unchanged. Empty fields mean time is unknown, not zero; enter an explicit 0 for no available time.</p><div class="dialog-actions"><button class="primary" type="submit">Save example availability</button><button type="button" data-unknown>Time is unknown</button></div></form>';
}
function proposalBody(){
  return '<p>Example suggestion · '+minutes(planned())+' is planned, with '+minutes(available())+' available. This changes the remaining work in the current week.</p><div class="comparison heading"><span>Goal · scope of change</span><span>Current</span><span></span><span>Suggested</span></div>'+goals.map(comparison).join('')+'<div class="comparison"><strong>Time for all goals</strong><b>7h 50m</b><span>→</span><b class="change-value">6h</b></div><p class="source-note">Monday’s reported work is preserved. Reading’s forecast stays unchanged. Revenue still has no defensible finish date. No calendar booking is moved by this example.</p><div class="dialog-actions"><button class="primary" data-apply>Try this example</button><button data-decline>No thanks</button><button data-open="coach">Discuss</button><button data-open="capacity">Edit available time</button></div>'+rationale();
}
function openDialog(type,extra,focus){
  const dialog=$('#details');dialogType=type;dialog.classList.toggle('workspace-dialog',type==='workspace');let title='',kind='',body='';
  if(type==='capacity'){title='Time for your goals';kind='This week · 7–13 September';body=capacityBody(extra);}
  if(type==='proposal'){
    if(!proposalReady())return openDialog('coach');
    title='Make the remaining week fit';kind='Suggested adjustment · not applied';body=proposalBody();
  }
  if(type==='forecast'){title='How the reading estimate works';kind='Conditional scenario · illustrative arithmetic';body='<p>The estimate connects reported pages to the remaining books. It is separate from time reserved in the calendar.</p><div class="snapshot-stat"><b>12 pages</b><span>per reported planned day · 60 pages across 5 reports</span></div><div class="comparison"><div><strong>Assumed future pace</strong><small>Five reading days per week</small></div><span></span><span></span><b>60 p/wk</b></div><div class="comparison"><div><strong>Assumed length per book</strong><small>160–280 pages in the wider scenarios</small></div><span></span><span></span><b>200 p</b></div><div class="comparison"><div><strong>Central finish estimate</strong><small>6 books reported finished; 100 pages into the next</small></div><span></span><span></span><b>Mar 2028</b></div><p class="source-note">Fast/slow scenarios also vary future pace by ±30%. These are illustrative assumptions, not measured personal uncertainty or a calibrated confidence interval. The unreported day is excluded from the reported mean; this can bias the pace if reporting is selective. The last reported outcome is carried forward to today solely to anchor the scenario.</p>';}
  if(type==='relationship'){title='Work is known. The return is not.';kind='Business goal · input and outcome';body='<div class="snapshot-stat"><b>185 minutes</b><span>of focused work reported · 5 of 6 planned days reported</span></div><div class="snapshot-stat"><b>$0</b><span>revenue reported · 8 September</span></div><p>These are different measures. No reliable relationship or finish date can be estimated from this example. Later results could help evaluate an association while accounting for delays, other work and missing reports.</p><p>Working more minutes does not itself record more revenue or establish that the work caused an outcome.</p><div class="dialog-actions"><button data-goal="revenue">Open the business goal →</button></div>';}
  if(type==='outlook'){const g=goalById(extra);title=g.title;kind='Goal outcome · '+g.area;body=preview(g);}
  if(type==='state'){title='Prototype state';kind='Browser memory · no persistence';body='<p>The overview and its open goal share reports, plan status and outcome in this browser session. Calendar allocations remain a separate example.</p><pre>'+esc(JSON.stringify(snapshot(),null,2))+'</pre>';}
  if(type==='coach'){title='Coach';kind='Conversation mockup · no AI connected';body='<div class="chat-context"><span>Context:</span>'+goals.map(g=>'<button class="text-button" data-goal="'+g.id+'">'+g.short+'</button>').join('')+'</div><p>The same coach would handle the trade-off across these goals. You can try the conversation entry here; messages remain local and do not generate advice.</p>'+state.messages.map(m=>'<div class="chat-message">'+esc(m)+'</div>').join('')+'<form id="coach-form"><textarea name="message" placeholder="What should Adler know about this week?" aria-label="Message to coach" required></textarea><div class="dialog-actions"><button class="primary" type="submit">Add demo message ↑</button></div></form>';}
  if(type==='workspace'){const g=goalById(extra);title=g.title;kind='All goals / Goal · plan & learning';body='<iframe class="workspace-frame" title="'+esc(g.title)+' evolving plan prototype" src="goal-workspace-v2.html?variant=C&goal='+g.id+(focus?'&focus='+encodeURIComponent(focus):'')+'"></iframe>';}
  $('#dialog-title').textContent=title;$('#dialog-kind').textContent=kind;$('#dialog-body').innerHTML=body;
  if(!dialog.open)dialog.showModal();
  $('#dialog-body').querySelectorAll('[data-chart]').forEach(el=>el.innerHTML=outcomeSVG(goalById(el.dataset.chart),el.clientWidth));
  const frame=dialog.querySelector('iframe');
  if(frame)frame.onload=()=>{
    // Keep the chosen C composition intact; the parent supplies the breadcrumb and close control.
    const doc=frame.contentDocument,style=doc.createElement('style');
    style.textContent='.app-header,.variant-switcher{display:none!important}#app{padding-top:22px;padding-bottom:40px}';
    doc.head.append(style);
  };
}
document.addEventListener('click',event=>{
  const el=event.target.closest('button,a');if(!el)return;
  if(el.dataset.open){event.preventDefault();openDialog(el.dataset.open);}
  if(el.dataset.goal){event.preventDefault();openDialog('workspace',el.dataset.goal,el.dataset.focus);}
  if(el.dataset.outlook){openDialog('outlook',el.dataset.outlook);}
  if(el.dataset.select){state.selectedGoal=el.dataset.select;render();}
  if(el.dataset.day!==undefined)openDialog('capacity',Number(el.dataset.day));
  if(el.hasAttribute('data-apply')){state.applied=true;state.declined=false;$('#details').close();render();notice('Example plan updated. Reports, outcomes and forecasts are unchanged.');}
  if(el.hasAttribute('data-decline')){state.declined=true;$('#details').close();render();notice('Suggestion declined in this example. Your plan is unchanged.');}
  if(el.hasAttribute('data-unknown')){state.available=null;state.scenario='unknown';$('#details').close();render();}
});
document.addEventListener('submit',event=>{
  if(event.target.id==='capacity-form'){event.preventDefault();const form=new FormData(event.target);state.available=days.map((_,i)=>Number(form.get('day-'+i)));state.scenario='custom';$('#details').close();render();notice('Available time updated in this example.');}
  if(event.target.id==='coach-form'){event.preventDefault();const message=new FormData(event.target).get('message').trim();if(!message)return;state.messages.push(message);render();openDialog('coach');}
});
$('#previous').onclick=()=>switchVariant(-1);$('#next').onclick=()=>switchVariant(1);
$('#close').onclick=()=>$('#details').close();
$('#details').addEventListener('close',()=>{$('#dialog-body').innerHTML='';dialogType='';});
$('#reset').onclick=()=>{state=initialState();render();notice('Examples reset.');};
$('#scenario').onchange=event=>{state.scenario=event.target.value;state.available=state.scenario==='unknown'?null:state.scenario==='roomy'?[110,120,110,110,150,0,0]:[80,90,60,60,70,0,0];state.declined=false;render();};
document.addEventListener('keydown',event=>{if($('#details').open||event.target.closest('input,textarea,select,[contenteditable]'))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();switchVariant(event.key==='ArrowLeft'?-1:1);}});
window.addEventListener('popstate',()=>{const key=new URLSearchParams(location.search).get('variant');variant=variants.includes(key)?key:'A';render();});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{render();$('#dialog-body').querySelectorAll('[data-chart]').forEach(el=>el.innerHTML=outcomeSVG(goalById(el.dataset.chart),el.clientWidth));},100);});
render();
