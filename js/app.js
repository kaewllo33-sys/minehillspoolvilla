import { db } from './firebase.js';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const rooms = [
  'บ้านพูลวิลล่า','Jacuzzi','รถบ้านครีม 1','รถบ้านครีม 2','View Hills 1','View Hills 2','White House','Muji House','รถบ้านมิ้น 1','รถบ้านมิ้น 2','รถบ้านเทา 3','รถบ้านเทา 4','บ้านโคซี่'
];
const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const dayNames = ['อา','จ','อ','พ','พฤ','ศ','ส'];
const statusText = { free:'ว่าง', booked:'จองแล้ว', locked:'ปิด' };

let activeRoom = rooms[0];
let current = new Date();
let mode = 'free';
let admin = false;
let statuses = {};
let unsub = null;

const $ = (id)=>document.getElementById(id);
const monthKey = ()=> `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
const dateKey = (d)=> `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const safeRoomId = (name)=> name.replaceAll(' ','_').replaceAll('/','_');
const docId = (date)=> `${safeRoomId(activeRoom)}_${date}`;

function renderRooms(){
  $('roomList').innerHTML = rooms.map(r=>`<button class="room-card ${r===activeRoom?'active':''}" data-room="${r}">${r}</button>`).join('');
  document.querySelectorAll('.room-card').forEach(btn=>btn.onclick=()=>{activeRoom=btn.dataset.room; listenMonth(); renderRooms();});
}

function renderCalendar(){
  $('monthLabel').textContent = `${months[current.getMonth()]} ${current.getFullYear()+543}`;
  $('activeRoomName').textContent = activeRoom;
  const year = current.getFullYear(), month = current.getMonth();
  const first = new Date(year,month,1).getDay();
  const total = new Date(year,month+1,0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);
  let html = dayNames.map(d=>`<div class="day-name">${d}</div>`).join('');
  for(let i=0;i<first;i++) html += '<div class="day empty"></div>';
  for(let d=1; d<=total; d++){
    const dt = new Date(year,month,d); dt.setHours(0,0,0,0);
    const key = dateKey(d);
    const st = statuses[key] || 'free';
    html += `<div class="day ${st} ${dt<today?'past':''}" data-date="${key}"><div class="day-num">${d}</div><div class="status">${statusText[st]}</div></div>`;
  }
  $('calendar').innerHTML = html;
  if(admin){
    document.body.classList.add('admin-active');
    document.querySelectorAll('.day[data-date]:not(.past)').forEach(el=>{
      el.onclick = async()=>{
        const date = el.dataset.date;
        $('saveStatus').textContent = 'กำลังบันทึก...';
        if(mode==='free') await deleteDoc(doc(db,'availability',docId(date)));
        else await setDoc(doc(db,'availability',docId(date)),{room:activeRoom,date,status:mode,updatedAt:new Date().toISOString()});
        $('saveStatus').textContent = 'บันทึกแล้ว';
        setTimeout(()=>$('saveStatus').textContent='พร้อมใช้งาน',1200);
      };
    });
  } else {
    document.body.classList.remove('admin-active');
  }
}

function listenMonth(){
  if(unsub) unsub();
  statuses = {};
  const start = `${monthKey()}-01`;
  const end = `${monthKey()}-31`;
  const q = query(collection(db,'availability'), where('room','==',activeRoom), where('date','>=',start), where('date','<=',end));
  unsub = onSnapshot(q,(snap)=>{
    statuses = {};
    snap.forEach(doc=>{ const data=doc.data(); statuses[data.date]=data.status; });
    renderCalendar();
  },(err)=>{
    console.error(err);
    renderCalendar();
  });
}

$('prevMonth').onclick = ()=>{ current.setMonth(current.getMonth()-1); listenMonth(); };
$('nextMonth').onclick = ()=>{ current.setMonth(current.getMonth()+1); listenMonth(); };
$('adminBtn').onclick = ()=>{
  const pass = prompt('ใส่รหัสแอดมิน');
  if(pass==='1111'){
    admin = true;
    $('adminPanel').classList.remove('hidden');
    $('customerPanel').scrollIntoView({behavior:'smooth'});
    renderCalendar();
  } else if(pass!==null) alert('รหัสไม่ถูกต้อง');
};
$('backCustomer').onclick = ()=>{ admin=false; $('adminPanel').classList.add('hidden'); renderCalendar(); };
document.querySelectorAll('.mode[data-mode]').forEach(btn=>btn.onclick=()=>{
  mode = btn.dataset.mode;
  document.querySelectorAll('.mode[data-mode]').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
});
$('clearMonth').onclick = async()=>{
  if(!confirm(`ปลดล็อก/ล้างสถานะทั้งหมดของ ${activeRoom} ในเดือนนี้ใช่ไหม?`)) return;
  $('saveStatus').textContent = 'กำลังล้างข้อมูล...';
  const start = `${monthKey()}-01`, end = `${monthKey()}-31`;
  const q = query(collection(db,'availability'), where('room','==',activeRoom), where('date','>=',start), where('date','<=',end));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d=>deleteDoc(d.ref)));
  $('saveStatus').textContent = 'ปลดล็อกทั้งเดือนแล้ว';
  setTimeout(()=>$('saveStatus').textContent='พร้อมใช้งาน',1600);
};

renderRooms();
listenMonth();
