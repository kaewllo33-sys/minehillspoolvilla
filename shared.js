export const rooms = ['บ้านพูลวิลล่า','Jacuzzi','รถบ้านครีม 1','รถบ้านครีม 2','View Hills 1','View Hills 2','White House','Muji House','รถบ้านมิ้น 1','รถบ้านมิ้น 2','รถบ้านเทา 3','รถบ้านเทา 4','บ้านโคซี่'];
export const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
export const dayNames = ['อา','จ','อ','พ','พฤ','ศ','ส'];
export const statusText = { free:'ว่าง', booked:'ไม่ว่าง', locked:'ปิด' };
export const safeRoomId = (name)=> name.replaceAll(' ','_').replaceAll('/','_');
