// PayClub shared utilities v5
// KEY CHANGE: Use sessionStorage for current user to prevent cross-tab contamination
// Each browser tab has its own session, preventing account mixing

const DEMO_USER = { name: 'Demo 幹部', email: 'demo@payclub.app', role: 'admin', isDemo: true };

// ── Auth (sessionStorage = per-tab isolation) ──
function PC_getUser(){
  // Try sessionStorage first (per-tab), fallback to nothing
  const sess = sessionStorage.getItem('pc_current_user');
  if(sess) return JSON.parse(sess);
  return null;
}
function PC_isLoggedIn(){ return !!PC_getUser(); }
function PC_requireLogin(){
  if(!PC_isLoggedIn()){ location.href='login.html?next='+encodeURIComponent(location.href); return null; }
  return PC_getUser();
}
function PC_requireAdmin(){
  const u = PC_requireLogin();
  if(!u) return null;
  if(u.role !== 'admin'){
    // Redirect based on role
    if(u.role === 'observer') location.href = 'observer.html';
    else if(u.role === 'payer') location.href = 'payer.html';
    else location.href = 'member.html';
    return null;
  }
  return u;
}
function PC_logout(){
  const u = PC_getUser();
  if(u){
    if(u.isDemo) localStorage.removeItem(PC_eventsKey(u));
    PC_logActivity(u, u.isDemo ? 'logout_demo' : 'logout');
  }
  sessionStorage.removeItem('pc_current_user');
  location.href = 'login.html';
}

// ── Storage key per user ──
function PC_eventsKey(user){ return 'pc_events__' + (user ? user.email : 'guest'); }

// ── Events ──
function PC_getEvents(){
  const u = PC_getUser();
  const key = PC_eventsKey(u);
  const raw = localStorage.getItem(key);
  if(!raw) return [];
  return JSON.parse(raw);
}
function PC_saveEvents(e){ const u=PC_getUser(); localStorage.setItem(PC_eventsKey(u), JSON.stringify(e)); }
function PC_getEvent(id){ return PC_getEvents().find(e=>e.id===id) || null; }

// ── Invite code ──
function PC_genInviteCode(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for(let i=0;i<8;i++) code += chars[Math.floor(Math.random()*chars.length)];
  return code;
}

// ── Find event by invite code (searches all users) ──
function PC_findEventByCode(code){
  const upper = code.toUpperCase().trim();
  for(let i=0;i<localStorage.length;i++){
    const key = localStorage.key(i);
    if(key && key.startsWith('pc_events__')){
      try {
        const evts = JSON.parse(localStorage.getItem(key)||'[]');
        const found = evts.find(e => e.inviteCode && e.inviteCode.toUpperCase() === upper);
        if(found) return { event: found, ownerKey: key, ownerEmail: key.replace('pc_events__','') };
      } catch(e){}
    }
  }
  return null;
}

// ── Join requests (pending approvals) ──
function PC_getJoinRequests(eventId){
  return JSON.parse(localStorage.getItem('pc_join_req__'+eventId)||'[]');
}
function PC_saveJoinRequests(eventId, reqs){
  localStorage.setItem('pc_join_req__'+eventId, JSON.stringify(reqs));
}
function PC_addJoinRequest(eventId, email, name){
  const reqs = PC_getJoinRequests(eventId);
  if(reqs.find(r=>r.email===email)) return false; // already requested
  reqs.push({email, name, requestedAt: new Date().toISOString(), status:'pending'});
  PC_saveJoinRequests(eventId, reqs);
  return true;
}

// ── User registry ──
function PC_registerUser(user){
  const reg = JSON.parse(localStorage.getItem('pc_user_registry')||'[]');
  const now = new Date().toISOString();
  const existing = reg.find(r=>r.email===user.email);
  if(!existing){
    reg.push({email:user.email, name:user.name, role:user.role, isDemo:!!user.isDemo, createdAt:now, lastLogin:now, loginCount:1});
  } else {
    existing.lastLogin=now; existing.loginCount=(existing.loginCount||0)+1; existing.name=user.name;
  }
  localStorage.setItem('pc_user_registry', JSON.stringify(reg));
}
function PC_logActivity(user, action){
  if(!user) return;
  const logs = JSON.parse(localStorage.getItem('pc_activity_log')||'[]');
  logs.unshift({email:user.email, name:user.name, action, time:new Date().toISOString()});
  if(logs.length>200) logs.splice(200);
  localStorage.setItem('pc_activity_log', JSON.stringify(logs));
}

// ── UI helpers ──
function PC_fillSidebarUser(){
  const u = PC_getUser(); if(!u) return;
  const n = document.getElementById('userName');
  const a = document.getElementById('avatarInitial');
  if(n) n.textContent = u.name;
  if(a) a.textContent = u.name.slice(0,1);
}
function PC_toast(msg, duration=2500){
  let t = document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer = setTimeout(()=>t.classList.remove('show'), duration);
}
function PC_nowStr(){
  const n = new Date();
  return (n.getMonth()+1).toString().padStart(2,'0')+'/'+(n.getDate()).toString().padStart(2,'0')+' '+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');
}

// ── Financial helpers ──
function PC_getPayers(event){ return (event.members||[]).filter(m=>m.role==='payer'); }
function PC_getExpectedAmount(event, member){
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

// ── Copy to clipboard ──
function PC_copyText(text, successMsg){
  navigator.clipboard.writeText(text).then(()=>{
    PC_toast(successMsg || '✅ 已複製！');
  }).catch(()=>{
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); PC_toast(successMsg||'✅ 已複製！'); }catch(e){}
    document.body.removeChild(ta);
  });
}
