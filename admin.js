import { db } from './firebase.js';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { rooms, months, dayNames, statusText, safeRoomId } from './shared.js';

let activeRoom = rooms[0];
let current = new Date();
let mode = 'free';
let statuses = {};
let unsub = null;
const $ = id => document.getElementById(id);
const monthKey = () => `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
const dateKey = d => `${monthKey()}-${String(d).padStart(2,'0')}`;
const bookingId = date => `${safeRoomId(activeRoom)}_${date}`;

$('loginBtn').onclick=()=>{
  if($('password').value==='1111'){
    $('loginBox').classList.add('hidden');
    $('adminApp').classList.remove('hidden');
    renderRooms(); listenMonth();
  } else $('loginMsg').textContent='รหัสไม่ถูกต้อง';
};
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
    const key=dateKey(d);
    const st=statuses[key] || 'free';
    html+=`<div class="day ${st} ${dt<today?'past':''}" data-date="${key}"><div class="day-num">${d}</div><div class="status">${statusText[st]}</div></div>`;
  }
  $('calendar').innerHTML=html;
  document.querySelectorAll('.day[data-date]:not(.past)').forEach(el=>{
    el.onclick=async()=>{
      const date=el.dataset.date;
      $('saveStatus').textContent='กำลังบันทึก...';
      if(mode==='free') await deleteDoc(doc(db,'availability',bookingId(date)));
      else await setDoc(doc(db,'availability',bookingId(date)), {room:activeRoom,date,status:mode,updatedAt:new Date().toISOString()});
      $('saveStatus').textContent='บันทึกแล้ว';
      setTimeout(()=>$('saveStatus').textContent='พร้อมใช้งาน',1200);
    };
  });
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
document.querySelectorAll('.mode[data-mode]').forEach(btn=>btn.onclick=()=>{ mode=btn.dataset.mode; document.querySelectorAll('.mode[data-mode]').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); });
$('clearMonth').onclick=async()=>{
  if(!confirm(`ล้างสถานะทั้งหมดของ ${activeRoom} ในเดือนนี้ใช่ไหม?`)) return;
  $('saveStatus').textContent='กำลังล้างข้อมูล...';
  const start=`${monthKey()}-01`, end=`${monthKey()}-31`;
  const q=query(collection(db,'availability'), where('room','==',activeRoom), where('date','>=',start), where('date','<=',end));
  const snap=await getDocs(q);
  await Promise.all(snap.docs.map(d=>deleteDoc(d.ref)));
  $('saveStatus').textContent='ล้างทั้งเดือนแล้ว';
  setTimeout(()=>$('saveStatus').textContent='พร้อมใช้งาน',1400);
};
