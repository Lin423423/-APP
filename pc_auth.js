// PayClub shared utilities v3
const DEMO_USER = { name: 'Demo 幹部', email: 'demo@payclub.app', role: 'leader', isDemo: true };

const SEED_EVENTS = [
  { id:'e1', title:'大成', amountMode:'per_person', amount:5000, deadline:'2026-04-28', desc:'大成活動費用', status:'active',
    members:[
      {name:'林小明',role:'payer',status:'paid',paidAt:'04/10 14:22',customAmount:null},
      {name:'陳美玲',role:'payer',status:'paid',paidAt:'04/11 09:11',customAmount:null},
      {name:'王大衛',role:'payer',status:'paid',paidAt:'04/12 15:00',customAmount:null},
      {name:'張雅婷',role:'counter',status:'none',paidAt:'',customAmount:null}
    ]},
  { id:'e2', title:'社團贊助', amountMode:'per_person', amount:1000, deadline:'2026-04-28', desc:'社團贊助費用', status:'active',
    members:[
      {name:'林小明',role:'payer',status:'paid',paidAt:'04/15 10:00',customAmount:null},
      {name:'陳美玲',role:'payer',status:'paid',paidAt:'04/16 09:30',customAmount:null},
      {name:'王大衛',role:'payer',status:'paid',paidAt:'04/14 11:00',customAmount:null},
      {name:'黃俊豪',role:'payer',status:'paid',paidAt:'04/13 08:00',customAmount:null},
      {name:'李小花',role:'payer',status:'paid',paidAt:'04/12 17:00',customAmount:null},
      {name:'吳志豪',role:'counter',status:'none',paidAt:'',customAmount:null}
    ]},
];

// ── Storage key per user ──
function PC_eventsKey(user){ return 'pc_events__'+(user?user.email:'guest'); }
function PC_getUser(){ return JSON.parse(localStorage.getItem('pc_current_user')||'null'); }
function PC_isLoggedIn(){ return !!PC_getUser(); }
function PC_requireLogin(){
  if(!PC_isLoggedIn()){ location.href='login.html?next='+encodeURIComponent(location.href); return null; }
  return PC_getUser();
}
function PC_logout(){
  const u=PC_getUser();
  if(u&&u.isDemo){
    // Clear demo data completely
    localStorage.removeItem(PC_eventsKey(u));
    localStorage.removeItem('pc_current_user');
    // Log activity
    PC_logActivity(u,'logout_demo');
  } else {
    PC_logActivity(u,'logout');
    localStorage.removeItem('pc_current_user');
  }
  location.href='login.html';
}

// ── Events (per user) ──
function PC_getEvents(){
  const u=PC_getUser();
  const key=PC_eventsKey(u);
  const raw=localStorage.getItem(key);
  if(!raw){
    const seed=JSON.parse(JSON.stringify(SEED_EVENTS));
    localStorage.setItem(key,JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}
function PC_saveEvents(e){ const u=PC_getUser(); localStorage.setItem(PC_eventsKey(u),JSON.stringify(e)); }
function PC_getEvent(id){ return PC_getEvents().find(e=>e.id===id)||null; }

// ── User registry (for admin) ──
function PC_registerUser(user){
  const reg=JSON.parse(localStorage.getItem('pc_user_registry')||'[]');
  const now=new Date().toISOString();
  const existing=reg.find(r=>r.email===user.email);
  if(!existing){
    reg.push({email:user.email,name:user.name,role:user.role,isDemo:!!user.isDemo,createdAt:now,lastLogin:now,loginCount:1});
  } else {
    existing.lastLogin=now;
    existing.loginCount=(existing.loginCount||0)+1;
    existing.name=user.name;
  }
  localStorage.setItem('pc_user_registry',JSON.stringify(reg));
}
function PC_logActivity(user,action){
  if(!user)return;
  const logs=JSON.parse(localStorage.getItem('pc_activity_log')||'[]');
  logs.unshift({email:user.email,name:user.name,action,time:new Date().toISOString()});
  if(logs.length>200)logs.splice(200);
  localStorage.setItem('pc_activity_log',JSON.stringify(logs));
}

// ── Sidebar helpers ──
function PC_fillSidebarUser(){
  const u=PC_getUser(); if(!u)return;
  const n=document.getElementById('userName');
  const a=document.getElementById('avatarInitial');
  if(n)n.textContent=u.name;
  if(a)a.textContent=u.name.slice(0,1);
}

// ── Toast ──
function PC_toast(msg,duration=2500){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t);}
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),duration);
}

// ── Helpers ──
function PC_nowStr(){
  const n=new Date();
  return (n.getMonth()+1).toString().padStart(2,'0')+'/'+(n.getDate()).toString().padStart(2,'0')+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');
}
function PC_getPayers(event){ return (event.members||[]).filter(m=>m.role==='payer'); }
function PC_getExpectedAmount(event,member){
  if(!member||member.role!=='payer') return 0;
  if(event.amountMode==='custom'&&member.customAmount!=null) return Number(member.customAmount)||0;
  return Number(event.amount)||0;
}
function PC_getCollected(event){
  return PC_getPayers(event).filter(m=>m.status==='paid').reduce((s,m)=>s+PC_getExpectedAmount(event,m),0);
}
function PC_getExpected(event){
  return PC_getPayers(event).reduce((s,m)=>s+PC_getExpectedAmount(event,m),0);
}

// ── Standard sidebar HTML (call after DOM ready) ──
function PC_renderStdSidebar(activePage){
  const evts=PC_getEvents();
  const sidebarEventsEl=document.getElementById('sidebarEvents');
  if(sidebarEventsEl){
    sidebarEventsEl.innerHTML=evts.map(e=>{
      const payers=PC_getPayers(e),paid=payers.filter(m=>m.status==='paid').length,pct=payers.length?Math.round(paid/payers.length*100):0;
      const currentId=new URLSearchParams(location.search).get('id');
      return `<a class="nav-event${e.id===currentId?' current':''}" href="event.html?id=${e.id}"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${e.title}</span><span style="font-size:0.72rem;color:var(--text3);flex-shrink:0;margin-left:6px">${pct}%</span></a>`;
    }).join('');
  }
  PC_fillSidebarUser();
}
