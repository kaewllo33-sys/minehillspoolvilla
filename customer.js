import { db } from './firebase.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { rooms, months, dayNames, statusText } from './shared.js';

let activeRoom = rooms[0];
let current = new Date();
let statuses = {};
let unsub = null;
const $ = id => document.getElementById(id);
const monthKey = () => `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
const dateKey = d => `${monthKey()}-${String(d).padStart(2,'0')}`;

function renderRooms(){
  $('roomList').innerHTML = rooms.map(r=>`<button class="room-card ${r===activeRoom?'active':''}" data-room="${r}">🏡 ${r}</button>`).join('');
  document.querySelectorAll('.room-card').forEach(btn=>btn.onclick=()=>{ activeRoom=btn.dataset.room; renderRooms(); listenMonth(); });
}
function renderCalendar(){
  $('activeRoomName').textContent = activeRoom;
  $('monthLabel').textContent = `${months[current.getMonth()]} ${current.getFullYear()+543}`;
  const year=current.getFullYear(), month=current.getMonth();
  const first=new Date(year,month,1).getDay();
  const total=new Date(year,month+1,0).getDate();
  const today=new Date(); today.setHours(0,0,0,0);
  let html=dayNames.map(d=>`<div class="day-name">${d}</div>`).join('');
  for(let i=0;i<first;i++) html+='<div class="day empty"></div>';
  for(let d=1;d<=total;d++){
    const dt=new Date(year,month,d); dt.setHours(0,0,0,0);
    const st=statuses[dateKey(d)] || 'free';
    html+=`<div class="day ${st} ${dt<today?'past':''}"><div class="day-num">${d}</div><div class="status">${statusText[st]}</div></div>`;
  }
  $('calendar').innerHTML=html;
}
function listenMonth(){
  if(unsub) unsub();
  statuses={}; renderCalendar();
  const start=`${monthKey()}-01`, end=`${monthKey()}-31`;
  const q=query(collection(db,'availability'), where('room','==',activeRoom), where('date','>=',start), where('date','<=',end));
  unsub=onSnapshot(q, snap=>{ statuses={}; snap.forEach(doc=>{ const x=doc.data(); statuses[x.date]=x.status; }); renderCalendar(); }, err=>{ console.error(err); renderCalendar(); });
}
$('prevMonth').onclick=()=>{ current.setMonth(current.getMonth()-1); listenMonth(); };
$('nextMonth').onclick=()=>{ current.setMonth(current.getMonth()+1); listenMonth(); };
renderRooms(); listenMonth();
