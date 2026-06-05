// ===== js/storage.js =====
// เชื่อมต่อ Google Apps Script API

// 🔴 Web App URL ของคุณ (อัปเดตล่าสุด)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxzaxiO9VErx1JeRK1RxFspKNYAKsljlyx5de4MPiAO72JP7GIh7Mr2QGJ5SzwWcABE/exec';

let localJobs = [];
let localSettings = {};

// ดึงข้อมูลทั้งหมดจาก Google Sheets เมื่อโหลดหน้าเว็บ
async function initDatabase() {
  try {
    const sRes = await fetch(`${GAS_URL}?action=getSettings`, { redirect: "follow" });
    const sData = await sRes.json();
    localSettings = sData || {};

    const jRes = await fetch(`${GAS_URL}?action=getJobs`, { redirect: "follow" });
    const jData = await jRes.json();
    // เรียงใบงานล่าสุดขึ้นก่อน
    localJobs = Array.isArray(jData) ? jData.reverse() : [];
  } catch (e) {
    console.error('Failed to load from GAS:', e);
    showToast('เชื่อมต่อฐานข้อมูลล้มเหลว กรุณารีเฟรชหน้าเว็บ', 'error');
  }
}

function getJobs() { return localJobs; }
function getJob(id) { return localJobs.find(j => j.id === id) || null; }
function getSettings() { return localSettings; }

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// เซฟใบงานลง State ภายในเครื่อง (เพื่อให้ UI ตอบสนองทันที) และส่งไป GAS (Background)
async function saveJob(job) {
  const idx = localJobs.findIndex(j => j.id === job.id);
  if (idx >= 0) {
    localJobs[idx] = job;
  } else {
    localJobs.unshift(job);
  }
  
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      redirect: "follow",
      // ใช้ text/plain เพื่อหลบเลี่ยง Preflight (CORS OPTIONS) ของเบราว์เซอร์
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: 'saveJob', data: job })
    });
  } catch(e) {
    console.error('GAS Save Job Error:', e);
    showToast('เกิดข้อผิดพลาดในการส่งข้อมูลไปเซิร์ฟเวอร์', 'error');
  }
}

// ลบใบงาน (อัปเดตสถานะใน Memory - หากต้องการลบใน Sheets ด้วยต้องเพิ่ม Endpoint ลบ)
function deleteJob(id) {
  localJobs = localJobs.filter(j => j.id !== id);
}

// บันทึกการตั้งค่าระบบและ URL ของโลโก้
async function saveSettings(s) {
  // รักษา URL ของ Logo เดิมไว้หากไม่ได้อัปเดตใหม่ในรอบนี้
  if(localSettings.logoUrl && !s.logoUrl) s.logoUrl = localSettings.logoUrl;
  
  localSettings = s;
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      redirect: "follow",
      // ใช้ text/plain เพื่อหลบเลี่ยง Preflight (CORS OPTIONS) ของเบราว์เซอร์
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: 'saveSettings', data: s })
    });
  } catch(e) {
    console.error('GAS Save Settings Error:', e);
  }
}

// ==========================================
// Helper functions
// ==========================================
function bahtText(amount) {
  const ones = ['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const teens = ['สิบ','สิบเอ็ด','สิบสอง','สิบสาม','สิบสี่','สิบห้า','สิบหก','สิบเจ็ด','สิบแปด','สิบเก้า'];
  const tens = ['','สิบ','ยี่สิบ','สามสิบ','สี่สิบ','ห้าสิบ','หกสิบ','เจ็ดสิบ','แปดสิบ','เก้าสิบ'];

  if (!amount || amount === 0) return 'ศูนย์บาทถ้วน';

  const [intPart, decPart] = parseFloat(amount).toFixed(2).split('.');
  const satang = parseInt(decPart);
  const baht = parseInt(intPart);

  function convertGroup(n) {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 ? ones[n % 10] : '');
  }

  function convertBig(n) {
    if (n === 0) return '';
    const million = Math.floor(n / 1000000);
    const remainder = n % 1000000;
    const thousands = Math.floor(remainder / 10000);
    const hundreds = Math.floor((remainder % 10000) / 1000);
    const small = remainder % 1000;

    let result = '';
    if (million > 0) result += convertGroup(million) + 'ล้าน';
    if (thousands > 0) result += convertGroup(thousands) + 'หมื่น';
    if (hundreds > 0) result += ones[hundreds] + 'พัน';
    const cent = small;
    if (cent >= 100) { result += ones[Math.floor(cent/100)] + 'ร้อย'; }
    const sub = cent % 100;
    if (sub > 0) { result += convertGroup(sub); }
    return result;
  }

  let text = convertBig(baht) + 'บาท';
  if (satang > 0) {
    text += convertGroup(satang) + 'สตางค์';
  } else {
    text += 'ถ้วน';
  }
  return text;
}

function fmt(n, dec = 2) {
  if (!n && n !== 0) return '-';
  return parseFloat(n).toLocaleString('th-TH', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function thaiDate(dateStr) {
  if (!dateStr) return '';
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}