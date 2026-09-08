// Disposable UI study. These fixtures and scenarios are not an AI coach or validated forecasts.
const variants=['A','B','C'];
const names={A:'Connected timeline',B:'Today in focus',C:'The evolving plan'};
const params=new URLSearchParams(location.search);
let variant=variants.includes(params.get('variant'))?params.get('variant'):'C';
let goal=['reading','revenue','day'].includes(params.get('goal'))?params.get('goal'):'reading';
let selectedAction='read',selectedDay=8,windowOffset=0,stage='current',lastUndo=null,noticeTimer;
const fixtures={
  reading:{
    title:'Read 30 books',category:'Learning',targetLabel:'Target · 31 Dec 2027',outcome:6,total:30,outcomeUnit:'books',
    outcomeDate:'1 Sep',milestone:'Finish book 7',nextMilestone:'Finish book 8',milestoneUnit:'pages',basePages:40,
    actions:[
      {id:'read',title:'Read 20 pages',unit:'pages',shortUnit:'p',target:20,cue:'After lunch',beforeCue:'In the evening',repeat:'Weekdays',days:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28],reports:{1:20,2:8,3:0,4:12,7:20}},
      {id:'choose',title:'Choose the next book',milestone:'Finish book 8',unit:'book chosen',shortUnit:'',target:1,cue:'Before the current book ends',repeat:'Once',days:[15],reports:{}}
    ],
    change:{actionId:'read',before:'In the evening',after:'After lunch',start:7,review:14,title:'Find a more reliable reading window',
      observation:'My evenings keep running late. My lunch break is usually free.',observationDate:'4 Sep',
      context:'After lunch, at the kitchen table, works for me.',contextDate:'6 Sep',
      inference:'The available window may be the constraint. Lunch is a user-reported opening worth trying.',
      hypothesis:'If reading follows lunch, more planned sessions may start. We will also check whether that window actually stayed available.',
      feedback:'I read 20 pages after lunch. The break stayed free.',feedbackDate:'7 Sep',originalPrediction:'More planned reading sessions will start after lunch, without increasing the amount.'}
  },
  revenue:{
    title:'Reach $100k in revenue',category:'Business',targetLabel:'Target · 31 Dec 2027',outcome:0,total:100000,outcomeUnit:'revenue',
    outcomeDate:'8 Sep',milestone:'First $1,000 reported',nextMilestone:'Reach $10,000',milestoneUnit:'revenue',
    actions:[
      {id:'focus',title:'60 minutes of focused work',unit:'minutes',shortUnit:'m',target:60,cue:'After breakfast',beforeCue:'In the afternoon',repeat:'Weekdays',days:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28],reports:{1:60,2:25,3:0,4:40,7:60}},
      {id:'feedback',title:'Review customer feedback',unit:'review',shortUnit:'',target:1,cue:'Friday afternoon',repeat:'Fridays',days:[4,11,18,25],reports:{4:1}}
    ],
    change:{actionId:'focus',before:'In the afternoon',after:'After breakfast',start:7,review:14,title:'Protect a workable focus window',
      observation:'Meetings displaced my afternoon work twice this week.',observationDate:'4 Sep',
      context:'I can usually protect the hour after breakfast. I want to use it for the same work.',contextDate:'6 Sep',
      inference:'Meeting conflicts suggest an opportunity constraint. The user has identified an alternative window.',
      hypothesis:'If the chosen work follows breakfast, fewer sessions may be displaced. Revenue remains a separate, delayed result.',
      feedback:'The morning window stayed free. I worked for 60 minutes.',feedbackDate:'7 Sep',originalPrediction:'Fewer focused-work sessions will be displaced by meetings, with the chosen work unchanged.'}
  },
  day:{
    title:'Cancel my unused subscription',category:'Personal admin',targetLabel:'Today · before 6 pm',outcome:0,total:1,outcomeUnit:'confirmation',
    outcomeDate:'Not yet reported',milestone:'Cancellation confirmed',nextMilestone:null,
    actions:[
      {id:'find',title:'Find the subscription details',unit:'step completed',shortUnit:'',target:1,cue:'11 am',beforeCue:'11 am',repeat:'Once',days:[11],reports:{11:1}},
      {id:'cancel',title:'Cancel the subscription',unit:'step completed',shortUnit:'',target:1,cue:'5 pm',beforeCue:'5 pm',repeat:'Once',days:[17],reports:{}}
    ],change:null
  }
};
let state;
function initialState(){return Object.fromEntries(Object.entries(fixtures).map(([id,g])=>[id,{outcome:g.outcome,outcomeDate:g.outcomeDate,outcomeHistory:[],contributions:id==='reading'?{read:{1:7,2:7,3:7,4:7,7:7}}:{},reports:Object.fromEntries(g.actions.map(a=>[a.id,{...a.reports}])),used:g.change?{[g.change.actionId]:{7:true}}:{},edits:[],bookings:{},messages:[]}]));}
state=(window.parent!==window&&window.parent.getGoalWorkspaceState?.())||initialState();
function f(){return fixtures[goal];}
function s(){return state[goal];}
function currentBook(){return Math.min(31,s().outcome+1);}
function milestoneName(){return goal==='reading'?(currentBook()>30?'Reading goal complete':'Finish book '+currentBook()):f().milestone;}
function nextMilestoneName(){return goal==='reading'?(currentBook()<30?'Finish book '+(currentBook()+1):null):f().nextMilestone;}
function selectedMilestoneName(){if(action().milestone)return action().milestone;const book=s().contributions?.[selectedAction]?.[selectedDay];return goal==='reading'&&book?'Finish book '+book:milestoneName();}
function action(){return f().actions.find(a=>a.id===selectedAction)||f().actions[0];}
function esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function resetSelection(){selectedAction=goal==='day'?'cancel':f().actions[0].id;selectedDay=goal==='day'?17:8;windowOffset=0;stage='current';}
resetSelection();
function date(day){return new Date(Date.UTC(2026,8,day));}
function shortDate(d){return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(d).replace('Sept','Sep');}
function monthYear(d){return new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}).format(d);}
function iso(d){return d.toISOString().slice(0,10);}
function addDays(d,n){return new Date(d.getTime()+n*86400000);}
function dayLabel(day){return goal==='day'?((day>12?day-12:day)+(day>=12?' pm':' am')):(day===8?'Today · 8 Sep':shortDate(date(day)));}
function amountLabel(n,a=action()){return a.target===1?(n===1?'Done':n===0?'Didn’t happen':'No report'):n+' '+a.unit;}
function future(day){return goal!=='day'&&day>8;}
function report(a=action(),day=selectedDay){return s().reports[a.id][day];}
function actionName(a=action(),day=selectedDay){const target=settings(a,day).target;return a.id==='read'?'Read '+target+' pages':a.id==='focus'?target+' minutes of focused work':a.title;}
function editsFor(a,day){return s().edits.filter(e=>e.actionId===a.id&&(e.scope==='future'?day>=e.day:day===e.day));}
function settings(a=action(),day=selectedDay){const e=editsFor(a,day).at(-1);return {cue:e?.cue||(goal!=='day'&&day<7?a.beforeCue:a.cue),target:e?.target||a.target};}
function bookPages(){const book=currentBook();return (book===7?40:0)+Object.entries(s().reports.read||{}).reduce((n,[d,v])=>n+(s().contributions.read?.[d]===book?v:0),0);}
function stats(a=action()){
  const eligible=a.days.filter(d=>goal==='day'||d<=8);
  const reported=eligible.filter(d=>s().reports[a.id][d]!==undefined);
  const sum=reported.reduce((n,d)=>n+s().reports[a.id][d],0);
  const completed=reported.filter(d=>s().reports[a.id][d]>=settings(a,d).target).length;
  return {eligible:eligible.length,reported:reported.length,sum,completed,rate:reported.length?sum/reported.length:0,unknown:eligible.length-reported.length};
}
function projection(){
  if(goal!=='reading')return null;
  const rate=stats(f().actions[0]).rate*5;
  if(!rate||s().outcome>=30)return null;
  const remaining=30-s().outcome,partial=bookPages();
  const estimate=(length,pace)=>Math.max(0,remaining*length-partial)/pace*7;
  const days=estimate(200,rate),fast=estimate(160,rate*1.3),slow=estimate(280,rate*.7);
  return {rate,days,fast,slow,date:addDays(date(8),days),early:addDays(date(8),fast),late:addDays(date(8),slow)};
}
function milestoneRange(){
  const p=projection();if(!p)return null;
  const remaining=Math.max(0,200-bookPages());
  const a=f().actions[0],plannedRate=a.days.filter(d=>d>=8&&d<15).reduce((n,d)=>n+settings(a,d).target,0);
  return {early:8+Math.ceil(remaining/(p.rate*1.3)*7),late:8+Math.ceil(remaining/(p.rate*.7)*7),current:8+Math.ceil(remaining/p.rate*7),planned:plannedRate?8+Math.ceil(remaining/plannedRate*7):null,reportedRate:p.rate,plannedRate};
}
function windowDays(){
  if(goal==='day')return [9,11,13,15,17,19];
  if(variant==='C'&&stage==='before')return [1,2,3,4,5,6];
  const mobile=innerWidth<=650,narrow=innerWidth<=900;
  const count=variant==='C'?(mobile?8:narrow?14:21):(mobile?5:narrow?7:variant==='A'?21:14);
  const first=Math.max(1,(variant==='C'?1:mobile?7:narrow?5:1)+windowOffset);
  return Array.from({length:count},(_,i)=>first+i);
}

function planSignals(){
  return goalPlanSignals(f().actions.map(a=>({days:a.days,reports:s().reports[a.id],target:d=>settings(a,d).target})),goal==='day'?14:7,{oneDay:goal==='day'});
}

function publishOverview(){
  if(window.parent===window||!window.parent.updateGoalWorkspaceState)return;
  window.parent.updateGoalWorkspaceState(JSON.parse(JSON.stringify(state)),goal,{
    signals:planSignals(),reports:Object.entries(s().reports[f().actions[0].id]).map(([d,n])=>[Number(d),n]),
    inputTargets:f().actions[0].days.filter(d=>d<=8).map(d=>[d,settings(f().actions[0],d).target]),
    supportingSteps:goal==='day'?f().actions.map(a=>a.days.every(d=>s().reports[a.id][d]>=settings(a,d).target)):null,
    outcome:s().outcome,outcomeDate:s().outcomeDate,milestone:milestoneName(),
    milestoneDetail:goal==='reading'?bookPages()+' / 200 pages reported':null,milestoneProjection:milestoneRange(),projection:projection()
  });
}
function header(){
  const g=f(),value=goal==='revenue'?'$'+s().outcome.toLocaleString():s().outcome;
  const denom=goal==='revenue'?' / $100k':goal==='day'?' / 1 confirmed':' / 30 books';
  return '<div class="goal-heading"><div><span class="eyebrow">Goal <span class="separator">/</span> '+g.category+'</span><div class="goal-title-line"><h1>'+g.title+'</h1>'+goalStreakBadge(planSignals(),goal)+'</div><p>'+g.targetLabel+'</p></div><div class="outcome-value"><button data-dialog="outcome" aria-label="Update reported goal outcome">'+value+'<span>'+denom+'</span></button><small>'+(goal==='day'?(s().outcome?'Reported cancellation':'Confirmation not reported'):'Reported outcome · '+s().outcomeDate)+'</small></div></div>';
}
function outcomePanel(){
  const p=projection();let label;
  if(goal==='reading')label=s().outcome>=30?'Goal completion reported':p?'At this reported pace · <strong>'+monthYear(p.date)+'</strong>':'Finish estimate needs a recorded reading rate';
  else if(goal==='revenue')label='<strong>Finish date still unknown</strong> · work is being tracked';
  else label='<strong>'+(s().outcome?'Cancellation reported':'Planned: 5 pm')+'</strong> · target: 6 pm';
  return '<section class="outcome-panel" aria-label="Goal outcome and conditional projection"><div class="forecast-heading"><span>'+label+'</span><button class="text-button" data-dialog="projection">'+(goal==='reading'?'How this is estimated ↗':goal==='revenue'?'What we’re learning ↗':'What counts as done ↗')+'</button></div><div class="graph outcome-graph" data-graph="outcome"></div><div class="graph-key"><span class="key"><i class="line-key"></i>Reported outcome</span>'+(p?'<span class="key"><i class="line-key dashed"></i>Estimate</span><span class="key"><i class="line-key range"></i>Scenario range</span>':'')+'<span class="caption">'+(goal==='reading'?'Conditional on reading rate and book length':goal==='revenue'?'Work time and revenue stay separate':'A completed step does not confirm cancellation')+'</span></div></section>';
}
function windowControls(){
  const days=windowDays();return '<div class="window-nav">'+(goal==='day'?'<span>Today · 8 Sep</span>':'<button data-window="-1" aria-label="Earlier dates">‹</button><span>'+shortDate(date(days[0])).replace(' Sep','')+'–'+shortDate(date(days.at(-1)))+'</span><button data-window="1" aria-label="Later dates">›</button><button class="today-button" data-window="0">Today</button>')+'</div>';
}
function workTitle(label='Your plan'){return '<div class="section-title"><div><span class="eyebrow">Plan</span><h2>'+label+'</h2></div>'+windowControls()+'</div>';}
function attempt(a,d){
  if(!a.days.includes(d))return '<div class="attempt-slot">'+(goal!=='day'&&a.repeat!=='Once'?'<span class="planned-off-day" title="No action planned · a planned day off can continue an intact run" aria-label="No action planned on '+d+' September">○</span>':'<span class="empty-slot"></span>')+'</div>';
  const n=report(a,d),target=settings(a,d).target,upcoming=future(d)||goal==='day'&&d>14;
  const status=n!==undefined?(n===0?'missed':n>=target?'full':'partial'):(upcoming?'planned':'unknown');
  const actual=n!==undefined;
  const text=actual?(n===0?'×':a.target===1?'✓':String(n)):(upcoming?'·':'?');
  const sub=actual&&n>0?(a.target===1?'':a.shortUnit):upcoming?'plan':'';
  const selected=selectedAction===a.id&&selectedDay===d;
  const label=actionName(a,d)+', '+dayLabel(d)+', '+(actual?amountLabel(n,a)+' reported':upcoming?'planned, '+target+' '+a.unit:'no report yet');
  return '<div class="attempt-slot"><button class="attempt '+status+(selected?' selected':'')+'" style="--fill:'+Math.min(100,n/target*100)+'%" data-attempt="'+a.id+':'+d+'" aria-pressed="'+selected+'" aria-label="'+esc(label)+'"><b>'+text+'</b>'+(sub?'<span class="attempt-status">'+sub+'</span>':'')+'</button></div>';
}
function streakLane(days){
  const signal=planSignals();if(goal==='day')return '';
  const first=signal.through-signal.run+1;
  return '<div class="streak-lane"><div class="row-label"><strong>Streak</strong>'+(signal.unconfirmed?'<small>Report needed</small>':'')+'</div><div class="days">'+days.map(d=>{
    const active=!signal.unconfirmed&&signal.run&&d>=first&&d<=signal.through,off=!f().actions.some(a=>a.days.includes(d));
    return '<div class="streak-day '+(active?'active ':'')+(off?'off':'')+'" title="'+d+' Sep · '+(active?(off?'planned day off within the streak':'all due actions met'):d>signal.through?'day still open or upcoming':'outside the current streak')+'"><i></i></div>';
  }).join('')+'</div></div>';
}
function timeline(){
  const days=windowDays(),first=days[0],last=days.at(-1),count=days.length;
  const x=d=>Math.max(0,Math.min(100,(d-first+.5)/count*100));
  const weekday=d=>new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'UTC'}).format(date(d));
  let html='<div class="timeline" style="--count:'+count+'"><div class="date-row"><div class="row-label"><span class="eyebrow">'+(goal==='day'?'One-day plan':stage==='before'?'Earlier work':'Current work')+'</span></div><div class="days">'+days.map(d=>'<div class="day-title '+(d===8&&goal!=='day'?'is-today':'')+'">'+(goal==='day'?'Today':weekday(d))+'<b>'+(goal==='day'?dayLabel(d):d)+'</b></div>').join('')+'</div></div>';
  if(goal!=='day'&&!(variant==='C'&&stage==='before')){
    const r=stage==='before'&&variant==='C'?null:milestoneRange();
    let track;
    if(goal==='reading'&&r&&bookPages()<200){
      const rangeVisible=r.late>=first&&r.early<=last;
      const note='Finish '+shortDate(date(r.early)).replace(' Sep','')+'–'+shortDate(date(r.late));
      track='<div class="milestone-track"><div class="milestone-span" style="left:0;width:'+x(Math.min(r.early,last))+'%"></div>'+(rangeVisible?'<button class="milestone-range" data-dialog="milestone" style="left:'+x(r.early)+'%;width:'+Math.max(2,x(r.late)-x(r.early))+'%" aria-label="'+note+'"></button>':'')+'<button class="milestone-range-label text-button" style="right:3px" data-dialog="milestone">'+note+(r.late>last?' →':'')+'</button></div>';
    }else track='<div class="milestone-track no-date"><button class="text-button" data-dialog="milestone">'+(goal==='reading'?'Page target reached · confirm finishing the book':'Date depends on reported revenue')+'</button></div>';
    html+='<div class="milestone-row"><div class="row-label"><span class="eyebrow">Milestone · current</span><strong>'+milestoneName()+'</strong><small>'+(goal==='reading'?bookPages()+' / 200 pages reported':'$'+s().outcome.toLocaleString()+' / $1,000 reported')+'</small></div>'+track+'</div>';
  }
  html+=f().actions.map(a=>'<div class="action-row '+(a.id===selectedAction?'active':'')+'"><div class="row-label"><button class="action-label" data-select-action="'+a.id+'"><span class="eyebrow">Action'+(a.repeat!=='Once'?' · ongoing':'')+'</span><strong>'+esc(actionName(a,stage==='before'?4:8))+'</strong><small>'+esc(settings(a,stage==='before'?4:8).cue)+' · '+a.repeat+'</small></button></div><div class="days">'+days.map(d=>attempt(a,d)).join('')+'</div></div>').join('');
  html+=streakLane(days);
  const c=f().change;
  if(c&&!(variant==='C'&&stage==='before')){
    const visible=c.review>=first&&c.start<=last;
    html+='<div class="change-row"><div class="row-label">Adler’s adjustment</div><div class="change-track">'+(visible?'<button class="change-period" data-dialog="learning" style="left:'+x(c.start)+'%;width:'+Math.max(13,x(c.review)-x(c.start))+'%">'+(innerWidth<650?'New timing':c.before+' → '+c.after)+'</button>':'<button class="change-period" data-dialog="learning" style="left:0;max-width:95%">Timing test · '+c.start+'–'+c.review+' Sep</button>')+(c.review>=first&&c.review<=last?'<button class="review-marker" data-dialog="learning" style="right:'+Math.max(0,100-x(c.review)-3)+'%">⚑ Review</button>':'')+'</div></div>';
  }
  html+='</div><div class="timeline-footer"><div class="mini-legend"><span><i>■</i>Done</span><span><i>◧</i>Partial</span><span><i>×</i>Didn’t happen</span><span><i>?</i>No report</span><span><i>·</i>Planned</span>'+(goal!=='day'?'<span><i>○</i>Day off</span>':'')+'</div>'+(nextMilestoneName()?'<span class="continuation">→ '+nextMilestoneName()+' · same '+(goal==='reading'?'reading':'work')+' action continues</span>':'')+'</div>';
  return html;
}
function controls(){
  const disabled=future(selectedDay)?' disabled':'',n=report(),a=action();
  const booked=s().bookings[a.id+':'+selectedDay],historical=variant==='C'&&(stage==='before'||goal!=='day'&&selectedDay<8);
  return '<div class="report-controls"><button class="primary" data-dialog="report"'+disabled+'>✓ '+(n!==undefined?'Edit report':a.target===1?'Done':'Report amount')+'</button><button data-miss'+disabled+'>× Didn’t happen</button>'+(historical?'<button data-stage="current">Return to current plan</button>':'<button data-dialog="edit">Edit plan</button><button class="calendar-control" data-dialog="calendar">'+(booked?'▦ View booking':'▦ Add to calendar')+'</button>')+'</div>';
}

function inputSection(large=false){
  const a=action(),cutoff=variant==='C'&&stage==='before'?6:7,targets=a.days.map(d=>[d,settings(a,d).target]),t=goalInputComparison(targets,s().reports[a.id],goal==='day'?14:cutoff);
  const note=!t.count&&!t.unknown?'Not due yet':t.unknown?t.unknown+' past report'+(t.unknown===1?'':'s')+' missing':t.below?t.below+' '+a.unit+' below plan'+(t.above?' · '+t.above+' extra elsewhere':''):t.above?t.above+' '+a.unit+' above plan':'Planned amount met';
  return '<div class="input-section"'+(variant==='C'?' id="input"':'')+'><div class="input-summary"><strong>'+(a.target===1?'Action progress':a.unit.charAt(0).toUpperCase()+a.unit.slice(1)+' per planned day')+'</strong><span>'+(goal==='day'?'Through 2 pm':'Through '+cutoff+' Sep')+'</span></div><div class="plan-comparison"><span>'+(t.count?'<b>'+t.reported+'</b> reported <span class="comparison-divider">/</span> <b>'+t.planned+'</b> '+a.unit+' planned'+(t.unknown?' on reported days':''):t.unknown?'No quantities reported yet':'Next planned · '+dayLabel(a.days.find(d=>d>(goal==='day'?14:7))||a.days.at(-1)))+'</span><span class="quantity-gap '+(!t.count||t.unknown?'unknown':t.below?'below':t.above?'above':'met')+'">'+note+'</span></div><div class="graph input-graph" data-graph="input" data-large="'+large+'"></div><div class="input-legend"><span><i class="sample-line"></i>Reported</span><span><i class="sample-line planned"></i>Planned</span>'+(t.below?'<span><i class="sample-gap"></i>Below plan</span>':'')+(t.above?'<span><i class="sample-gap above"></i>Above plan</span>':'')+'<span class="graph-instruction">Select a report to inspect it</span></div></div>';
}

function selectedWork(withGraph=true){
  const a=action(),n=report(),cfg=settings(),booked=s().bookings[a.id+':'+selectedDay];
  const stateText=n!==undefined?amountLabel(n)+' reported':future(selectedDay)||goal==='day'&&selectedDay>14?'Planned · '+cfg.target+' '+a.unit:'No report yet';
  return '<div class="selected-work"><div><div class="selection-path">Goal · '+f().title+(goal==='day'?'':' <span class="separator">›</span> Milestone · '+selectedMilestoneName())+'</div><div class="selection-date"><span class="dot"></span>'+dayLabel(selectedDay)+'</div> <h3>'+esc(actionName(a))+'</h3>'+(goal!=='day'&&selectedMilestoneName()!==milestoneName()?'<small class="selection-milestone">Milestone · '+selectedMilestoneName()+'</small>':'')+'<p>'+stateText+' <span class="separator">·</span> '+esc(cfg.cue)+(booked?' · calendar booked':'')+'</p>'+controls()+'</div>'+(withGraph?inputSection():'')+'</div>';
}
function changedByEdit(){return f().change&&s().edits.some(e=>e.actionId===f().change.actionId);}
function learningNote(){
  const c=f().change;
  return '<div class="learning-note"><span class="small-icon">⌁</span><div><strong>'+(c?(changedByEdit()?'Plan edited · revisit the current test':c.before+' → '+c.after):'A small goal, with a clear finish')+'</strong><small>'+(c?'Testing whether this window fits. Review '+c.review+' Sep · '+(changedByEdit()?'earlier prediction preserved':'no conclusion yet'):'Report the cancellation confirmation to finish this goal.')+'</small></div><button data-dialog="'+(c?'learning':'outcome')+'">'+(c?'Why this change ↗':'Record result')+'</button></div>';
}
function basisLine(){
  if(goal==='reading'&&action().id==='read'){
    const r=milestoneRange();
    if(s().outcome>=30)return '<div class="linked-basis"><strong>Goal completion reported</strong><button class="text-button" data-dialog="outcome">View result ↗</button></div>';
    if(bookPages()>=200)return '<div class="linked-basis"><strong>Estimated pages reached · finished the book?</strong><button class="text-button" data-dialog="outcome">Report the result ↗</button></div>';
    if(r){
      const shift=r.planned===null?null:r.current-r.planned;
      return '<div class="milestone-implication"><div class="implication-heading"><span><small>Next milestone</small><strong>'+milestoneName()+'</strong></span><button class="text-button" data-dialog="milestone">'+bookPages()+' / 200 pages ↗</button></div><div class="pace-comparison"><div><small>At planned pace · '+Math.round(r.plannedRate)+' p/week</small><strong>'+(r.planned===null?'No estimate':shortDate(date(r.planned)))+'</strong></div><span class="pace-shift '+(shift>0?'later':'earlier')+'" aria-label="'+(shift===null?'Comparison unavailable':shift===0?'Same estimated date':Math.abs(shift)+' days '+(shift>0?'later':'earlier')+' at reported pace')+'"><i></i><b>'+(shift===null?'—':shift===0?'Same date':(shift>0?'+':'−')+Math.abs(shift)+' days')+'</b><i></i></span><div><small>At reported pace · '+Math.round(r.reportedRate)+' p/week</small><strong>'+shortDate(date(r.current))+'</strong></div></div><div class="implication-footer"><button class="text-button" data-dialog="projection">If this pace continues · '+shortDate(date(r.early))+'–'+shortDate(date(r.late))+' range ↗</button><button data-dialog="coach">Review with Coach ↗</button></div></div>';
    }
    return '<div class="linked-basis"><span>No reading pace to estimate from yet.</span><button class="text-button" data-dialog="coach">Review with Coach ↗</button></div>';
  }
  if(goal==='revenue')return '<div class="linked-basis outcome-implication"><span><small>Next milestone</small><strong>'+milestoneName()+'</strong></span><span>Work tracked → revenue relationship still unknown</span><button class="text-button" data-dialog="coach">Review work & results ↗</button></div>';
  if(goal==='day')return '<div class="linked-basis"><span>'+ (s().outcome?'Cancellation reported.':'The goal needs cancellation confirmation.')+'</span><button class="text-button" data-dialog="outcome">'+(s().outcome?'View result':'Report confirmation')+' ↗</button></div>';
  return '<div class="linked-basis"><span>'+actionName()+' → '+milestoneName()+'</span><button class="text-button" data-dialog="coach">Discuss with Coach ↗</button></div>';
}

function renderA(){return header()+outcomePanel()+workTitle()+'<div class="work-area">'+selectedWork()+'<div class="timeline-wrap">'+timeline()+'</div></div>'+learningNote()+basisLine();}
function agenda(){
  return '<div class="focus-agenda"><span class="eyebrow">Other work in this plan</span>'+f().actions.filter(a=>a.id!==selectedAction).map(a=>'<button class="agenda-action" data-select-action="'+a.id+'"><span class="agenda-line">○</span><span><strong>'+actionName(a)+'</strong><small>'+a.repeat+' · '+a.cue+'</small></span><span>↗</span></button>').join('')+'</div>';
}
function renderB(){
  return '<div class="variant-b"><aside class="focus-column"><span class="eyebrow">Your next action</span><div class="focus-date">'+(selectedDay===8||goal==='day'?'Tuesday, 8 Sep':dayLabel(selectedDay))+'</div><small>One action, with the whole goal in view.</small>'+selectedWork(false)+learningNote()+agenda()+'</aside><section>'+header()+outcomePanel()+workTitle('Where this work leads')+'<div class="work-area">'+timeline()+inputSection()+'</div>'+basisLine()+'</section></div>';
}
function stageData(){
  const c=f().change;
  if(!c)return {};
  const firstUse=Object.entries(s().used[c.actionId]||{}).filter(([d,v])=>v===true&&Number(d)>=c.start&&Number(d)<=8).map(([d])=>Number(d)).sort((a,b)=>a-b)[0];
  return {
    before:{time:'1–6 Sep · earlier plan',title:c.before,detail:'Original timing and its reports',status:'Earlier'},
    proposal:{time:'6 Sep · agreed change',title:'Move '+(goal==='reading'?'reading':'focused work')+' to '+c.after.toLowerCase(),detail:'Your reports + the saved scientific rationale',status:'Agreed'},
    current:{time:firstUse?firstUse+' Sep · first reported use':'7 Sep · planned start',title:c.after,detail:usedCount()+' reported use'+(usedCount()===1?'':'s')+' · effect still uncertain',status:changedByEdit()?'Plan edited':usedCount()?'Learning':'Use not reported'},
    review:{time:'14 Sep · next review',title:'Decide what to keep',detail:'Review sooner if circumstances change',status:'Upcoming'}
  };
}
function usedCount(){
  const c=f().change;
  return c?Object.entries(s().used[c.actionId]||{}).filter(([d,v])=>Number(d)>=c.start&&Number(d)<=8&&v===true).length:0;
}
function reviewEvidence(){
  const c=f().change;
  return c?JSON.stringify({reports:s().reports[c.actionId],used:s().used[c.actionId],edits:s().edits.filter(e=>e.actionId===c.actionId)}):'';
}
function learningSummary(){
  if(!f().change)return '';
  if(s().review?.evidence!==undefined&&s().review.evidence!==reviewEvidence())return 'Evidence changed · revisit your earlier decision';
  if(changedByEdit())return 'Plan edited · revisit what this test applies to';
  if(s().review)return 'Keeping this arrangement by your choice · explanation still uncertain';
  return usedCount()?usedCount()+' reported use'+(usedCount()===1?'':'s')+' · still learning':'First use has not been reported';
}
function milestoneFocus(){
  if(goal==='day')return '<div class="current-milestone"><div><span class="eyebrow">Goal · today</span><h2>'+(s().outcome?'Cancellation confirmed':'Cancellation by 6 pm')+'</h2><p>'+f().actions.filter(a=>report(a,a.days[0])!==undefined&&report(a,a.days[0])>=1).length+' of 2 actions reported complete</p></div><button data-dialog="outcome">'+(s().outcome?'View result':'Report confirmation')+' ↗</button></div>';
  const historical=stage==='before',r=milestoneRange();
  const pages=historical?40+Object.entries(s().reports.read||{}).filter(([d])=>Number(d)<7).reduce((n,[,v])=>n+v,0):goal==='reading'?bookPages():null;
  let outlook=historical?'<span class="history-state">Earlier plan · reports through 6 Sep</span>':goal==='reading'&&s().outcome>=30?'<strong>Goal completion reported</strong>':goal==='reading'&&pages>=200?'<button data-dialog="outcome">Finished this book? ↗</button>':r?'<div class="focus-outlook"><button class="focus-paces" data-dialog="projection"><span><small>At plan pace</small><strong>'+(r.planned===null?'Unknown':shortDate(date(r.planned)))+'</strong></span><i aria-hidden="true">→</i><span><small>At recent pace</small><strong>'+shortDate(date(r.current))+'</strong></span></button><button class="text-button focus-range" data-dialog="projection">If this pace continues · '+shortDate(date(r.early))+'–'+shortDate(date(r.late))+' ↗</button></div>':'<button class="milestone-date" data-dialog="projection"><strong>Finish date unknown</strong><span>'+(goal==='revenue'?'Work → revenue relationship still being learned':'Reading pace needs reports')+'</span></button>';
  return '<div class="current-milestone"><div><span class="eyebrow">Plan <span class="separator">/</span> '+(historical?'Earlier milestone':'Current milestone')+'</span><h2>'+(historical?f().milestone:milestoneName())+'</h2><p>'+(goal==='reading'?pages+' / 200 pages reported':'$'+s().outcome.toLocaleString()+' / $1,000 reported')+'</p></div>'+outlook+'</div>';
}
function journeyRail(){
  const c=f().change;if(!c)return '';
  const stages=stageData(),review=stages.review;
  return '<aside class="journey-rail" id="learning"><span class="eyebrow">Learning</span><h2>How your plan evolved</h2>'+Object.entries(stages).filter(([key])=>key!=='review').map(([key,item])=>'<button class="journey-stage '+(stage===key?'active':'')+'" data-stage="'+key+'" aria-pressed="'+(stage===key)+'"><time>'+item.time+'</time><strong>'+esc(item.title)+'</strong><small>'+esc(item.detail)+'</small></button>').join('')+s().edits.map((edit,i)=>'<button class="journey-stage manual-change" data-edit-history="'+i+'"><time>8 Sep · your plan edit</time><strong>'+esc(f().actions.find(a=>a.id===edit.actionId).title)+'</strong><small>'+edit.target+' '+f().actions.find(a=>a.id===edit.actionId).unit+' · '+esc(edit.cue)+'</small></button>').join('')+(s().review?'<button class="journey-stage" data-dialog="review"><time>8 Sep · your decision</time><strong>Keep this arrangement for now</strong><small>'+(s().review.evidence===reviewEvidence()?'Original prediction stays tentative':'Evidence changed · revisit this decision')+'</small></button>':'')+'<button class="journey-stage upcoming-review" data-stage="review"><time>'+review.time+'</time><strong>'+review.title+'</strong><small>'+review.detail+'</small></button><button class="text-button" data-dialog="learning">Why this change? ↗</button></aside>';
}

function stageEvidence(){
  const c=f().change;
  if(!c)return s().outcome?'Cancellation reported. The goal result is recorded separately from the steps.':'Finding the details is recorded. Cancellation still needs its own confirmation.';
  if(stage==='before')return 'Earlier reports remain attached to the original timing. The change does not rewrite them.';
  if(stage==='review')return 'The review will check whether the window was available, work started, and the experience supports keeping it.';
  const used=Object.entries(s().used[c.actionId]||{}).filter(([d,v])=>Number(d)>=c.start&&Number(d)<=8&&v===true).length;
  return changedByEdit()?'The arrangement was edited. The original prediction is preserved; its applicability needs review.':used+' reported use'+(used===1?'':'s')+' of the new timing. There is no conclusion about its effect yet.';
}
function renderC(){
  const c=f().change,historical=stage==='before';
  return '<div class="variant-c integrated-goal '+(goal==='day'?'one-day':'')+'">'+header()+'<nav class="goal-index" aria-label="Within this goal"><a href="#plan">Plan & actions</a>'+(goal!=='day'?'<a href="#outlook">Goal outlook</a>':'')+(c?'<a href="#learning">Learning & history</a>':'')+'</nav><div class="learning-layout"><section class="evidence-canvas" id="plan">'+milestoneFocus()+(historical?'<div class="history-banner"><span>You’re inspecting the earlier arrangement. Only its reports can be corrected here.</span><button data-stage="current">Return to current plan →</button></div>':'')+'<div class="plan-period"><span>'+(historical?'Earlier action opportunities':goal==='day'?'Actions toward this goal':'Actions in this plan')+'</span>'+windowControls()+'</div>'+timeline()+selectedWork(false)+(goal==='day'||action().target===1?'':inputSection(true))+(c&&!historical&&action().id===c.actionId?'<div class="current-learning"><div><span class="eyebrow">What we’re learning</span><strong>'+(goal==='reading'?'Does reading after lunch fit your day?':'Does the morning window stay available?')+'</strong><small>'+learningSummary()+'</small></div><button data-dialog="review">Review with Coach ↗</button></div>':'')+'</section>'+journeyRail()+(goal!=='day'?'<section id="outlook" class="goal-outlook"><div class="section-title"><div><span class="eyebrow">Current goal outlook</span><h2>Where this work could lead</h2></div><button class="text-button" data-dialog="outcome">Update reported result ↗</button></div>'+outcomePanel()+'</section>':'')+'</div></div>';
}

function render(){
  document.getElementById('app').innerHTML=variant==='A'?renderA():variant==='B'?renderB():renderC();
  document.getElementById('variant-name').textContent=variant+' · '+names[variant];
  document.getElementById('fixture').value=goal;
  document.body.dataset.variant=variant;
  document.body.dataset.prototypeState=JSON.stringify({variant,goal,selectedAction,selectedDay,stage,window:windowDays(),planSignals:planSignals(),state});
  drawGraphs();
  publishOverview();
}
function svgText(x,y,label,anchor='start',fill='#6b746b',size=10){return '<text x="'+x+'" y="'+y+'" fill="'+fill+'" font-size="'+size+'" text-anchor="'+anchor+'" font-family="DM Sans,-apple-system,sans-serif">'+esc(label)+'</text>';}
function path(points){return points.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+','+p[1].toFixed(2)).join(' ');}
function drawOutcome(width,height){
  const p=projection(),left=37,right=12,top=p?43:18,bottom=height-27,w=width-left-right,h=bottom-top;
  const yy=v=>bottom-Math.min(1,Math.max(0,v))*h;
  let out='<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Reported goal outcome over time'+(p?', with a conditional reading scenario and wide assumption range':'')+'">';
  [0,.5,1].forEach(v=>{out+='<path d="M'+left+' '+yy(v)+'H'+(width-right)+'" stroke="#e9ede5"/>'+svgText(left-7,yy(v)+3,v*100+'%','end',undefined,width<320?8:10);});
  if(goal==='day'){
    const x=h=>left+(h-9)/10*w;
    out+='<path d="M'+x(9)+' '+yy(0)+'H'+x(14)+'" fill="none" stroke="#285648" stroke-width="2.5"/><circle cx="'+x(14)+'" cy="'+yy(s().outcome)+'" r="3" fill="#285648"/>';
    out+='<path d="M'+x(18)+' '+top+'V'+bottom+'" stroke="#989f92" stroke-dasharray="3 4"/>'+svgText(x(18)-4,top-6,'Target','end',undefined,9);
    [9,14,19].forEach(v=>{out+=svgText(x(v),height-7,dayLabel(v),v===9?'start':v===19?'end':'middle');});
    return out+'</svg>';
  }
  const start=new Date(Date.UTC(2026,0,1)),today=date(8),target=new Date(Date.UTC(2027,11,31));
  const end=p?new Date(Math.max(p.late.getTime()+45*86400000,target.getTime()+120*86400000)):new Date(Date.UTC(2027,11,31));
  const x=d=>left+(d-start)/(end-start)*w;
  const level=s().outcome/f().total;
  if(p){
    const forecast=(d,duration)=>level+(1-level)*Math.min(1,Math.max(0,(d-today)/86400000)/duration);
    const samples=Array.from({length:81},(_,i)=>addDays(today,(end-today)/86400000*i/80));
    const upper=samples.map(d=>[x(d),yy(forecast(d,p.fast))]);
    const lower=samples.map(d=>[x(d),yy(forecast(d,p.slow))]).reverse();
    out+='<path d="'+path(upper.concat(lower))+'Z" fill="#e1eadc"/>';
    out+='<path d="'+path(samples.map(d=>[x(d),yy(forecast(d,p.days))]))+'" fill="none" stroke="#65815c" stroke-width="2" stroke-dasharray="5 4"/>';
  }
  const history=goal==='reading'?[[start,0],[new Date(Date.UTC(2026,1,15)),1],[new Date(Date.UTC(2026,2,30)),2],[new Date(Date.UTC(2026,4,12)),3],[new Date(Date.UTC(2026,5,20)),4],[new Date(Date.UTC(2026,7,1)),5],[date(1),f().outcome],...s().outcomeHistory.map(r=>[date(r.day),r.amount])]:[[today,s().outcome]];
  let steps='M'+x(history[0][0])+','+yy(history[0][1]/f().total);
  history.slice(1).forEach(([d,v])=>{steps+='H'+x(d)+'V'+yy(v/f().total);});
  if(goal==='reading')steps+='H'+x(today);
  out+='<path d="'+steps+'" fill="none" stroke="#285648" stroke-width="2.5"/>';
  out+='<circle cx="'+x(today)+'" cy="'+yy(level)+'" r="3.5" fill="#285648"/>';
  out+='<path d="M'+x(target)+' '+top+'V'+bottom+'" stroke="#94a089" stroke-dasharray="3 4"/>'+svgText(x(target)-3,p?11:top-6,p?'Target · '+monthYear(target):'Target','end',undefined,9);
  if(p){
    const estimateX=x(p.date),targetX=x(target),colour=p.date>target?'#a27b42':'#607b9e';
    out+='<path class="finish-date-gap" d="M'+targetX+','+(top-10)+'V'+(top-5)+'H'+estimateX+'V'+(top-10)+'" stroke="'+colour+'" stroke-width="1.5" fill="none"/>';
    out+='<path class="finish-estimate-marker" d="M'+estimateX+','+(top-3)+'V'+bottom+'" stroke="'+colour+'" stroke-dasharray="2 4"/><circle cx="'+estimateX+'" cy="'+yy(1)+'" r="3" fill="'+colour+'"/>';
    const align=estimateX+95>width-right?'end':'start';
    out+=svgText(estimateX+(align==='end'?-4:4),26,'Est · '+monthYear(p.date),align,colour,9);
  }
  if(width>480){
    const days=windowDays(),focusX=x(date(days[0])),focusWidth=Math.max(5,x(date(days.at(-1)))-focusX);
    out+='<rect x="'+focusX+'" y="'+top+'" width="'+focusWidth+'" height="'+h+'" rx="2" fill="#4164aa08" stroke="#9dadd1" stroke-width="1"/>';
  }
  const ticks=(width<320?[start,end]:width<390?[start,today,end]:[start,today,target,end]).filter((d,i,all)=>all.findIndex(other=>other.getTime()===d.getTime())===i);
  ticks.forEach((d,i)=>{out+=svgText(x(d),height-7,d===today?'Now':i===0&&width<400?'2026':monthYear(d),i===0?'start':i===ticks.length-1?'end':'middle',undefined,width<320?8:10);});
  if(goal==='revenue'&&width>400)out+=svgText(x(today)+12,yy(.3),'Work tracked · outcome relationship unknown','start','#687065',10);
  return out+'</svg>';
}
function drawInput(width,height,large,element){
  const a=action(),days=windowDays();
  const lane=large?document.querySelector('.evidence-canvas .action-row.active .days'):null;
  const laneRect=lane?.getBoundingClientRect(),graphRect=element?.getBoundingClientRect();
  const left=laneRect?Math.max(30,laneRect.left-graphRect.left):30,right=laneRect?Math.max(0,graphRect.right-laneRect.right):12;
  const top=large?35:17,bottom=height-24,w=width-left-right,h=bottom-top;
  const values=Object.values(s().reports[a.id]),max=Math.max(a.target,...values,...days.map(d=>settings(a,d).target),1);
  const xx=d=>left+(days.indexOf(d)+.5)/days.length*w,yy=v=>bottom-v/max*h,through=goal==='day'?14:7;
  const active=f().change&&f().change.actionId===a.id&&!(variant==='C'&&stage==='before');
  let out='<svg viewBox="0 0 '+width+' '+height+'" role="group" aria-label="'+a.unit+' by date. Shaded gaps and vertical marks compare each report with its planned amount. Missing reports are unknown.">';
  [0,max].forEach(v=>{out+='<path d="M'+left+' '+yy(v)+'H'+(width-right)+'" stroke="#e8ede3"/>'+svgText(left-7,yy(v)+3,v,'end');});
  if(active&&days.includes(7)){
    const start=xx(7),end=days.includes(14)?xx(14):width-right;
    out+='<rect x="'+start+'" y="'+top+'" width="'+Math.max(0,end-start)+'" height="'+h+'" fill="#74639508"/><path d="M'+start+' '+top+'V'+bottom+'" stroke="#b4a3c5" stroke-dasharray="3 3"/>';
    if(large)out+=svgText(start,top-14,innerWidth<650?'New timing':'7 Sep · timing changed','middle','#746395',10);
  }
  const opportunities=days.filter(d=>a.days.includes(d));
  out+=goalPlanGapFill(opportunities.map(d=>{const n=report(a,d);return d<=through&&n!==undefined?{day:d,x:xx(d),planned:yy(settings(a,d).target),actual:yy(n)}:null;}));
  let previous=null;
  const planned=opportunities.map(d=>{const command=previous!==null&&d-previous===1?'L':'M';previous=d;return command+xx(d)+','+yy(settings(a,d).target);}).join('');
  if(planned)out+='<path d="'+planned+'" fill="none" stroke="#969f8f" stroke-width="1.3" stroke-dasharray="4 4"/>';
  out+=opportunities.map(d=>'<circle cx="'+xx(d)+'" cy="'+yy(settings(a,d).target)+'" r="2.3" fill="white" stroke="#969f8f"><title>'+dayLabel(d)+': '+settings(a,d).target+' '+a.unit+' planned</title></circle>').join('');
  let segment=[];
  const flush=()=>{if(segment.length>1)out+='<path d="'+path(segment)+'" fill="none" stroke="#345c45" stroke-width="'+(large?2.6:2)+'"/>';segment=[];};
  opportunities.forEach(d=>{const n=report(a,d);if(n===undefined){flush();return;}segment.push([xx(d),yy(n)]);});flush();
  opportunities.forEach(d=>{
    const n=report(a,d),target=settings(a,d).target,px=xx(d),planY=yy(target),actualY=n===undefined?bottom-12:yy(n);
    if(n===undefined&&d>through&&(goal==='day'||d>8))return;
    const difference=n===undefined?null:n-target,closed=d<=through;
    const label=(goal==='day'?dayLabel(d):d+' Sep')+': '+(n===undefined?'no report':n+' '+a.unit+' reported')+', '+target+' planned'+(closed&&difference?' · '+Math.abs(difference)+(difference<0?' below':' above')+' plan':'');
    out+='<g class="graph-report" role="button" tabindex="0" data-attempt="'+a.id+':'+d+'" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title>';
    out+='<rect x="'+(px-11)+'" y="'+Math.min(planY,actualY)+'" width="22" height="'+Math.max(22,Math.abs(actualY-planY))+'" fill="transparent"/>';
    if(n===undefined){out+=svgText(px,actualY,'?','middle','#697166',13);}
    else{
      if(closed&&difference){
        const colour=difference<0?'#a97b37':'#637fac';
        out+='<path class="gap-stem" d="M'+px+','+planY+'V'+actualY+'M'+(px-3)+','+planY+'h6" fill="none" stroke="'+colour+'" stroke-width="1.4"/>';
        out+=svgText(px+6,(planY+actualY)/2+3,(difference>0?'+':'')+difference,'start',colour,width<400?8:10);
      }
      out+='<circle class="reported-point" cx="'+px+'" cy="'+actualY+'" r="'+(large?4:3)+'" fill="#345c45"/>';
    }
    out+='</g>';
  });
  const selectedX=days.includes(selectedDay)?xx(selectedDay):null;
  if(selectedX!==null)out+='<path d="M'+selectedX+' '+top+'V'+bottom+'" stroke="#8097c3" stroke-width="1" stroke-dasharray="2 4" pointer-events="none"/>';
  const tickDays=days.length<=7?days:days.filter((d,i)=>i%3===0||i===days.length-1||d===8);
  tickDays.forEach(d=>{out+=svgText(xx(d),height-7,goal==='day'?dayLabel(d):d===8?'Today':d+' Sep','middle',d===8?'#252c26':undefined,width<350?8:9);});
  return out+'</svg>';
}

function drawGraphs(){document.querySelectorAll('[data-graph]').forEach(el=>{const r=el.getBoundingClientRect();el.innerHTML=el.dataset.graph==='outcome'?drawOutcome(r.width,r.height):drawInput(r.width,r.height,el.dataset.large==='true',el);});}
function openDialog(kind){
  if(f().change&&(kind==='review'||kind==='learning'&&selectedAction!==f().change.actionId)){selectedAction=f().change.actionId;selectedDay=8;stage='current';windowOffset=0;render();}
  const dialog=document.getElementById('inspector'),body=document.getElementById('dialog-body');
  let title='',eyebrow='',content='';
  const a=action(),c=f().change,n=report(),cfg=settings();
  if(kind==='milestone'&&goal==='day')return openDialog('projection');
  if(kind==='report'){
    title=n===undefined?'What happened?':'Correct this report';eyebrow='Action report · '+dayLabel(selectedDay);
    content='<div class="report-context">'+actionName(a)+' <span class="separator">›</span> '+selectedMilestoneName()+'</div><label class="form-label" for="report-amount">Actual '+a.unit+'</label><div class="field-row"><input id="report-amount" type="number" min="0" '+(a.target===1?'max="1"':'')+' step="1" value="'+(n===undefined?cfg.target:n)+'"><span>'+a.unit+'</span></div>'+(c&&a.id===c.actionId&&selectedDay>=c.start?'<label class="form-label" style="font-weight:500"><input type="checkbox" id="used-change" '+(s().used[a.id]?.[selectedDay]===true?'checked':'')+'> I used the '+c.after.toLowerCase()+' arrangement</label><small>Leave unchecked if you have not reported whether you used it.</small>':'')+'<div class="form-actions"><button class="primary" data-save-report>Save report</button>'+(n!==undefined?'<button data-clear-report>Clear report</button>':'')+'<button data-dialog="coach">Discuss with Coach</button></div><p class="dialog-intro" style="margin:16px 0 0">An amount is recorded only when you save. The goal’s outcome stays separate.</p>';
  }else if(kind==='edit'){
    title='Adjust the action';eyebrow=actionName(a);
    content='<label class="form-label" for="edit-scope">Apply this edit to</label><select class="form-field" id="edit-scope"><option value="once">'+dayLabel(selectedDay)+' only</option>'+(a.repeat!=='Once'?'<option value="future">This and future planned days</option>':'')+'</select><label class="form-label" for="edit-cue">When or after what?</label><input class="form-field" id="edit-cue" value="'+esc(cfg.cue)+'"><label class="form-label" for="edit-target">Planned '+a.unit+'</label><div class="field-row"><input id="edit-target" type="number" min="1" '+(a.target===1?'max="1"':'')+' step="1" value="'+cfg.target+'"><span>'+a.unit+'</span></div><div class="form-actions"><button class="primary" data-save-edit>Save plan edit</button></div><p class="dialog-intro" style="margin-top:16px">Earlier reports retain their original targets. This edit does not create an experiment or move a calendar booking.</p>';
  }else if(kind==='calendar'){
    const booking=s().bookings[a.id+':'+selectedDay];
    title=booking?'Your demo booking':'Add this action to calendar';eyebrow=dayLabel(selectedDay)+' · '+actionName(a);
    content='<p class="dialog-intro">A planned cue and a calendar booking are different. Choose an actual time for this occurrence.</p><label class="form-label" for="booking-time">Start time</label><input id="booking-time" type="time" class="form-field" value="'+(booking?.time||'12:30')+'"><label class="form-label" for="booking-duration">Duration</label><div class="field-row"><input id="booking-duration" type="number" min="1" value="'+(booking?.duration||20)+'"><span>minutes</span></div><div class="form-actions"><button class="primary" data-save-booking>'+(booking?'Reschedule demo booking':'Add demo booking')+'</button></div><p class="dialog-intro" style="margin-top:16px">Prototype only. Nothing is sent to your calendar.</p>';
  }else if(kind==='learning'){
    if(!c)return openDialog('outcome');
    title=c.title;eyebrow='Experiment · '+f().title+' · same ongoing action';
    content='<p class="dialog-intro">A working explanation behind one change. Personal evidence and research play different roles.</p><div class="reason-inputs"><section><span class="eyebrow">What you reported</span><h3>The available time</h3><p>“'+c.observation+'”</p><small>'+c.observationDate+' · example Coach report</small><p style="margin-top:10px">“'+c.context+'”</p><button class="text-button" data-dialog="observations">Inspect the saved observations ↗</button></section><section><span class="eyebrow">Behavioural science</span><h3>Opportunity + a specific cue</h3><p>COM-B distinguishes external opportunities from motivation. A missed session alone cannot tell us which is responsible.</p><p>Cue-linked plans specify when and how to act. Research supports considering this technique; it does not pick the right time for you.</p><small>P24/P7 · theory &nbsp; P2 · technique and empirical evidence</small></section></div><div class="convergence"></div><div class="reason-decision"><span class="eyebrow">Adler’s working explanation</span><h3>'+c.inference+'</h3><p>'+c.hypothesis+'</p></div><div class="change-comparison"><div><span class="eyebrow">Before · through 6 Sep</span><strong>'+c.before+'</strong></div><span class="change-arrow">→</span><div><span class="eyebrow">Testing · from 7 Sep</span><strong>'+c.after+'</strong></div></div><div class="review-readout"><section><h3>What has happened</h3><p>'+stageEvidence()+'</p><button class="text-button" data-dialog="observations">View reports ↗</button></section><section><h3>Next review · 14 Sep</h3><p>Check whether the window stayed available and the work started. Keep, adjust or ask for useful missing context. The date is a review point, not a promised conclusion.</p></section></div><details class="research-detail"><summary>Specific research, limits and original prediction</summary><p><b>Original prediction, saved 6 Sep:</b> '+c.originalPrediction+'</p><p><a href="https://link.springer.com/article/10.1186/1748-5908-6-42" target="_blank" rel="noopener">Michie, van Stralen & West (2011)</a> · COM-B opportunity definition. <b>Grade D: theory.</b> This framework organizes inquiry into constraints; it does not establish that moving this session will work. The user’s account supplies the proposed time.</p><p><code>claim:com-b-opportunity · 2026-09-07.1 · P24/P7</code></p><p><a href="https://doi.org/10.1016/S0065-2601%2806%2938002-1" target="_blank" rel="noopener">Gollwitzer & Sheeran (2006)</a> · Implementation intentions link a specified situation to an action. The meta-analysis supports considering cue-linked planning on average. <b>P2 corpus: A direction / moderate magnitude.</b> It does not establish the best cue, an individual effect, or equivalent effectiveness in Adler.</p><p><code>claim:implementation-if-then · claim:implementation-attainment · 2026-09-07.1</code></p><p><b>Application limits:</b> other circumstances may explain a change. Amount completed does not show whether the cue was used. Availability, initiation, quantity and final outcome remain separate. The review timing is a fictional coach-selected design, not a scientific threshold.</p><p><b>Alternative:</b> if the new window stays free but starting remains difficult, the opportunity explanation is incomplete. Do not label the person unmotivated.</p></details><div class="form-actions"><button data-dialog="coach">Discuss this with Coach</button></div>';
  }else if(kind==='projection'){
    title=goal==='reading'?'What the estimate depends on':goal==='revenue'?'Learning how work relates to revenue':'What finishes this goal';
    eyebrow='Action input → goal outcome';
    const p=projection(),t=stats(f().actions[0]);
    if(goal==='reading'){
      content='<p class="dialog-intro">Reading reports inform a conditional finish scenario. Finishing a book is still reported separately. The milestone comparison holds today’s remaining pages fixed and varies future pace; it is not a saved earlier forecast.</p><div class="data-lines"><span>Books reported finished</span><strong>'+s().outcome+' / 30</strong><span>Pages reported in the current book</span><strong>'+bookPages()+'</strong><span>Reading reports in this window</span><strong>'+t.reported+' / '+t.eligible+' planned days</strong><span>Average across reported days</span><strong>'+t.rate.toFixed(1)+' pages</strong><span>Assumed future schedule</span><strong>5 reading days / week</strong><span>Central book-length assumption</span><strong>200 pages / book</strong>'+(p?'<span>Conditional finish</span><strong>'+shortDate(p.date)+' '+p.date.getUTCFullYear()+'</strong><span>Scenario finish range</span><strong>'+monthYear(p.early)+'–'+monthYear(p.late)+'</strong>':'')+'</div><p class="dialog-intro">The centre uses the recorded average and remaining pages. The shaded scenarios vary book length from 160–280 pages and future pace by ±30%. These are illustrative assumptions, not calibrated confidence limits.</p><p class="dialog-intro">Missing days are unknown. Extrapolation assumes reported days are representative, which may be wrong. A new report can move this scenario without establishing that a coaching change helped.</p>';
    }else if(goal==='revenue'){
      content='<div class="data-lines"><span>Focused work reported</span><strong>'+t.sum+' minutes</strong><span>Revenue reported</span><strong>$'+s().outcome.toLocaleString()+'</strong><span>Goal</span><strong>$100,000</strong><span>Personal input–outcome relationship</span><strong>Unknown</strong><span>Defensible finish estimate</span><strong>Not yet available</strong></div><p class="dialog-intro">The current plan supports work you chose. Hours alone cannot establish a revenue return. Adler would consider paired outcome reports, relevant delays, changes in the work and other explanations before offering a conditional estimate.</p><p class="dialog-intro">The timing experiment asks whether the work fits your life. It does not test whether each hour causes a particular amount of revenue.</p>';
    }else content='<p class="dialog-intro">The goal is a confirmed cancellation. Finding the account details and attempting to cancel are supporting actions. The target is today before 6 pm; the planned action is at 5 pm.</p><div class="form-actions"><button class="primary" data-dialog="outcome">Record cancellation result</button></div>';
    content+='<div class="form-actions"><button data-dialog="coach">Discuss the plan</button></div>';
  }else if(kind==='milestone'){
    title=milestoneName();eyebrow='Milestone · '+f().title;
    const r=milestoneRange();
    content='<p class="dialog-intro">'+(goal==='reading'?'The reading action continues into the next book with the same report and learning history. Pages measure work; completing the book is a reported result.':'This milestone is reached by reported revenue, independently of how many work sessions were completed.')+'</p><div class="data-lines"><span>Reported progress</span><strong>'+(goal==='reading'?bookPages()+' / 200 pages':'$'+s().outcome.toLocaleString())+'</strong><span>Finish estimate</span><strong>'+(r?shortDate(date(r.early))+'–'+shortDate(date(r.late)):'Not yet known')+'</strong><span>Next milestone</span><strong>'+nextMilestoneName()+'</strong></div><div class="form-actions"><button data-dialog="outcome">Record the outcome</button><button data-dialog="projection">Inspect the estimate</button></div>';
  }else if(kind==='outcome'){
    title=goal==='reading'?'How many books have you finished?':goal==='revenue'?'Update reported revenue':'Is the cancellation confirmed?';eyebrow='Goal outcome · '+f().title;
    content='<p class="dialog-intro">This records the result itself, separately from the work you reported.</p><label class="form-label" for="goal-outcome">'+(goal==='reading'?'Total finished books':goal==='revenue'?'Total revenue ($)':'Confirmed cancellations (0 or 1)')+'</label><div class="field-row"><input id="goal-outcome" type="number" min="0" '+(goal==='day'?'max="1"':'')+' step="1" value="'+s().outcome+'"><span>'+f().outcomeUnit+'</span></div><div class="form-actions"><button class="primary" data-save-outcome>Save reported result</button></div>';
  }else if(kind==='observations'){
    title='The saved observations';eyebrow='Personal evidence · fictional example';
    content=(c?'<div class="source-report"><time>'+c.observationDate+' · report:context-1</time><p>“'+c.observation+'”</p><small>User-reported context; not a diagnosis.</small></div><div class="source-report"><time>'+c.contextDate+' · report:context-2</time><p>“'+c.context+'”</p><small>User-reported availability; not a calendar guarantee.</small></div>':'')+f().actions.map(a=>Object.entries(s().reports[a.id]).map(([d,n])=>'<div class="source-report"><time>'+dayLabel(Number(d))+' · '+a.id+':'+d+'</time><p>'+actionName(a)+' · '+amountLabel(n,a)+'</p><small>'+(s().used[a.id]?.[d]===true?'Use of the new timing explicitly reported.':'Use of the coaching change is not established by this quantity.')+'</small></div>').join('')).join('');
  }else if(kind==='coach'){
    title='Coach';eyebrow='Your coach';
    content='<div class="coach-focus"><span class="eyebrow">Discussing this action</span><strong>'+esc(actionName())+'</strong><small>'+dayLabel(selectedDay)+' · '+esc(settings().cue)+' · '+(report()===undefined?'No report':amountLabel(report())+' reported')+'</small></div><div class="coach-context"><button data-dialog="goals">'+f().title+' ↗</button><button data-dialog="milestone">'+(goal==='day'?'Current action':milestoneName())+' ↗</button>'+(c?'<button data-dialog="learning">Current experiment ↗</button>':'')+'</div><p class="coach-message">'+(c?'We’re trying '+c.after.toLowerCase()+' for this action. You can report what happened, discuss what got in the way, or revise the plan.':'You have one action left, then a result to confirm. You can report what happened or discuss a difficulty.')+'</p><div id="local-messages">'+s().messages.map(m=>'<div class="local-message">'+esc(m)+'<small>Demo draft · not sent to an AI</small></div>').join('')+'</div><div class="coach-composer"><label class="form-label" for="coach-text">Your message</label><textarea id="coach-text" placeholder="Tell Adler what happened…"></textarea><div class="form-actions"><button class="primary" data-save-message>Add demo message</button></div><small>Design prototype: messages stay here; no AI or external channel is called.</small></div>';
   }else if(kind==='review'){
    if(!c)return openDialog('outcome');
    title='Is this arrangement worth keeping?';eyebrow='Coach · '+c.title;
    const count=usedCount(),changed=s().review&&s().review.evidence!==reviewEvidence();
    content='<div class="review-focus"><span class="eyebrow">What you’re trying</span><h3>'+c.after+' · same chosen work</h3><p>'+count+' reported use'+(count===1?'':'s')+'. '+(count?'That is experience to discuss; it does not establish why a change happened.':'Agreement and dates do not establish that you used it.')+'</p></div>'+(changed?'<p class="history-banner">Your reports or plan changed after the earlier decision. Review it against the current evidence.</p>':'')+'<div class="review-question"><h3>Would you like to keep this timing for now?</h3><p>You can keep a useful arrangement while we’re still learning. The planned review is 14 Sep; your experience can prompt an earlier decision.</p><div class="form-actions"><button class="primary" data-keep-arrangement>Keep this for now</button><button data-dialog="coach">Discuss a change</button><button data-dialog="report" data-review-report>Report what happened</button></div></div>'+(s().review?'<div class="source-report"><time>8 Sep · saved choice</time><p>You chose to keep this arrangement. '+(changed?'Its supporting record has since changed.':'The original explanation remains tentative.')+'</p></div>':'')+'<details class="research-detail"><summary>Evidence and the question being tested</summary><p>'+c.originalPrediction+'</p><p>'+esc(c.inference)+'</p><button class="text-button" data-dialog="learning">Personal reports and specific research ↗</button></details>';
  }else if(kind==='goals'){
    title='Your goals';eyebrow='Choose a design example';
    content='<div class="goal-links">'+Object.entries(fixtures).map(([key,g])=>'<button data-goal="'+key+'"><strong>'+g.title+'</strong><small>'+g.category+' · '+(key==='reading'?'A conditional input–outcome estimate':key==='revenue'?'Several actions, with an unknown outcome relationship':'A one-day plan without a manufactured experiment')+'</small></button>').join('')+'</div>';
  }else{
    title='Prototype state';eyebrow='Design inspection · browser memory only';
    content='<pre class="demo-code">'+esc(JSON.stringify({variant,goal,selectedAction,selectedDay,stage,state},null,2))+'</pre>';
  }
  document.getElementById('dialog-title').textContent=title;
  document.getElementById('dialog-kind').textContent=eyebrow;
  body.innerHTML=content;
  if(!dialog.open)dialog.showModal();
}
function closeDialog(){document.getElementById('inspector').close();}
function remember(){lastUndo=JSON.stringify(state);}
function notify(message){
  const el=document.getElementById('notice');clearTimeout(noticeTimer);
  el.innerHTML=esc(message)+(lastUndo?'<button data-undo>Undo</button>':'');el.hidden=false;
  noticeTimer=setTimeout(()=>{el.hidden=true;},7000);
}
function saveReport(value,used){
  const a=action();if(!Number.isFinite(value)||value<0||(a.target===1&&value>1))return;
  remember();s().reports[a.id][selectedDay]=value;
  if(goal==='reading'&&a.id==='read'&&s().contributions.read[selectedDay]===undefined)s().contributions.read[selectedDay]=currentBook();
  if(!s().used[a.id])s().used[a.id]={};
  s().used[a.id][selectedDay]=used===true?true:null;
  closeDialog();render();notify(amountLabel(value,a)+' saved for '+dayLabel(selectedDay));
}
function switchVariant(delta){
  variant=variants[(variants.indexOf(variant)+delta+3)%3];windowOffset=0;
  if(variant==='C'&&goal!=='day'){selectedAction=f().actions[0].id;selectedDay=8;}
  const url=new URL(location.href);url.searchParams.set('variant',variant);history.replaceState(null,'',url);
  closeDialog();render();window.scrollTo({top:0,behavior:'instant'});
}
function chooseGoal(key){
  goal=key;resetSelection();const url=new URL(location.href);url.searchParams.set('goal',key);history.replaceState(null,'',url);closeDialog();render();window.scrollTo({top:0,behavior:'instant'});
}
document.addEventListener('click',event=>{
  const el=event.target.closest('button,[data-attempt]');if(!el)return;
  if(el.dataset.dialog){if(el.hasAttribute('data-review-report')){selectedAction=f().actions[0].id;selectedDay=8;stage='current';render();}openDialog(el.dataset.dialog);return;}
  if(el.dataset.attempt){const [id,day]=el.dataset.attempt.split(':');selectedAction=id;selectedDay=Number(day);const fromGraph=el.getAttribute('role')==='button';render();if(fromGraph)document.querySelector('.graph-report[data-attempt="'+id+':'+day+'"]')?.focus({preventScroll:true});return;}
  if(el.dataset.selectAction){if(stage==='before')stage='current';selectedAction=el.dataset.selectAction;const a=action();selectedDay=a.days.includes(goal==='day'?17:8)?(goal==='day'?17:8):a.days.find(d=>d>=(goal==='day'?14:8))||a.days.at(-1);
    const days=windowDays();if(goal!=='day'&&!days.includes(selectedDay))windowOffset+=selectedDay-days[Math.floor(days.length/2)];
    render();return;}
  if(el.dataset.window!==undefined){if(stage==='before')stage='current';const direction=Number(el.dataset.window);windowOffset=direction===0?0:windowOffset+direction*windowDays().length;render();return;}
  if(el.dataset.stage){if(el.dataset.stage==='proposal'){openDialog('learning');return;}if(el.dataset.stage==='review'){openDialog('review');return;}stage=el.dataset.stage;selectedAction=f().actions[0].id;selectedDay=stage==='before'?4:8;windowOffset=0;render();return;}
  if(el.dataset.goal){chooseGoal(el.dataset.goal);return;}
  if(el.hasAttribute('data-keep-arrangement')){remember();s().review={decision:'keep',at:'8 Sep',evidence:reviewEvidence(),interpretation:'Still tentative',source:'Explicit choice in the prototype'};closeDialog();render();notify('Your choice is saved · the plan stays in place while learning continues');return;}
  if(el.dataset.editHistory!==undefined){const edit=s().edits[Number(el.dataset.editHistory)],a=f().actions.find(a=>a.id===edit.actionId);openDialog('state');document.getElementById('dialog-title').textContent='Saved plan edit';document.getElementById('dialog-kind').textContent=dayLabel(edit.day)+' · '+a.title;document.getElementById('dialog-body').innerHTML='<div class="data-lines"><span>Action</span><strong>'+esc(a.title)+'</strong><span>Planned amount in this revision</span><strong>'+edit.target+' '+a.unit+'</strong><span>Timing in this revision</span><strong>'+esc(edit.cue)+'</strong><span>Scope</span><strong>'+(edit.scope==='future'?'From '+dayLabel(edit.day):dayLabel(edit.day)+' only')+'</strong></div><p class="dialog-intro">This is the saved edit. Later changes may supersede it; inspecting it does not change the current plan.</p>';return;}
  if(el.hasAttribute('data-miss')){saveReport(0,null);return;}
  if(el.hasAttribute('data-save-report')){const field=document.getElementById('report-amount');if(field.value!==''&&field.reportValidity())saveReport(Number(field.value),document.getElementById('used-change')?.checked);return;}
  if(el.hasAttribute('data-clear-report')){remember();delete s().reports[action().id][selectedDay];if(s().used[action().id])delete s().used[action().id][selectedDay];closeDialog();render();notify('Report cleared · this date is now unknown');return;}
  if(el.hasAttribute('data-save-edit')){
    const cue=document.getElementById('edit-cue').value.trim(),target=Number(document.getElementById('edit-target').value);
    if(!cue||!document.getElementById('edit-target').reportValidity()||!Number.isFinite(target)||target<=0)return;
    remember();s().edits.push({actionId:action().id,day:selectedDay,scope:document.getElementById('edit-scope').value,cue,target});closeDialog();render();notify('Plan edit saved · previous reports preserved');return;
  }
  if(el.hasAttribute('data-save-booking')){
    const time=document.getElementById('booking-time').value,duration=Number(document.getElementById('booking-duration').value);
    if(!time||!Number.isFinite(duration)||duration<=0)return;
    remember();s().bookings[action().id+':'+selectedDay]={time,duration};closeDialog();render();notify('Demo booking saved · nothing sent to your calendar');return;
  }
  if(el.hasAttribute('data-save-outcome')){
    const field=document.getElementById('goal-outcome'),value=Number(field.value);if(field.value===''||!field.reportValidity()||!Number.isFinite(value))return;
    remember();s().outcome=value;s().outcomeDate='8 Sep';s().outcomeHistory.push({day:8,amount:value});closeDialog();render();notify('Goal result saved separately from action reports');return;
  }
  if(el.hasAttribute('data-save-message')){
    const message=document.getElementById('coach-text').value.trim();if(!message)return;s().messages.push(message);render();openDialog('coach');return;
  }
  if(el.hasAttribute('data-undo')){if(lastUndo){state=JSON.parse(lastUndo);lastUndo=null;render();document.getElementById('notice').hidden=true;}return;}
});
document.getElementById('fixture').onchange=e=>chooseGoal(e.target.value);
document.getElementById('prev-variant').onclick=()=>switchVariant(-1);
document.getElementById('next-variant').onclick=()=>switchVariant(1);
document.getElementById('close-dialog').onclick=closeDialog;
document.getElementById('demo-state').onclick=()=>openDialog('state');
document.getElementById('reset-demo').onclick=()=>{state=initialState();lastUndo=null;resetSelection();render();document.getElementById('notice').hidden=true;};
document.addEventListener('keydown',e=>{if(e.target.matches('[data-attempt][role=button]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}if(e.target.closest('input,textarea,select,[contenteditable],dialog')||document.getElementById('inspector').open)return;if(e.key==='ArrowRight'){e.preventDefault();switchVariant(1);}if(e.key==='ArrowLeft'){e.preventDefault();switchVariant(-1);}});
document.getElementById('inspector').addEventListener('click',e=>{if(e.target.id==='inspector'){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(render,100);});
render();

if(params.get('focus'))requestAnimationFrame(()=>document.getElementById(params.get('focus'))?.scrollIntoView({block:'start'}));
