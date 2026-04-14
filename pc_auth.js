// PayClub shared auth & data utilities
// Include via: <script src="pc_auth.js"></script>

const DEMO_USER = { name: 'Demo 幹部', email: 'demo@payclub.app', role: 'leader' };

const SEED_EVENTS = [
  { id:'e1', title:'2025 迎新活動費用', amount:300, deadline:'2025-10-15', desc:'涵蓋餐費與活動器材費用，請於截止日前完成繳費。', status:'active',
    members:[{name:'林小明',status:'paid',paidAt:'10/05 14:22'},{name:'陳美玲',status:'paid',paidAt:'10/06 09:11'},{name:'王大衛',status:'pending',paidAt:''},{name:'張雅婷',status:'overdue',paidAt:''},{name:'黃俊豪',status:'paid',paidAt:'10/04 20:35'},{name:'李小花',status:'paid',paidAt:'10/05 11:08'},{name:'吳志豪',status:'pending',paidAt:''},{name:'劉書羽',status:'paid',paidAt:'10/07 16:44'}]},
  { id:'e2', title:'11 月社遊費用', amount:500, deadline:'2025-11-01', desc:'墾丁三日遊，含交通住宿費用。出發前請完成繳費，謝謝！', status:'active',
    members:[{name:'林小明',status:'paid',paidAt:'10/20 10:00'},{name:'陳美玲',status:'pending',paidAt:''},{name:'王大衛',status:'pending',paidAt:''},{name:'黃俊豪',status:'paid',paidAt:'10/21 09:30'},{name:'李小花',status:'overdue',paidAt:''}]},
  { id:'e3', title:'年度社費（下學期）', amount:200, deadline:'2025-09-30', desc:'下學期社費，請完成繳費以維持社員資格。', status:'closed',
    members:[{name:'林小明',status:'paid',paidAt:'09/01 08:00'},{name:'陳美玲',status:'paid',paidAt:'09/02 13:00'},{name:'王大衛',status:'paid',paidAt:'09/01 15:30'},{name:'張雅婷',status:'paid',paidAt:'09/03 10:00'}]},
];

// ── Auth ──
function PC_getUser() {
  return JSON.parse(localStorage.getItem('pc_current_user') || 'null');
}
function PC_isLoggedIn() {
  return !!PC_getUser();
}
function PC_requireLogin() {
  if (!PC_isLoggedIn()) {
    location.href = 'login.html?next=' + encodeURIComponent(location.href);
    return null;
  }
  return PC_getUser();
}
function PC_logout() {
  localStorage.removeItem('pc_current_user');
  location.href = 'login.html';
}

// ── Events ──
function PC_getEvents() {
  const raw = localStorage.getItem('pc_events');
  if (!raw) {
    localStorage.setItem('pc_events', JSON.stringify(SEED_EVENTS));
    return JSON.parse(JSON.stringify(SEED_EVENTS));
  }
  return JSON.parse(raw);
}
function PC_saveEvents(events) {
  localStorage.setItem('pc_events', JSON.stringify(events));
}
function PC_getEvent(id) {
  return PC_getEvents().find(e => e.id === id) || null;
}
function PC_updateEvent(updatedEvent) {
  const evts = PC_getEvents();
  const idx = evts.findIndex(e => e.id === updatedEvent.id);
  if (idx >= 0) evts[idx] = updatedEvent;
  PC_saveEvents(evts);
}

// ── Sidebar user info ──
function PC_fillSidebarUser() {
  const user = PC_getUser();
  if (!user) return;
  const nameEl = document.getElementById('userName');
  const avatarEl = document.getElementById('avatarInitial');
  if (nameEl) nameEl.textContent = user.name;
  if (avatarEl) avatarEl.textContent = user.name.slice(0, 1);
}

// ── Toast ──
function PC_toast(msg, duration = 2500) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

// ── Time now ──
function PC_nowStr() {
  const now = new Date();
  return (now.getMonth()+1).toString().padStart(2,'0') + '/' + now.getDate().toString().padStart(2,'0') + ' ' + now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
}
