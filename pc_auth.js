// PayClub shared utilities
const DEMO_USER = { name: 'Demo 幹部', email: 'demo@payclub.app', role: 'leader' };

const SEED_EVENTS = [
  { id:'e1', title:'大成', amountMode:'per_person', amount:5000, totalAmount:15000, deadline:'2026-04-28', desc:'大成活動費用', status:'active',
    members:[
      {name:'林小明', role:'payer', status:'paid', paidAt:'04/10 14:22', customAmount:null},
      {name:'陳美玲', role:'payer', status:'paid', paidAt:'04/11 09:11', customAmount:null},
      {name:'王大衛', role:'payer', status:'paid', paidAt:'04/12 15:00', customAmount:null},
      {name:'張雅婷', role:'counter', status:'none', paidAt:'', customAmount:null}
    ]},
  { id:'e2', title:'社團贊助', amountMode:'per_person', amount:1000, totalAmount:5000, deadline:'2026-04-28', desc:'社團贊助費用', status:'active',
    members:[
      {name:'林小明', role:'payer', status:'paid', paidAt:'04/15 10:00', customAmount:null},
      {name:'陳美玲', role:'payer', status:'paid', paidAt:'04/16 09:30', customAmount:null},
      {name:'王大衛', role:'payer', status:'paid', paidAt:'04/14 11:00', customAmount:null},
      {name:'黃俊豪', role:'payer', status:'paid', paidAt:'04/13 08:00', customAmount:null},
      {name:'李小花', role:'payer', status:'paid', paidAt:'04/12 17:00', customAmount:null},
      {name:'吳志豪', role:'counter', status:'none', paidAt:'', customAmount:null}
    ]},
];

function PC_getUser(){ return JSON.parse(localStorage.getItem('pc_current_user')||'null'); }
function PC_isLoggedIn(){ return !!PC_getUser(); }
function PC_requireLogin(){
  if(!PC_isLoggedIn()){ location.href='login.html?next='+encodeURIComponent(location.href); return null; }
  return PC_getUser();
}
function PC_logout(){ localStorage.removeItem('pc_current_user'); location.href='login.html'; }

function PC_getEvents(){
  const raw=localStorage.getItem('pc_events');
  if(!raw){ localStorage.setItem('pc_events',JSON.stringify(SEED_EVENTS)); return JSON.parse(JSON.stringify(SEED_EVENTS)); }
  return JSON.parse(raw);
}
function PC_saveEvents(e){ localStorage.setItem('pc_events',JSON.stringify(e)); }
function PC_getEvent(id){ return PC_getEvents().find(e=>e.id===id)||null; }
function PC_updateEvent(ev){ const evts=PC_getEvents(); const i=evts.findIndex(e=>e.id===ev.id); if(i>=0)evts[i]=ev; PC_saveEvents(evts); }

function PC_fillSidebarUser(){
  const u=PC_getUser(); if(!u)return;
  const n=document.getElementById('userName'); const a=document.getElementById('avatarInitial');
  if(n)n.textContent=u.name; if(a)a.textContent=u.name.slice(0,1);
}

function PC_toast(msg,duration=2500){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t);}
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),duration);
}

function PC_nowStr(){
  const n=new Date();
  return (n.getMonth()+1).toString().padStart(2,'0')+'/'+(n.getDate()).toString().padStart(2,'0')+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');
}

// Get payers only for financial calculations
function PC_getPayers(event){ return event.members.filter(m=>m.role==='payer'); }
function PC_getExpectedAmount(event, member){
  if(member.role!=='payer') return 0;
  if(event.amountMode==='custom' && member.customAmount!=null) return member.customAmount;
  return event.amount||0;
}
function PC_getCollected(event){
  return PC_getPayers(event).filter(m=>m.status==='paid').reduce((s,m)=>s+PC_getExpectedAmount(event,m),0);
}
function PC_getExpected(event){
  return PC_getPayers(event).reduce((s,m)=>s+PC_getExpectedAmount(event,m),0);
}
