import { db } from './firebase.js';
import { collection, doc, getDocs, setDoc, onSnapshot, query } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const rooms = [
  {id:'poolvilla', name:'บ้านพูลวิลล่า', type:'วิลล่า'},
  {id:'jacuzzi', name:'Jacuzzi', type:'วิลล่า'},
  {id:'cream1', name:'รถบ้านครีม 1', type:'รถบ้าน'},
  {id:'cream2', name:'รถบ้านครีม 2', type:'รถบ้าน'},
  {id:'viewhills1', name:'View Hills 1', type:'วิลล่า'},
  {id:'viewhills2', name:'View Hills 2', type:'วิลล่า'},
  {id:'whitehouse', name:'White House', type:'บ้านพัก'},
  {id:'mujihouse', name:'Muji House', type:'บ้านพัก'},
  {id:'mint1', name:'รถบ้านมิ้น 1', type:'รถบ้าน'},
  {id:'mint2', name:'รถบ้านมิ้น 2', type:'รถบ้าน'},
  {id:'gray3', name:'รถบ้านเทา 3', type:'รถบ้าน'},
  {id:'gray4', name:'รถบ้านเทา 4', type:'รถบ้าน'},
  {id:'cosy', name:'บ้านโคซี่', type:'บ้านพัก'}
];

const monthNames = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const dayNames = ['อา','จ','อ','พ','พฤ','ศ','ส'];
let selectedRoom = rooms[0].id;
let adminRoom = rooms[0].id;
let current = new Date();
let adminCurrent = new Date();
let statuses = {}; // key roomId_yyyy-mm-dd : available/booked/locked
let adminMode = 'available';

const $ = (id)=>document.getElementById(id);
const dateKey = (y,m,d)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const statusThai = {available:'ว่าง', booked:'ไม่ว่าง', locked:'ปิด'};

function toast(text='บันทึกแล้ว'){
  $('toast').textContent=text; $('toast').classList.add('show');
  setTimeout(()=>$('toast').classList.remove('show'),1800);
}

async function seedRooms(){
  const snap = await getDocs(collection(db,'rooms'));
  if(!snap.empty) return;
  await Promise.all(rooms.map(r=>setDoc(doc(db,'rooms',r.id), r)));
}

function listenStatuses(){
  onSnapshot(query(collection(db,'availability')), (snap)=>{
    statuses = {};
    snap.forEach(d=>{ statuses[d.id] = d.data().status || 'available'; });
    $('statusLine').textContent = 'เชื่อม Firebase สำเร็จ — ตารางออนไลน์แล้ว';
    renderAll();
  }, (err)=>{
    console.error(err);
    $('statusLine').textContent = 'เชื่อม Firebase ไม่สำเร็จ กรุณาเช็ก Rules / Internet';
  });
}

function getStatus(roomId,key){ return statuses[`${roomId}_${key}`] || 'available'; }
async function setStatus(roomId,key,status){
  await setDoc(doc(db,'availability',`${roomId}_${key}`), {roomId,date:key,status,updatedAt:new Date().toISOString()});
}

function renderRoomLists(){
  $('roomList').innerHTML = rooms.map(r=>`<button class="room-btn ${r.id===selectedRoom?'active':''}" data-room="${r.id}"><b>${r.name}</b><span>${r.type}</span></button>`).join('');
  $('adminRoomList').innerHTML = rooms.map(r=>`<button class="room-btn ${r.id===adminRoom?'active':''}" data-admin-room="${r.id}"><b>${r.name}</b><span>${r.type}</span></button>`).join('');
  document.querySelectorAll('[data-room]').forEach(btn=>btn.onclick=()=>{selectedRoom=btn.dataset.room;renderAll();});
  document.querySelectorAll('[data-admin-room]').forEach(btn=>btn.onclick=()=>{adminRoom=btn.dataset.adminRoom;renderAll();});
}

function renderMonthLabel(date, id){ $(id).textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()+543}`; }
function renderCalendar(targetId, roomId, date, isAdmin=false){
  const y = date.getFullYear(), m = date.getMonth();
  const firstDay = new Date(y,m,1).getDay();
  const total = new Date(y,m+1,0).getDate();
  let html = dayNames.map(d=>`<div class="day-name">${d}</div>`).join('');
  for(let i=0;i<firstDay;i++) html += `<div class="day empty"></div>`;
  for(let d=1; d<=total; d++){
    const key = dateKey(y,m,d);
    const st = getStatus(roomId,key);
    html += `<div class="day ${st} ${isAdmin?'admin':''}" ${isAdmin?`data-day="${key}"`:''}><span class="num">${d}</span><span class="status">${statusThai[st]}</span></div>`;
  }
  $(targetId).innerHTML = html;
  if(isAdmin){
    document.querySelectorAll('#adminCalendar .day.admin').forEach(el=>el.onclick=async()=>{
      await setStatus(roomId, el.dataset.day, adminMode);
      toast('บันทึกสถานะแล้ว');
    });
  }
}

function updateDashboard(){
  const today = new Date();
  const key = dateKey(today.getFullYear(),today.getMonth(),today.getDate());
  let avail=0, booked=0, locked=0;
  rooms.forEach(r=>{ const st=getStatus(r.id,key); if(st==='booked') booked++; else if(st==='locked') locked++; else avail++; });
  const cards = document.querySelectorAll('.status-card');
}

function renderAll(){
  renderRoomLists();
  const sr = rooms.find(r=>r.id===selectedRoom);
  const ar = rooms.find(r=>r.id===adminRoom);
  $('selectedRoomName').textContent = sr.name;
  $('adminRoomName').textContent = ar.name;
  renderMonthLabel(current,'monthLabel');
  renderMonthLabel(adminCurrent,'adminMonthLabel');
  renderCalendar('calendar', selectedRoom, current, false);
  renderCalendar('adminCalendar', adminRoom, adminCurrent, true);
}

function bindUI(){
  document.querySelectorAll('[data-page]').forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll('[data-page]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const page = btn.dataset.page;
    $('customerPage').classList.toggle('active', page==='customer');
    $('adminPage').classList.toggle('active', page==='admin');
  });
  $('prevMonth').onclick=()=>{current.setMonth(current.getMonth()-1);renderAll();};
  $('nextMonth').onclick=()=>{current.setMonth(current.getMonth()+1);renderAll();};
  $('adminPrevMonth').onclick=()=>{adminCurrent.setMonth(adminCurrent.getMonth()-1);renderAll();};
  $('adminNextMonth').onclick=()=>{adminCurrent.setMonth(adminCurrent.getMonth()+1);renderAll();};
  document.querySelectorAll('.mode').forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll('.mode').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); adminMode=btn.dataset.mode;
  });
  $('loginBtn').onclick=()=>{
    if($('adminPass').value==='1111'){
      $('adminLock').classList.add('hidden'); $('adminBoard').classList.remove('hidden');
    }else alert('รหัสไม่ถูกต้อง');
  };
}

bindUI();
renderAll();
seedRooms().then(listenStatuses).catch(err=>{
  console.error(err);
  $('statusLine').textContent = 'เชื่อม Firebase ไม่สำเร็จ กรุณาตรวจสอบ Firestore Rules';
});
