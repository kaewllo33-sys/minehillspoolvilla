import { db } from './firebase.js';
import { collection, doc, setDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp, query, orderBy, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const rooms = [
  {id:'poolvilla', name:'บ้านพูลวิลล่า', type:'วิลล่า'},
  {id:'jacuzzi', name:'Jacuzzi', type:'วิลล่า'},
  {id:'cream1', name:'รถบ้านครีม 1', type:'รถบ้าน'},
  {id:'cream2', name:'รถบ้านครีม 2', type:'รถบ้าน'},
  {id:'viewhills1', name:'View Hills 1', type:'วิลล่า'},
  {id:'viewhills2', name:'View Hills 2', type:'วิลล่า'},
  {id:'whitehouse', name:'White House', type:'บ้านพัก'},
  {id:'muji', name:'Muji House', type:'บ้านพัก'},
  {id:'mint1', name:'รถบ้านมิ้น 1', type:'รถบ้าน'},
  {id:'mint2', name:'รถบ้านมิ้น 2', type:'รถบ้าน'},
  {id:'gray3', name:'รถบ้านเทา 3', type:'รถบ้าน'},
  {id:'gray4', name:'รถบ้านเทา 4', type:'รถบ้าน'},
  {id:'cosy', name:'บ้านโคซี่', type:'บ้านพัก'},
];

const TH_MONTHS=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const DAY_NAMES=['อา','จ','อ','พ','พฤ','ศ','ส'];
let selectedRoom=rooms[0];
let viewDate=new Date();
let mode='available';
let dayStatus={};
let bookings=[];

const $=id=>document.getElementById(id);
function keyOf(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function money(n){return Number(n||0).toLocaleString('th-TH');}
function toast(text){const t=$('toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}

function initTabs(){document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(`page-${btn.dataset.page}`).classList.add('active');});}

function renderRooms(){const list=$('roomList');const select=$('bookingRoom');list.innerHTML='';select.innerHTML='';rooms.forEach(r=>{const b=document.createElement('button');b.className='room-card'+(r.id===selectedRoom.id?' active':'');b.innerHTML=`<b>${r.name}</b><span>${r.type}</span>`;b.onclick=()=>{selectedRoom=r;renderRooms();renderCalendar();};list.appendChild(b);const o=document.createElement('option');o.value=r.id;o.textContent=r.name;select.appendChild(o);});}

function renderCalendar(){
  $('selectedRoomName').textContent=selectedRoom.name;$('selectedRoomType').textContent=selectedRoom.type;
  const y=viewDate.getFullYear(),m=viewDate.getMonth();$('monthLabel').textContent=`${TH_MONTHS[m]} ${y+543}`;
  const grid=$('calendarGrid');grid.innerHTML='';DAY_NAMES.forEach(d=>{const el=document.createElement('div');el.className='day-name';el.textContent=d;grid.appendChild(el);});
  const first=new Date(y,m,1).getDay();const total=new Date(y,m+1,0).getDate();
  for(let i=0;i<first;i++){const e=document.createElement('div');e.className='day empty';grid.appendChild(e);}
  const todayKey=keyOf(new Date());
  for(let d=1;d<=total;d++){
    const dt=new Date(y,m,d);const k=keyOf(dt);const st=dayStatus[selectedRoom.id]?.[k] || 'available';
    const el=document.createElement('button');el.className=`day ${st}`+(k===todayKey?' today':'');
    const label=st==='booked'?'จองแล้ว':st==='locked'?'ล็อก':'ว่าง';
    el.innerHTML=`<div class="num">${d}</div><div class="st">${label}</div>`;
    el.onclick=async()=>{await setDayStatus(selectedRoom.id,k,mode);};grid.appendChild(el);
  }
}

async function setDayStatus(roomId,dateKey,selectedMode){
  const ref=doc(db,'roomDays',`${roomId}_${dateKey}`);
  if(selectedMode==='available'||selectedMode==='clear') await deleteDoc(ref);
  else await setDoc(ref,{roomId,date:dateKey,status:selectedMode,updatedAt:serverTimestamp()});
  toast('บันทึกสถานะวันแล้ว');
}

function listenRoomDays(){onSnapshot(collection(db,'roomDays'),snap=>{dayStatus={};snap.forEach(s=>{const v=s.data();if(!dayStatus[v.roomId])dayStatus[v.roomId]={};dayStatus[v.roomId][v.date]=v.status;});renderCalendar();renderDashboard();$('syncStatus').textContent='เชื่อม Firebase สำเร็จ — ข้อมูลออนไลน์แล้ว';},err=>{$('syncStatus').textContent='เชื่อม Firebase ไม่สำเร็จ: '+err.message;});}

function listenBookings(){const q=query(collection(db,'bookings'),orderBy('createdAt','desc'));onSnapshot(q,snap=>{bookings=[];snap.forEach(d=>bookings.push({id:d.id,...d.data()}));renderBookingList();renderDashboard();});}

function renderDashboard(){const today=keyOf(new Date());let booked=0,locked=0;rooms.forEach(r=>{const st=dayStatus[r.id]?.[today]||'available';if(st==='booked')booked++;if(st==='locked')locked++;});$('statAvailable').textContent=rooms.length-booked-locked;$('statBooked').textContent=booked;$('statLocked').textContent=locked;const now=new Date();const rev=bookings.filter(b=>b.checkIn?.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`)).reduce((s,b)=>s+Number(b.deposit||0),0);$('statRevenue').textContent=money(rev);const box=$('todayList');box.innerHTML='';rooms.forEach(r=>{const st=dayStatus[r.id]?.[today]||'available';const label=st==='booked'?'🔴 จองแล้ว':st==='locked'?'⚫ ล็อกไม่ว่าง':'🟢 ว่าง';const el=document.createElement('div');el.className='today-item';el.innerHTML=`<b>${r.name}</b><span>${label}</span>`;box.appendChild(el);});}

function renderBookingList(){const box=$('bookingList');box.innerHTML='';if(!bookings.length){box.innerHTML='<p class="hint">ยังไม่มีรายการจอง</p>';return;}bookings.slice(0,30).forEach(b=>{const r=rooms.find(x=>x.id===b.roomId);const remain=Number(b.totalPrice||0)-Number(b.deposit||0);const el=document.createElement('div');el.className='booking-item';el.innerHTML=`<b>${b.customerName||'-'} · ${r?.name||b.roomId}</b><span>${b.checkIn||'-'} ถึง ${b.checkOut||'-'} · โทร ${b.customerPhone||'-'} · LINE ${b.customerLine||'-'}</span><br><span>ยอดเต็ม ${money(b.totalPrice)} · มัดจำ ${money(b.deposit)} · คงเหลือ ${money(remain)} · ${b.paymentStatus||''}</span>`;box.appendChild(el);});}

function initForm(){ $('bookingForm').onsubmit=async(e)=>{e.preventDefault();const data={roomId:$('bookingRoom').value,customerName:$('customerName').value.trim(),customerPhone:$('customerPhone').value.trim(),customerLine:$('customerLine').value.trim(),checkIn:$('checkIn').value,checkOut:$('checkOut').value,guestCount:Number($('guestCount').value||0),totalPrice:Number($('totalPrice').value||0),deposit:Number($('deposit').value||0),paymentStatus:$('paymentStatus').value,note:$('note').value.trim(),createdAt:serverTimestamp()};await addDoc(collection(db,'bookings'),data);await markRangeBooked(data.roomId,data.checkIn,data.checkOut);e.target.reset();$('guestCount').value=2;$('totalPrice').value=0;$('deposit').value=0;toast('บันทึกการจองแล้ว');};}

async function markRangeBooked(roomId,start,end){const s=new Date(start),e=new Date(end);for(let d=new Date(s);d<e;d.setDate(d.getDate()+1)){await setDoc(doc(db,'roomDays',`${roomId}_${keyOf(d)}`),{roomId,date:keyOf(d),status:'booked',updatedAt:serverTimestamp()});}}

function initTools(){document.querySelectorAll('.mode').forEach(btn=>btn.onclick=()=>{mode=btn.dataset.mode;document.querySelectorAll('.mode').forEach(b=>b.classList.remove('active'));btn.classList.add('active');});$('prevMonth').onclick=()=>{viewDate.setMonth(viewDate.getMonth()-1);renderCalendar();};$('nextMonth').onclick=()=>{viewDate.setMonth(viewDate.getMonth()+1);renderCalendar();};$('seedBtn').onclick=seedRooms;$('clearMonthBtn').onclick=clearSelectedMonth;}

async function seedRooms(){const batch=writeBatch(db);rooms.forEach(r=>batch.set(doc(db,'rooms',r.id),r));await batch.commit();toast('สร้างข้อมูลบ้าน 13 หลังแล้ว');}
async function clearSelectedMonth(){if(!confirm('ล้างสถานะเดือนนี้ของบ้านที่เลือกใช่ไหม?'))return;const y=viewDate.getFullYear(),m=viewDate.getMonth();const snap=await getDocs(collection(db,'roomDays'));const batch=writeBatch(db);snap.forEach(s=>{const v=s.data();if(v.roomId===selectedRoom.id){const [yy,mm]=v.date.split('-').map(Number);if(yy===y&&mm===m+1)batch.delete(s.ref);}});await batch.commit();toast('ล้างสถานะเดือนนี้แล้ว');}

initTabs();renderRooms();renderCalendar();initTools();initForm();listenRoomDays();listenBookings();
