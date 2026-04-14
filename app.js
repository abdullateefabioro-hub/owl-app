const state = {
  deferredPrompt: null,
  ws: null,
  watchId: null,
  page: 'homePage',
  meId: getOrCreateId(),
  pairPhrase: localStorage.getItem('owl_pair_phrase') || '',
  roomId: localStorage.getItem('owl_room_id') || '',
  backendUrl: localStorage.getItem('owl_backend_url') || '',
  chat: loadJSON('owl_chat', []),
  locations: pruneLocations(loadJSON('owl_locations', [])),
  sleep: loadJSON('owl_sleep', []),
  exercise: loadJSON('owl_exercise', []),
  streakDays: loadJSON('owl_streak_days', []),
  photos: loadJSON('owl_photos', []),
  events: loadJSON('owl_events', [{title:'Her Birthday', date:'2027-01-19'}]),
  cat: loadJSON('owl_cat', null),
};

const FEATURES = [
  ['chatPage','💬','Chat','Sweet words anytime'],
  ['callPage','📞','Call','One-tap private room'],
  ['catPage','🐱','Cat of the Day','A daily little smile'],
  ['locationPage','📍','Location','Live share and check-ins'],
  ['wellnessPage','🍽️','Wellness','Meals, sleep, exercise'],
  ['streaksPage','🔥','Streaks','Keep your connection glowing'],
  ['photosPage','📸','Memories','Your album together'],
  ['calendarPage','🗓️','Calendar','Dates and important moments'],
  ['gamesPage','🎮','Games','Her favorite worlds'],
  ['settingsPage','⚙️','Settings','Connect your backend'],
];

const GAMES = [
  ['Subway Surfers','https://apps.apple.com/ca/app/subway-surfers/id512939461'],
  ['Business Empire: RichMan','https://apps.apple.com/ca/app/business-empire-richman/id6451208928'],
  ['Idle Bank Tycoon: Money Game','https://apps.apple.com/ca/app/idle-bank-tycoon-make-money/id1645281275'],
  ['Township','https://apps.apple.com/ca/search?term=Township']
];

const MEALS = [
  'Smoky Party Jollof Rice + Fried Chicken + Creamy Mango Lassi',
  'Asun Jollof Rice + Warm Gulab Jamun',
  'Mild Vegetable Jollof Rice + Kheer',
  'Lazy Day Jollof Rice + Mango Shrikhand',
  'Samosa', 'Pani Puri', 'Dhokla', 'Jalebi', 'Rasmalai', 'Barfi', 'Masala Dosa'
];

function qs(s){ return document.querySelector(s); }
function qsa(s){ return [...document.querySelectorAll(s)]; }
function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function loadJSON(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function getOrCreateId(){
  let id = localStorage.getItem('owl_me_id');
  if(!id){ id = crypto.randomUUID(); localStorage.setItem('owl_me_id', id); }
  return id;
}
function formatTime(ts){ return new Date(ts).toLocaleString(); }
function escapeHtml(str){ const d=document.createElement('div'); d.textContent=str; return d.innerHTML; }
function simpleEncrypt(text){
  return btoa(text);
}

function simpleDecrypt(text){
  return atob(text);
}
function pruneLocations(arr){
  const cutoff = Date.now() - 24*60*60*1000;
  return arr.filter(x => x.ts >= cutoff).sort((a,b)=>b.ts-a.ts);
}
async function sha256Base64(text){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/[^a-zA-Z0-9]/g,'').slice(0,24);
}

function init(){
  buildGrid();
  buildNav();
  bindEvents();
  renderAll();
  registerSW();
  setupInstall();
  scheduleReminder();
}const LOVE_MESSAGES = [

"You are my favourite part of every day 💙",
"No matter the distance, you are always close to my heart",
"Our little world is my safest place",
"You make ordinary days feel magical",
"My heart feels calm when I think of you",
"You are my peace, my happiness, my everything",
"Every day I feel lucky to have you",
"You are my forever person",
"Even miles away, I feel you with me",
"Sweny (Kuku) 💙 you are my home"

];

function showLoveMessage(){

const today = new Date().toDateString();

let saved = localStorage.getItem("owl_love_msg");

if(saved){

saved = JSON.parse(saved);

if(saved.day === today){

document.getElementById("loveMessage").textContent = saved.msg;

return;

}
function scheduleReminder(){

setTimeout(()=>{

alert("Time to message Sweny 💙");

}, 1000*60*60*4); // 4 hours

}
}

const msg = LOVE_MESSAGES[Math.floor(Math.random()*LOVE_MESSAGES.length)];

localStorage.setItem("owl_love_msg", JSON.stringify({day:today,msg}));

document.getElementById("loveMessage").textContent = msg;

}

function buildGrid(){
  qs('#featureGrid').innerHTML = FEATURES.map(([page,icon,title,desc]) => `
    <button class="card glass nav-card" data-page="${page}">
      <div><div class="card-icon">${icon}</div><h3>${title}</h3><p class="muted">${desc}</p></div>
      <span class="muted">Open</span>
    </button>`).join('');
}
function buildNav(){
  const navItems = [
    ['homePage','Home'],['chatPage','Chat'],['callPage','Call'],['locationPage','Location'],['wellnessPage','Care'],['photosPage','Memories'],['gamesPage','Games'],['settingsPage','Settings']
  ];
  qs('#bottomNav').innerHTML = navItems.map(([page,label]) => `<button class="nav-btn ${page===state.page?'active':''}" data-page="${page}">${label}</button>`).join('');
}
function showPage(id){
  state.page = id;
  qsa('.page').forEach(p => p.classList.toggle('active', p.id===id));
  qsa('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page===id));
  window.scrollTo({top:0,behavior:'smooth'});
}

function bindEvents(){
  document.body.addEventListener('click', e => {
    const page = e.target.closest('[data-page]')?.dataset.page;
    if(page){ showPage(page); return; }
  });

  qs('#pairPhrase').value = state.pairPhrase;
  qs('#backendUrlInput').value = state.backendUrl;
  qs('#savePhraseBtn').onclick = savePairPhrase;
  qs('#saveBackendBtn').onclick = saveBackendUrl;
  qs('#chatForm').addEventListener('submit', sendChat);
  qs('.clear-chat').onclick = () => { if(confirm('Clear local chat on this device?')){ state.chat=[]; saveJSON('owl_chat',state.chat); renderChat(); }};
  qs('#newCatBtn').onclick = () => loadCat(true);
  qs('#launchCallBtn').onclick = launchCall;
  qs('#checkInBtn').onclick = oneTimeCheckIn;
  qs('#startLiveBtn').onclick = startLiveShare;
  qs('#stopLiveBtn').onclick = stopLiveShare;
  qs('#saveSleepBtn').onclick = saveSleep;
  qs('#saveExerciseBtn').onclick = saveExercise;
  qs('#markStreakBtn').onclick = markStreak;
  qs('#photoInput').addEventListener('change', handlePhotos);
  qs('#saveEventBtn').onclick = saveEvent;
}

async function savePairPhrase(){
  const phrase = qs('#pairPhrase').value.trim();
  if(!phrase){ qs('#pairingStatus').textContent = 'Enter a phrase first.'; return; }
  state.pairPhrase = phrase;
  state.roomId = await sha256Base64(phrase);
  localStorage.setItem('owl_pair_phrase', phrase);
  localStorage.setItem('owl_room_id', state.roomId);
  qs('#pairingStatus').textContent = `Saved. Your shared room is ready.`;
  connectSocket();
}
function saveBackendUrl(){
  const url = qs('#backendUrlInput').value.trim().replace(/\/$/,'');
  state.backendUrl = url;
  localStorage.setItem('owl_backend_url', url);
  if(state.roomId) connectSocket();
}
function renderAll(){

  renderChat(); 
  renderLocations(); 
  renderWellness(); 
  renderStreaks(); 
  renderPhotos(); 
  renderEvents(); 
  renderGames(); 
  renderCat(); 

  showLoveMessage();

  updatePairStatus();

  if(state.roomId && state.backendUrl) connectSocket();

  loadCat(false);

}
function updatePairStatus(){
  qs('#pairingStatus').textContent = state.roomId ? 'Paired phrase saved on this phone.' : 'Not paired yet.';
}

function renderChat(){
  const el = qs('#chatMessages');
  if(!state.chat.length){ el.innerHTML = `<div class="muted">No messages yet. Start your little world.</div>`; return; }
  el.innerHTML = state.chat.map(msg => `
    <div class="bubble ${msg.sender===state.meId?'me':'them'}">
      <div>${escapeHtml(simpleDecrypt(msg.text))}</div>
      <div class="bubble-meta">${msg.sender===state.meId?'You':'Her'} • ${formatTime(msg.ts)}</div>
    </div>`).join('');
  el.scrollTop = el.scrollHeight;
}
function addLocalMessage(msg){
  state.chat.push(msg);
  state.chat = state.chat.slice(-300);
  saveJSON('owl_chat', state.chat);
  renderChat();
}
function sendChat(e){
  e.preventDefault();
  const input = qs('#chatInput');
  const text = input.value.trim();
  if(!text) return;
  const msg = { type:'chat', sender:state.meId, text: simpleEncrypt(text), ts:Date.now(), roomId:state.roomId };
  addLocalMessage(msg);
  input.value='';
  relay(msg);
}

function socketWsUrl(){
  const base = state.backendUrl;
  if(!base || !state.roomId) return null;
  return base.replace(/^http/,'ws') + `/ws?room=${encodeURIComponent(state.roomId)}&client=${encodeURIComponent(state.meId)}`;
}
function connectSocket(){
  if(!state.backendUrl || !state.roomId) return;
  if(state.ws && [WebSocket.OPEN, WebSocket.CONNECTING].includes(state.ws.readyState)) return;
  try{
    state.ws = new WebSocket(socketWsUrl());
    state.ws.onopen = () => console.log('OWL connected');
    state.ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        if(data.sender === state.meId) return;
        if(data.type==='chat') addLocalMessage(data);
        if(data.type==='location') addLocation(data, false);
      } catch(err){ console.error(err); }
    };
    state.ws.onclose = () => setTimeout(connectSocket, 2500);
  } catch(err){ console.error(err); }
}
function relay(payload){
  if(state.ws && state.ws.readyState === WebSocket.OPEN){ state.ws.send(JSON.stringify(payload)); }
}

async function loadCat(force){
  const today = new Date().toDateString();
  if(!force && state.cat?.day === today){ return renderCat(); }
  try {
    const res = await fetch('https://api.thecatapi.com/v1/images/search');
    const data = await res.json();
    state.cat = { day: today, url: data?.[0]?.url || fallbackCat(), title:'Cat of the Day', caption:'A realistic little cat to make her smile.' };
  } catch {
    state.cat = { day: today, url: fallbackCat(), title:'Cat of the Day', caption:'A little cat even when you are offline.' };
  }
  saveJSON('owl_cat', state.cat);
  renderCat();
}
function fallbackCat(){
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#141418"/><stop offset="1" stop-color="#2f1020"/></linearGradient></defs><rect width="900" height="900" fill="url(#g)"/><circle cx="450" cy="470" r="220" fill="#f3f3f8" opacity="0.9"/><circle cx="360" cy="420" r="24" fill="#111"/><circle cx="540" cy="420" r="24" fill="#111"/><path d="M410 520 Q450 550 490 520" stroke="#ff5aa5" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M300 250 L380 140 L420 310 Z" fill="#f3f3f8"/><path d="M600 250 L520 140 L480 310 Z" fill="#f3f3f8"/><text x="450" y="760" text-anchor="middle" fill="#fff" font-size="42" font-family="Arial">O.W.L Cat of the Day</text></svg>`);
}
function renderCat(){
  qs('#catImage').src = state.cat?.url || fallbackCat();
  qs('#catTitle').textContent = state.cat?.title || 'Cat of the Day';
  qs('#catCaption').textContent = state.cat?.caption || 'A soft cat moment.';
}

function addLocation(loc, shouldRelay=true){
  state.locations = pruneLocations([{...loc}, ...state.locations]).slice(0,300);
  saveJSON('owl_locations', state.locations);
  renderLocations();
  if(shouldRelay) relay(loc);
}
function renderLocations(){
  const el = qs('#locationHistory');
  if(!state.locations.length){ el.innerHTML = '<div class="muted">No location entries yet.</div>'; return; }
  el.innerHTML = state.locations.map(item => `
    <div class="history-item">
      <strong>${item.sender===state.meId?'You':'Her'}</strong><br>
      ${Number(item.lat).toFixed(5)}, ${Number(item.lng).toFixed(5)}<br>
      <span class="muted">${formatTime(item.ts)}</span>
      <div><a class="map-link" target="_blank" rel="noreferrer" href="https://www.google.com/maps?q=${item.lat},${item.lng}">Open on map</a></div>
    </div>`).join('');
}
function locationPayload(pos){
  return { type:'location', sender:state.meId, roomId:state.roomId, lat:pos.coords.latitude, lng:pos.coords.longitude, accuracy:pos.coords.accuracy, ts:Date.now() };
}
function setLocationUI(on, text=''){
  qs('#locationBadge').className = `status-badge ${on?'on':'off'}`;
  qs('#locationBadge').textContent = on ? 'ON' : 'OFF';
  qs('#locationStatus').textContent = text || (on ? 'Sharing...' : 'Location not started.');
}
function oneTimeCheckIn(){
  if(!navigator.geolocation) return setLocationUI(false,'Geolocation is not available on this device.');
  setLocationUI(true,'Getting exact location…');
  navigator.geolocation.getCurrentPosition(pos => {
    const payload = locationPayload(pos);
    addLocation(payload);
    qs('#liveMapLinkWrap').innerHTML = `<a class="map-link" target="_blank" rel="noreferrer" href="https://www.google.com/maps?q=${payload.lat},${payload.lng}">Open latest location</a>`;
    setLocationUI(true, `Shared at ${formatTime(payload.ts)}`);
  }, err => setLocationUI(false, 'Location error: ' + err.message), {enableHighAccuracy:true, timeout:15000, maximumAge:0});
}
function startLiveShare(){
  if(!navigator.geolocation) return setLocationUI(false,'Geolocation is not available on this device.');
  if(state.watchId) return setLocationUI(true,'Live sharing is already running while the app stays open.');
  state.watchId = navigator.geolocation.watchPosition(pos => {
    const payload = locationPayload(pos);
    addLocation(payload);
    setLocationUI(true, `Live share active • ${formatTime(payload.ts)}`);
  }, err => setLocationUI(false, 'Live share error: ' + err.message), {enableHighAccuracy:true, maximumAge:5000, timeout:15000});
}
function stopLiveShare(){
  if(state.watchId){ navigator.geolocation.clearWatch(state.watchId); state.watchId = null; }
  setLocationUI(false, 'Location sharing stopped.');
}

function renderWellness(){
  qs('#mealBoard').innerHTML = MEALS.map(m => `<div class="meal-item">${m}</div>`).join('');
  const lastSleep = state.sleep.at(-1);
  const lastEx = state.exercise.at(-1);
  qs('#sleepStatus').textContent = lastSleep ? `Last saved: ${lastSleep.hours} hours on ${new Date(lastSleep.ts).toLocaleDateString()}` : 'No sleep entry yet.';
  qs('#exerciseStatus').textContent = lastEx ? `Last saved: ${lastEx.minutes} minutes on ${new Date(lastEx.ts).toLocaleDateString()}` : 'No exercise entry yet.';
}
function saveSleep(){
  const hours = Number(qs('#sleepInput').value);
  if(Number.isNaN(hours) || hours<0) return;
  state.sleep.push({hours, ts:Date.now()});
  saveJSON('owl_sleep', state.sleep);
  qs('#sleepInput').value='';
  renderWellness();
}
function saveExercise(){
  const minutes = Number(qs('#exerciseInput').value);
  if(Number.isNaN(minutes) || minutes<0) return;
  state.exercise.push({minutes, ts:Date.now()});
  saveJSON('owl_exercise', state.exercise);
  qs('#exerciseInput').value='';
  renderWellness();
}

function markStreak(){
  const day = new Date().toISOString().slice(0,10);
  if(!state.streakDays.includes(day)) state.streakDays.push(day);
  state.streakDays = [...new Set(state.streakDays)].sort();
  saveJSON('owl_streak_days', state.streakDays);
  renderStreaks();
}
function currentStreak(days){
  const set = new Set(days);
  let count = 0; const d = new Date();
  while(true){
    const key = d.toISOString().slice(0,10);
    if(set.has(key)){ count++; d.setDate(d.getDate()-1); }
    else break;
  }
  return count;
}
function renderStreaks(){
  const total = state.streakDays.length;
  const current = currentStreak(state.streakDays);
  qs('#streakStatus').textContent = total ? `Current streak: ${current} day(s)` : 'No streak yet. Mark today to begin.';
  qs('#streakStats').innerHTML = `
    <div class="stat-box"><strong>${current}</strong><br><span class="muted">Current streak</span></div>
    <div class="stat-box"><strong>${total}</strong><br><span class="muted">Total marked days</span></div>`;
}

function handlePhotos(e){
  const files = [...e.target.files].slice(0,12);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      state.photos.unshift({id: crypto.randomUUID(), src: reader.result, name: file.name});
      state.photos = state.photos.slice(0,50);
      saveJSON('owl_photos', state.photos);
      renderPhotos();
    };
    reader.readAsDataURL(file);
  });
  e.target.value='';
}
function renderPhotos(){
  const grid = qs('#photoGrid');
  if(!state.photos.length){ grid.innerHTML = '<div class="muted">No photos saved on this phone yet.</div>'; return; }
  grid.innerHTML = state.photos.map(p => `
    <div class="photo-card">
      <img src="${p.src}" alt="${escapeHtml(p.name)}" />
      <button class="ghost-btn" data-del-photo="${p.id}">Remove</button>
    </div>`).join('');
  qsa('[data-del-photo]').forEach(btn => btn.onclick = () => {
    state.photos = state.photos.filter(p => p.id !== btn.dataset.delPhoto);
    saveJSON('owl_photos', state.photos); renderPhotos();
  });
}

function saveEvent(){
  const title = qs('#eventTitle').value.trim();
  const date = qs('#eventDate').value;
  if(!title || !date) return;
  state.events.push({id: crypto.randomUUID(), title, date});
  state.events.sort((a,b)=>a.date.localeCompare(b.date));
  saveJSON('owl_events', state.events);
  qs('#eventTitle').value=''; qs('#eventDate').value='';
  renderEvents();
}
function renderEvents(){
  const list = qs('#eventsList');
  if(!state.events.length){ list.innerHTML = '<div class="muted">No events yet.</div>'; return; }
  list.innerHTML = state.events.map(ev => `
    <div class="event-item">
      <strong>${escapeHtml(ev.title)}</strong><br>
      <span class="muted">${ev.date}</span>
    </div>`).join('');
}

function renderGames(){
  qs('#gamesList').innerHTML = GAMES.map(([name,url]) => `<a class="game-link" href="${url}" target="_blank" rel="noreferrer">${name}</a>`).join('');
}

function launchCall(){
  const custom = qs('#callRoomInput').value.trim();
  const room = custom || `owl-${state.roomId || 'ourworld'}`;
  const src = `https://meet.jit.si/${encodeURIComponent(room)}#config.prejoinPageEnabled=false`;
  qs('#callFrame').src = src;
  qs('#callFrameWrap').classList.remove('hidden');
}

function setupInstall(){
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    state.deferredPrompt = e;
    qs('#installBtn').classList.remove('hidden');
  });
  qs('#installBtn').onclick = async () => {
    if(!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
    qs('#installBtn').classList.add('hidden');
  };
}
function registerSW(){
  if('serviceWorker' in navigator){
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(console.error));
  }
}

document.addEventListener('DOMContentLoaded', init);
