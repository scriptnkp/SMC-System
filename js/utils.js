// ===== Utilities =====

function fmt(n, dec = 2) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  return parseFloat(n).toLocaleString('th-TH', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function thaiDate(dateStr) {
  if (!dateStr) return '';
  const M = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
             'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d) ? dateStr : `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()+543}`;
}

function calcDuration(s, e) {
  if (!s || !e) return '-';
  const [sh,sm] = s.split(':').map(Number), [eh,em] = e.split(':').map(Number);
  const d = (eh*60+em)-(sh*60+sm);
  if (d <= 0) return '-';
  return `${Math.floor(d/60)}:${String(d%60).padStart(2,'0')}`;
}

function showToast(msg, type = 'info') {
  const ic = { success:'ti-check', warning:'ti-alert-triangle', error:'ti-x', info:'ti-info-circle' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="ti ${ic[type]||'ti-info-circle'}"></i> ${msg}`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3600);
}

function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
function getVal(id)     { const e = document.getElementById(id); return e ? e.value : ''; }
function setVal(id, v)  { const e = document.getElementById(id); if (e) e.value = v ?? ''; }

function bahtText(amount) {
  const ones = ['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const teens = ['สิบ','สิบเอ็ด','สิบสอง','สิบสาม','สิบสี่','สิบห้า','สิบหก','สิบเจ็ด','สิบแปด','สิบเก้า'];
  const tens  = ['','สิบ','ยี่สิบ','สามสิบ','สี่สิบ','ห้าสิบ','หกสิบ','เจ็ดสิบ','แปดสิบ','เก้าสิบ'];
  if (!amount || amount === 0) return 'ศูนย์บาทถ้วน';
  const [iS,dS='00'] = amount.toFixed(2).split('.');
  const sat = parseInt(dS), baht = parseInt(iS);
  function grp(n) {
    if (!n) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n-10];
    return tens[Math.floor(n/10)] + (n%10 ? ones[n%10] : '');
  }
  function cvt(n) {
    if (!n) return '';
    const M=Math.floor(n/1000000), r=n%1000000, TT=Math.floor(r/10000), T=Math.floor((r%10000)/1000), sm=r%1000;
    let res = '';
    if (M)  res += grp(M)+'ล้าน';
    if (TT) res += grp(TT)+'หมื่น';
    if (T)  res += ones[T]+'พัน';
    if (sm>=100) res += ones[Math.floor(sm/100)]+'ร้อย';
    const sub=sm%100; if (sub>0) res += grp(sub);
    return res;
  }
  return cvt(baht)+'บาท'+(sat>0 ? grp(sat)+'สตางค์' : 'ถ้วน');
}

// ── LOGO ──────────────────────────────
const LOGO_KEY = 'pea_logo';

function getLogoBase64() { return localStorage.getItem(LOGO_KEY); }
function setLogoBase64(v) { v ? localStorage.setItem(LOGO_KEY,v) : localStorage.removeItem(LOGO_KEY); }

function docLogoTag(size = 52) {
  const logo = getLogoBase64();
  if (logo) return `<img src="${logo}" style="width:${size}px;height:${size}px;object-fit:contain;border-radius:4px">`;
  return `<div style="width:${size}px;height:${size}px;border:2px solid #1a3a6b;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#1a3a6b">กฟภ.</div>`;
}

function applyLogoEverywhere(src) {
  if (!src) return;
  // sidebar
  ['sidebar-logo-img','login-logo-img','logo-preview-img'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.src = src; el.style.display = 'block'; }
  });
  ['sidebar-logo-default','logo-placeholder'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
}

function applyLogoFromDB(url) {
  if (!url) { const c = getLogoBase64(); if (c) applyLogoEverywhere(c); return; }
  fetch(url).then(r=>r.blob()).then(b=>{
    const rd = new FileReader();
    rd.onload = e => { setLogoBase64(e.target.result); applyLogoEverywhere(e.target.result); };
    rd.readAsDataURL(b);
  }).catch(() => applyLogoEverywhere(url));
}

function applySettingsToForm(s) {
  setVal('s-office',        s.office);
  setVal('s-address',       s.address);
  setVal('s-manager',       s.manager);
  setVal('s-phone',         s.phone);
  setVal('s-doc-prefix',    s.doc_prefix);
  setVal('s-dept',          s.dept);
  setVal('s-book-no',       s.book_no);
  setVal('s-switch-cost',   s.switch_cost);
  setVal('s-service-30min', s.service_30min);
}

// ── Avatar initial ─────────────────────
function nameInitial(name) {
  if (!name) return '?';
  const w = name.trim().split(' ');
  return w.length > 1 ? (w[0][0]||'')+(w[1][0]||'') : name.slice(0,2);
}
