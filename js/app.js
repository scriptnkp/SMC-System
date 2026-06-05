// ===== PEA App - Main Application Logic =====

let currentPage = 'dashboard';
let editingJobId = null;
let br1MaterialRows = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('topbar-title').textContent = 'กำลังโหลดข้อมูลจากฐานข้อมูล...';
  
  await Promise.all([
    loadMaterials(),
    initDatabase() 
  ]);
  
  navigateTo('dashboard');
  setTodayDate();
  loadSettings();
  
  const s = getSettings();
  if(s.logoUrl) {
    const imgEl = document.getElementById('logo-preview-img');
    imgEl.src = s.logoUrl;
    imgEl.style.display = 'block';
  }
});

// ===== NAVIGATION =====
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const pageEl = document.getElementById('page-' + page);
  const navEl = document.querySelector(`[data-page="${page}"]`);
  
  if (pageEl) pageEl.classList.add('active');
  if (navEl) navEl.classList.add('active');
  
  currentPage = page;
  
  document.getElementById('topbar-title').textContent = {
    dashboard: 'แดชบอร์ดสรุปงาน',
    br1: 'กรอกใบ บร.1',
    history: 'ประวัติการแจ้งซ่อม',
    settings: 'ตั้งค่าระบบ'
  }[page] || page;

  if (page === 'dashboard') renderDashboard();
  if (page === 'history') renderHistory();
}

// ===== SETTINGS =====
function loadSettings() {
  const s = getSettings();
  document.getElementById('s-office').value = s.office || 'กฟจ.นครพนม';
  document.getElementById('s-address').value = s.address || '3 ถนนอรัญญิกาวาส ต.ในเมือง อำเภอเมือง จังหวัดนครพนม 48000';
  document.getElementById('s-manager').value = s.manager || 'นายทวี สราญรมย์';
  document.getElementById('s-phone').value = s.phone || '042-516199';
  document.getElementById('s-doc-prefix').value = s.docPrefix || 'มท 5306.46/นพ.-';
  document.getElementById('s-dept').value = s.dept || 'แผนกปฏิบัติการและบำรุงรักษาระบบไฟฟ้า';
  document.getElementById('s-book-no').value = s.bookNo || '7804';
  document.getElementById('s-switch-cost').value = s.switchCost !== undefined ? s.switchCost : 570;
  document.getElementById('s-service-30min').value = s.service30min !== undefined ? s.service30min : 285;
}

function saveSettingsForm() {
  const s = {
    office: document.getElementById('s-office').value,
    address: document.getElementById('s-address').value,
    manager: document.getElementById('s-manager').value,
    phone: document.getElementById('s-phone').value,
    docPrefix: document.getElementById('s-doc-prefix').value,
    dept: document.getElementById('s-dept').value,
    bookNo: document.getElementById('s-book-no').value,
    switchCost: parseFloat(document.getElementById('s-switch-cost').value) || 570,
    service30min: parseFloat(document.getElementById('s-service-30min').value) || 285,
  };
  saveSettings(s);
  showToast('บันทึกการตั้งค่าแล้ว', 'success');
}

// ===== BR1 FORM =====
function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  const el = document.getElementById('f-date');
  if (el) el.value = today;
}

function newBR1() {
  editingJobId = null;
  br1MaterialRows = [];
  document.getElementById('br1-form').reset();
  setTodayDate();
  renderMaterialTable();
  calcTotals();
  navigateTo('br1');
}

function editJobById(id) {
  const job = getJob(id);
  if (!job) return;
  editingJobId = id;
  br1MaterialRows = job.materials ? [...job.materials] : [];
  
  const f = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  f('f-date', job.date);
  f('f-service-date', job.serviceDate);
  f('f-time-start', job.timeStart);
  f('f-time-end', job.timeEnd);
  f('f-customer-name', job.customerName);
  f('f-customer-phone', job.customerPhone);
  f('f-meter-no', job.meterNo);
  f('f-br1-no', job.br1No);
  f('f-book-no', job.bookNo);
  f('f-technician', job.technician);
  f('f-workers', job.workers);
  f('f-work-type', job.workType || 'high');
  f('f-estimator', job.estimator);
  f('f-address', job.address);
  
  renderMaterialTable();
  calcTotals();
  navigateTo('br1');
}

// ===== MATERIAL TABLE =====
function renderMaterialTable() {
  const tbody = document.getElementById('material-tbody');
  tbody.innerHTML = '';
  
  br1MaterialRows.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center">${idx + 1}</td>
      <td><input type="text" class="input-readonly" value="${row.code}" readonly style="width:110px;font-size:12px"></td>
      <td>${row.name}</td>
      <td class="text-center">${row.unit || 'EA'}</td>
      <td class="text-right"><input type="number" class="qty-input" value="${row.qty}" min="1" onchange="updateRowQty(${idx}, this.value)"></td>
      <td class="text-right">${fmt(row.basePrice)}</td>
      <td class="text-right"><strong>${fmt(row.userPrice)}</strong></td>
      <td class="text-center">
        <button class="btn-icon" onclick="removeMatRow(${idx})" title="ลบ"><i class="ti ti-trash"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });
  calcTotals();
}

function updateRowQty(idx, val) {
  br1MaterialRows[idx].qty = parseInt(val) || 1;
  br1MaterialRows[idx].userPrice = calcUserPrice(br1MaterialRows[idx].basePrice) * br1MaterialRows[idx].qty;
  calcTotals();
}

function removeMatRow(idx) {
  br1MaterialRows.splice(idx, 1);
  renderMaterialTable();
}

function addMaterialRow(mat) {
  const existing = br1MaterialRows.findIndex(r => r.code === mat.code);
  if (existing >= 0) {
    br1MaterialRows[existing].qty += 1;
    br1MaterialRows[existing].userPrice = calcUserPrice(br1MaterialRows[existing].basePrice) * br1MaterialRows[existing].qty;
  } else {
    br1MaterialRows.push({
      code: mat.code,
      name: mat.name,
      unit: mat.unit,
      basePrice: mat.basePrice,
      qty: 1,
      userPrice: calcUserPrice(mat.basePrice)
    });
  }
  renderMaterialTable();
  document.getElementById('mat-search').value = '';
  document.getElementById('mat-dropdown').innerHTML = '';
  document.getElementById('mat-dropdown').style.display = 'none';
}

function onMatSearch(val) {
  const dd = document.getElementById('mat-dropdown');
  if (!val || val.length < 2) { dd.style.display = 'none'; return; }
  const results = searchMaterials(val);
  if (results.length === 0) { dd.style.display = 'none'; return; }
  dd.innerHTML = results.map(m => `
    <div class="material-option" onclick="addMaterialRow(${JSON.stringify(m).replace(/"/g, '&quot;')})">
      <div>${m.name}</div>
      <div class="code">${m.code} | ราคาฐาน: ${fmt(m.basePrice)} บ. | ผู้ใช้ไฟ (+40%): ${fmt(calcUserPrice(m.basePrice))} บ.</div>
    </div>`).join('');
  dd.style.display = 'block';
}

document.addEventListener('click', e => {
  if (!e.target.closest('#mat-search-wrap')) {
    const dd = document.getElementById('mat-dropdown');
    if (dd) { dd.style.display = 'none'; }
  }
});

// ===== CALCULATIONS =====
function calcTotals() {
  const s = getSettings();
  const switchCost = parseFloat(s.switchCost) || 570;
  const svc30 = parseFloat(s.service30min) || 285;

  const matTotal = br1MaterialRows.reduce((sum, r) => sum + (calcUserPrice(r.basePrice) * r.qty), 0);
  const serviceCost = svc30 * 2;
  const totalPreTax = switchCost + serviceCost + matTotal * 1.31; 
  const tax = totalPreTax * 0.07;
  const grandTotal = totalPreTax + tax;

  setText('calc-switch', fmt(switchCost));
  setText('calc-service', fmt(serviceCost));
  setText('calc-mat-total', fmt(matTotal));
  setText('calc-mat-with-handling', fmt(matTotal * 1.31));
  setText('calc-subtotal', fmt(switchCost + matTotal * 1.31));
  setText('calc-service-subtotal', fmt(serviceCost + matTotal * 1.31));
  setText('calc-pretax', fmt(totalPreTax - switchCost));
  setText('calc-tax', fmt((totalPreTax - switchCost) * 0.07));
  setText('calc-grand', fmt(grandTotal - switchCost * 1.07 + switchCost));
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ===== SAVE JOB =====
function saveCurrentJob() {
  const s = getSettings();
  const switchCost = parseFloat(s.switchCost) || 570;
  const svc30 = parseFloat(s.service30min) || 285;

  const job = {
    id: editingJobId || generateId(),
    date: val('f-date'),
    serviceDate: val('f-service-date'),
    timeStart: val('f-time-start'),
    timeEnd: val('f-time-end'),
    customerName: val('f-customer-name'),
    customerPhone: val('f-customer-phone'),
    meterNo: val('f-meter-no'),
    br1No: val('f-br1-no'),
    bookNo: val('f-book-no') || s.bookNo,
    technician: val('f-technician'),
    workers: val('f-workers') || '1',
    workType: val('f-work-type'),
    estimator: val('f-estimator'),
    address: val('f-address'),
    materials: br1MaterialRows,
    switchCost,
    serviceCost: svc30 * 2,
    svc30,
    status: 'active',
    savedAt: new Date().toISOString()
  };

  const matUserTotal = br1MaterialRows.reduce((sum, r) => sum + calcUserPrice(r.basePrice) * r.qty, 0);
  job.matUserTotal = Math.round(matUserTotal * 100) / 100;
  job.matWithHandling = Math.round(matUserTotal * 1.31 * 100) / 100;
  job.subtotal2 = Math.round((svc30 * 2 + job.matWithHandling) * 100) / 100;
  job.tax = Math.round(job.subtotal2 * 0.07 * 100) / 100;
  job.grandTotal = Math.round((switchCost + job.subtotal2 + job.tax) * 100) / 100;

  if (!job.date || !job.meterNo) {
    showToast('กรุณากรอก วันที่ และ หมายเลขมิเตอร์', 'warning');
    return;
  }

  saveJob(job);
  editingJobId = job.id;
  showToast(editingJobId ? 'บันทึกใบงานเรียบร้อย' : 'สร้างใบงานใหม่เรียบร้อย', 'success');
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

// ===== PREVIEW PDF =====
function previewBR1() {
  saveCurrentJob();
  const job = editingJobId ? getJob(editingJobId) : buildTempJob();
  if (!job) return;
  document.getElementById('pdf-frame').innerHTML = generateBR1HTML(job);
  document.getElementById('pdf-preview-overlay').classList.add('show');
}

function previewMT1() {
  saveCurrentJob();
  const job = editingJobId ? getJob(editingJobId) : buildTempJob();
  if (!job) return;
  document.getElementById('pdf-frame').innerHTML = generateMT1HTML(job);
  document.getElementById('pdf-preview-overlay').classList.add('show');
}

function closePdfPreview() {
  document.getElementById('pdf-preview-overlay').classList.remove('show');
}

function printDoc() {
  const content = document.getElementById('pdf-frame').innerHTML;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Sarabun', sans-serif; font-size: 13px; color: #111; line-height: 1.7; margin: 32px 48px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #888; padding: 4px 6px; }
      th { background: #e0e0e0; }
      @media print { body { margin: 20px; } }
    </style>
  </head><body>${content}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ===== BR1 HTML GENERATOR =====
function generateBR1HTML(job) {
  const s = getSettings();
  const switchCost = job.switchCost || 570;
  const svc30 = job.svc30 || 285;
  const serviceCost = svc30 * 2;
  const matRows = job.materials || [];
  const matUserTotal = matRows.reduce((sum, r) => sum + calcUserPrice(r.basePrice) * r.qty, 0);
  const matWithHandling = matUserTotal * 1.31;
  const subtotal2 = serviceCost + matWithHandling;
  const tax = subtotal2 * 0.07;
  const grandTotal = switchCost + subtotal2 + tax;

  const matTableRows = matRows.map((r, i) => `
    <tr>
      <td>${i+1}</td>
      <td>${r.code}</td>
      <td style="text-align:left">${r.name}</td>
      <td>${r.qty}</td>
      <td style="text-align:right">${fmt(r.basePrice)}</td>
      <td style="text-align:right"><strong>${fmt(calcUserPrice(r.basePrice) * r.qty)}</strong></td>
      <td></td>
    </tr>`).join('');

  const workTypeHigh = job.workType !== 'low';
  const workTypeLow = job.workType === 'low' || job.workType === 'both';

  const logoHtml = s.logoUrl 
    ? `<img src="${s.logoUrl}" style="width:48px;height:48px;object-fit:contain;flex-shrink:0;">` 
    : `<div style="width:48px;height:48px;border:2px solid #1a3a6b;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#1a3a6b;flex-shrink:0">กฟภ.</div>`;

  return `
<div style="line-height:1.7;font-size:13px;color:#111">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
    <div style="display:flex;align-items:center;gap:10px">
      ${logoHtml}
    </div>
    <div style="text-align:center;flex:1;font-size:18px;font-weight:700;color:#1a3a6b">การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม</div>
    <div style="text-align:right;font-size:12px;line-height:2">
      <div><b>เลขที่ใบสั่งซ่อม :</b> ${job.br1No || '-'}</div>
      <div>กฟฟ. : ${s.office || 'กฟจ.นครพนม'}</div>
      <div>เจ้าหน้าที่ผู้ประมาณการ : ${job.estimator || job.technician || '-'}</div>
      <div>วันที่ : ${thaiDate(job.date)}</div>
    </div>
  </div>

  <div style="text-align:center;font-size:14px;font-weight:700;border:2px solid #111;padding:5px 12px;margin:8px 0">
    ใบประมาณการค่าใช้จ่ายบริการแก้ไขไฟฟ้าขัดข้อง (บร.1)
  </div>

  <div style="font-size:13px;font-weight:700;margin-bottom:6px">ผู้รับบริการ</div>

  <div style="font-size:12.5px;display:flex;gap:8px;padding:2px 0;border-bottom:1px dotted #ccc">
    <span style="min-width:200px;color:#555">1.) ชื่อลูกค้า / สถานที่ผู้ใช้ไฟ :</span>
    <span style="border-bottom:1px solid #666;flex:1;padding:0 4px">${job.customerName || ''}</span>
    <span>โทร</span>
    <span style="border-bottom:1px solid #666;min-width:120px;padding:0 4px">${job.customerPhone || ''}</span>
  </div>
  <div style="font-size:12.5px;display:flex;gap:8px;padding:2px 0;border-bottom:1px dotted #ccc">
    <span style="color:#555;min-width:200px">2.) หมายเลขมิเตอร์ PEA. / NO :</span>
    <span style="border-bottom:1px solid #666;flex:1;padding:0 4px">${job.meterNo || ''}</span>
  </div>
  <div style="font-size:12px;display:flex;gap:6px;flex-wrap:wrap;padding:2px 0;border-bottom:1px dotted #ccc">
    <span>- ใบ บร.1 / เล่มที่</span>
    <span style="border-bottom:1px solid #666;min-width:50px;padding:0 4px">${job.bookNo || s.bookNo || ''}</span>
    <span>เลขที่ :</span>
    <span style="border-bottom:1px solid #666;min-width:60px;padding:0 4px">${job.br1No || ''}</span>
    <span>ให้บริการเมื่อวันที่</span>
    <span style="border-bottom:1px solid #666;min-width:120px;padding:0 4px">${thaiDate(job.serviceDate || job.date)}</span>
  </div>
  <div style="font-size:12px;display:flex;gap:6px;flex-wrap:wrap;padding:2px 0;border-bottom:1px dotted #ccc">
    <span>- ตั้งแต่เวลา :</span>
    <span style="border-bottom:1px solid #666;min-width:50px;padding:0 4px">${job.timeStart || ''}</span>
    <span>น. ถึงเวลา :</span>
    <span style="border-bottom:1px solid #666;min-width:50px;padding:0 4px">${job.timeEnd || ''}</span>
    <span>น. รวมเวลาปฏิบัติงาน</span>
    <span style="border-bottom:1px solid #666;min-width:40px;padding:0 4px">${calcDuration(job.timeStart, job.timeEnd)}</span>
    <span>ชั่วโมง</span>
  </div>
  <div style="font-size:12px;display:flex;gap:6px;flex-wrap:wrap;padding:2px 0;border-bottom:1px dotted #ccc">
    <span>3.) พชง./ผู้ให้บริการ (ชื่อ - สกุล) :</span>
    <span style="border-bottom:1px solid #666;min-width:150px;padding:0 4px">${job.technician || ''}</span>
    <span>รวมผู้ปฏิบัติงาน จำนวน</span>
    <span style="border-bottom:1px solid #666;min-width:30px;padding:0 4px;text-align:center">${job.workers || '1'}</span>
    <span>คน</span>
  </div>

  <div style="font-size:13px;font-weight:700;margin:10px 0 6px">รายการปฏิบัติงาน</div>
  <div style="border:1px solid #888;padding:10px 14px;border-radius:2px;margin:8px 0">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px">
      <b style="font-size:13px">ข้อ ก. งานตรวจสอบและแก้ไขไฟฟ้าขัดข้อง :</b>
      <span style="font-size:12.5px">${workTypeHigh ? '☑' : '☐'} ด้านแรงสูง</span>
      <span style="font-size:12.5px">${workTypeLow ? '☑' : '☐'} ด้านแรงต่ำ</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin:3px 0;font-size:12.5px">
      <span>1.ค่าปลด - สับอุปกรณ์ตัดตอน</span>
      <span>เป็นเงิน <u>${fmt(switchCost)}</u> บาท</span>
    </div>
    <div style="font-size:12.5px;font-weight:600;margin:4px 0 2px">2.ค่าบริการแก้ไขไฟฟ้าขัดข้อง แรงสูง/แรงต่ำ</div>
    <div style="display:flex;justify-content:space-between;padding-left:16px;font-size:12px">
      <span>- สำหรับ 30 นาทีแรก ${fmt(svc30)} บาท</span>
      <span>เป็นเงิน <u>${fmt(svc30)}</u> บาท</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding-left:16px;font-size:12px;margin-bottom:4px">
      <span>- สำหรับครึ่งชั่วโมงต่อไป</span>
      <span>เป็นเงิน <u>${fmt(svc30)}</u> บาท</span>
    </div>
    <div style="display:flex;justify-content:space-between;border-top:1.5px solid #333;padding-top:4px;font-weight:700;font-size:13px">
      <span>รวมเป็นเงิน</span>
      <span><u>${fmt(switchCost + serviceCost)}</u> บาท</span>
    </div>
  </div>

  <div style="font-size:13px;font-weight:700;margin:8px 0 4px">รายการพัสดุ</div>
  <div style="font-size:12.5px;font-weight:600;margin-bottom:4px">ข้อ ข. อุปกรณ์ที่ กฟภ. นำมาใช้ในการแก้ไขกระแสไฟฟ้าขัดข้องให้ ( ลูกค้า / ผู้ใช้ไฟ )</div>
  <div style="font-size:11.5px;color:#555;margin-bottom:6px">( 1.) ทำราคาพัสดุ กฟภ. ให้เป็นราคาผู้ใช้ไฟ (บวก 15%) &nbsp;&nbsp; ( 2.) ค่าดำเนินการบวก 31%</div>

  <table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0">
    <thead>
      <tr>
        <th style="background:#e0e0e0;border:1px solid #888;padding:5px;text-align:center;width:30px">ที่</th>
        <th style="background:#e0e0e0;border:1px solid #888;padding:5px;width:110px">รหัส</th>
        <th style="background:#e0e0e0;border:1px solid #888;padding:5px">รายการ</th>
        <th style="background:#e0e0e0;border:1px solid #888;padding:5px;width:50px">จำนวน</th>
        <th style="background:#e0e0e0;border:1px solid #888;padding:5px;width:80px">ราคามาตราฐาน</th>
        <th style="background:#e0e0e0;border:1px solid #888;padding:5px;width:90px">ราคาผู้ใช้ไฟ / (บาท)<br>ราคา+40%</th>
        <th style="background:#e0e0e0;border:1px solid #888;padding:5px;width:60px">หมายเหตุ</th>
      </tr>
    </thead>
    <tbody>
      ${matTableRows || '<tr><td colspan="7" style="border:1px solid #888;text-align:center;color:#999;padding:8px">- ไม่มีรายการพัสดุ -</td></tr>'}
      <tr>
        <td colspan="5" style="border:1px solid #888;text-align:right;padding:4px 6px;font-weight:700">รวม</td>
        <td style="border:1px solid #888;text-align:right;padding:4px 6px;font-weight:700">${fmt(matUserTotal)}</td>
        <td style="border:1px solid #888"></td>
      </tr>
    </tbody>
  </table>

  <div style="border:1px solid #888;padding:8px 12px;margin:8px 0;border-radius:2px">
    <div style="font-size:12px;font-weight:700;margin-bottom:6px">หมายเหตุ :</div>
    <div style="display:flex;font-size:12.5px;padding:2px 0;align-items:baseline">
      <span style="flex:1;padding-left:20px;font-size:12px">1.) ค่าปลด-สับอุปกรณ์ตัดตอน</span>
      <span style="font-size:11px;color:#666;width:65px">S-3Z-333</span>
      <span>เป็นเงิน</span>
      <span style="width:80px;text-align:right;border-bottom:1px solid #666;padding:0 4px">${fmt(switchCost)}</span>
      <span style="margin-left:4px;font-size:12px">บาท</span>
      <span style="font-size:11px;color:#666;margin-left:8px">(SAP)</span>
    </div>
    <div style="display:flex;font-size:12.5px;padding:2px 0;align-items:baseline">
      <span style="flex:1;padding-left:20px;font-size:12px">2.) ค่าตรวจสอบและแก้ไข + ค่าพัสดุอุปกรณ์</span>
      <span style="font-size:11px;color:#666;width:65px">S-3Z-444</span>
      <span>เป็นเงิน</span>
      <span style="width:80px;text-align:right;border-bottom:1px solid #666;padding:0 4px">${fmt(subtotal2)}</span>
      <span style="margin-left:4px;font-size:12px">บาท</span>
      <span style="font-size:11px;color:#666;margin-left:8px">(พิมพ์)</span>
    </div>
    <div style="display:flex;font-size:12.5px;padding:2px 0;align-items:baseline">
      <span style="flex:1;padding-left:40px;font-size:12px">- รวมเป็นเงิน (ข้อ 1.+2. )</span>
      <span style="font-size:11px;color:#666;width:65px"></span>
      <span>เป็นเงิน</span>
      <span style="width:80px;text-align:right;border-bottom:1px solid #666;padding:0 4px">${fmt(switchCost + subtotal2)}</span>
      <span style="margin-left:4px;font-size:12px">บาท</span>
    </div>
    <div style="display:flex;font-size:12.5px;padding:2px 0;align-items:baseline">
      <span style="flex:1;padding-left:40px;font-size:12px">- รวมภาษี 7 %</span>
      <span style="font-size:11px;color:#666;width:65px"></span>
      <span>เป็นเงิน</span>
      <span style="width:80px;text-align:right;border-bottom:1px solid #666;padding:0 4px">${fmt(tax)}</span>
      <span style="margin-left:4px;font-size:12px">บาท</span>
    </div>
    <div style="display:flex;font-size:13px;padding:4px 0 2px;align-items:baseline;border-top:1px solid #aaa;margin-top:4px;font-weight:700">
      <span style="flex:1;padding-left:40px">- สรุป (ข้อ 1.+2. ) รวมค่าใช้จ่ายทั้งหมด</span>
      <span style="width:65px"></span>
      <span>เป็นเงิน</span>
      <span style="width:80px;text-align:right;border-bottom:2px double #111;padding:0 4px">${fmt(grandTotal)}</span>
      <span style="margin-left:4px;font-size:12px">บาท</span>
    </div>
  </div>

  <div style="display:flex;justify-content:flex-end;gap:12px;font-weight:700;font-size:14px;padding:6px 0;border-top:2px solid #111;border-bottom:2px solid #111;margin:8px 0 4px">
    <span>รวมเป็นเงินทั้งสิ้น :</span>
    <span>${fmt(grandTotal)} บาท</span>
  </div>
  <div style="text-align:center;margin:4px 0 16px;font-size:13px">( ${bahtText(grandTotal)} )</div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px">
    <div style="text-align:center;font-size:12px">
      <div style="border-bottom:1px solid #666;margin:32px 16px 4px"></div>
      <div>(ลงชื่อ)...............................................ผู้ประมาณการ</div>
      <div style="margin-top:4px">(${job.estimator || '...................................'})</div>
      <div style="margin-top:4px;font-size:11.5px;color:#666">............/............/............</div>
    </div>
    <div style="text-align:center;font-size:12px">
      <div style="border-bottom:1px solid #666;margin:32px 16px 4px"></div>
      <div>(ลงชื่อ)...............................................ผู้ตรวจ</div>
      <div style="margin-top:4px">(...............................................)</div>
      <div style="margin-top:4px;font-size:11.5px;color:#666">............/............/............</div>
    </div>
  </div>
</div>`;
}

// ===== MT1 HTML GENERATOR =====
function generateMT1HTML(job) {
  const s = getSettings();
  const switchCost = job.switchCost || 570;
  const svc30 = job.svc30 || 285;
  const matRows = job.materials || [];
  const matUserTotal = matRows.reduce((sum, r) => sum + calcUserPrice(r.basePrice) * r.qty, 0);
  const matWithHandling = matUserTotal * 1.31;
  const subtotal2 = (svc30 * 2) + matWithHandling;
  const tax = subtotal2 * 0.07;
  const grandTotal = switchCost + subtotal2 + tax;

  const logoHtml = s.logoUrl 
    ? `<img src="${s.logoUrl}" style="width:52px;height:52px;object-fit:contain;flex-shrink:0;">` 
    : `<div style="width:52px;height:52px;border:2px solid #5a2d82;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#5a2d82;flex-shrink:0">กฟภ.</div>`;

  return `
<div style="line-height:2;font-size:13.5px;color:#111">
  <div style="display:flex;align-items:flex-start;margin-bottom:16px">
    <div style="display:flex;align-items:center;gap:10px;min-width:180px">
      ${logoHtml}
      <div>
        <div style="font-size:15px;font-weight:700;color:#5a2d82">การไฟฟ้าส่วนภูมิภาค</div>
        <div style="font-size:9px;letter-spacing:0.5px;color:#5a2d82">PROVINCIAL ELECTRICITY AUTHORITY</div>
      </div>
    </div>
    <div style="flex:1;text-align:right;font-size:13.5px;line-height:2">
      ${s.office || 'การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม'}<br>
      ${s.address || '3 ถนนอรัญญิกาวาส ต.ในเมือง อำเภอเมือง จังหวัดนครพนม 48000'}
    </div>
  </div>

  <div style="font-size:13.5px;margin-bottom:4px">ที่ ${s.docPrefix || 'มท 5306.46/นพ.-'}</div>
  <div style="text-align:center;margin:16px 0 14px;font-size:13.5px">${thaiDate(job.date)}</div>

  <div style="display:flex;gap:16px;margin-bottom:4px">
    <span style="min-width:50px;font-weight:500">เรื่อง</span>
    <span>แจ้งค่าบริการแก้กระแสไฟฟ้าขัดข้อง</span>
  </div>
  <div style="display:flex;gap:16px;margin-bottom:20px">
    <span style="min-width:50px;font-weight:500">เรียน</span>
    <span style="border-bottom:1px solid #555;flex:1;min-width:200px;padding:0 4px">${job.customerName || ''}</span>
  </div>

  <div style="text-indent:48px;font-size:13.5px">
    ด้วยในวันที่ <strong>${thaiDate(job.serviceDate || job.date)}</strong> เวลา <strong>${job.timeStart || '...'} น.</strong> ถึงเวลา <strong>${job.timeEnd || '...'} น.</strong>
    การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม ได้บริการแก้กระแสไฟฟ้าขัดข้องให้แก่
    หมายเลขผู้ใช้ไฟ <span style="border-bottom:1px solid #555;padding:0 4px">${job.meterNo || ''}</span>
    พร้อมออกหลักฐาน ใบบริการแก้ไขกระแสไฟฟ้าขัดข้อง ใบ บร.1
    เล่มที่ <span style="border-bottom:1px solid #555;padding:0 4px">${job.bookNo || s.bookNo || ''}</span>
    เลขที่ <span style="border-bottom:1px solid #555;padding:0 4px">${job.br1No || ''}</span>
    เพื่อเรียกเก็บค่าใช้จ่ายในภายหลังนั้น บัดนี้ การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม
    ได้ตรวจสอบประมาณการแล้วมีค่าใช้จ่าย ดังนี้
  </div>

  <table style="width:100%;margin:10px 0;font-size:13.5px;border:none">
    <tr>
      <td style="padding-left:40px;padding:3px 0">1.) ค่าปลด-สับอุปกรณ์ตัดตอน</td>
      <td style="text-align:center;width:80px">เป็นเงิน</td>
      <td style="text-align:right;width:120px;padding-right:8px">${fmt(switchCost)} บาท</td>
    </tr>
    <tr>
      <td style="padding:3px 0">2.) ค่าตรวจสอบและแก้ไข + ค่าพัสดุอุปกรณ์</td>
      <td style="text-align:center">เป็นเงิน</td>
      <td style="text-align:right;padding-right:8px">${fmt(subtotal2)} บาท</td>
    </tr>
    <tr>
      <td style="padding-left:40px;padding:3px 0">-รวมเป็นเงิน (ข้อ 1.+2. )</td>
      <td style="text-align:center">เป็นเงิน</td>
      <td style="text-align:right;padding-right:8px">${fmt(switchCost + subtotal2)} บาท</td>
    </tr>
    <tr>
      <td style="padding-left:40px;padding:3px 0">-ภาษี 7 %</td>
      <td style="text-align:center">เป็นเงิน</td>
      <td style="text-align:right;padding-right:8px">${fmt(tax)} บาท</td>
    </tr>
    <tr style="border-top:1.5px solid #333;font-weight:700;font-size:14px">
      <td style="padding-left:40px;padding:6px 0">-สรุป (ข้อ 1.+2. ) รวมค่าใช้จ่ายทั้งหมด</td>
      <td style="text-align:center">รวมเป็นเงิน</td>
      <td style="text-align:right;padding-right:8px">${fmt(grandTotal)} บาท</td>
    </tr>
  </table>

  <div style="text-align:center;font-size:13.5px;margin:4px 0 12px">( ${bahtText(grandTotal)} )</div>

  <div style="font-size:13.5px;margin:12px 0 6px">จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป จักขอบคุณยิ่ง</div>
  <div style="text-align:center;margin-top:10px">ขอแสดงความนับถือ</div>

  <div style="text-align:center;margin:44px 0 16px;font-size:13.5px">
    <div style="font-weight:600">${s.manager || 'นายทวี สราญรมย์'}</div>
    <div>ผู้จัดการ</div>
    <div>${s.office || 'การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม'}</div>
  </div>

  <div style="margin-top:24px;padding-top:10px;border-top:1px solid #ccc;font-size:12px;color:#555;line-height:1.7">
    ${s.dept || 'แผนกปฏิบัติการและบำรุงรักษาระบบไฟฟ้า การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม'}<br>
    โทร. ${s.phone || '042-516199'}
  </div>
</div>`;
}

// ===== HISTORY =====
function renderHistory() {
  const jobs = getJobs();
  const search = document.getElementById('h-search')?.value?.toLowerCase() || '';
  const filterTech = document.getElementById('h-tech')?.value?.toLowerCase() || '';
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;

  const filtered = jobs.filter(j => {
    const matchSearch = !search || 
      (j.meterNo || '').toLowerCase().includes(search) ||
      (j.customerName || '').toLowerCase().includes(search) ||
      (j.br1No || '').toLowerCase().includes(search);
    const matchTech = !filterTech || (j.technician || '').toLowerCase().includes(filterTech);
    return matchSearch && matchTech;
  });

  tbody.innerHTML = filtered.length === 0
    ? '<tr><td colspan="9" style="text-align:center;padding:20px;color:#aaa">ไม่มีข้อมูล</td></tr>'
    : filtered.map(j => `
      <tr>
        <td>${thaiDate(j.date)}</td>
        <td>${j.br1No || '-'}</td>
        <td>${j.meterNo || '-'}</td>
        <td>${j.customerName || '-'}</td>
        <td>${j.technician || '-'}</td>
        <td class="text-right"><strong>${fmt(j.grandTotal)}</strong></td>
        <td class="text-center">${j.materials?.length || 0} รายการ</td>
        <td class="text-center"><span class="badge badge-success">เสร็จสิ้น</span></td>
        <td class="text-center" style="white-space:nowrap">
          <button class="btn-icon btn-sm" onclick="editJobById('${j.id}')" title="แก้ไข"><i class="ti ti-edit"></i></button>
          <button class="btn-icon btn-sm" style="margin-left:4px" onclick="viewJobPreview('${j.id}')" title="ดูเอกสาร"><i class="ti ti-file-text"></i></button>
          <button class="btn-icon btn-sm" style="margin-left:4px;color:#e74c3c" onclick="confirmDelete('${j.id}')" title="ลบ"><i class="ti ti-trash"></i></button>
        </td>
      </tr>`).join('');
}

function viewJobPreview(id) {
  const job = getJob(id);
  if (!job) return;
  document.getElementById('pdf-frame').innerHTML = generateBR1HTML(job);
  document.getElementById('pdf-preview-overlay').classList.add('show');
}

function confirmDelete(id) {
  if (confirm('ต้องการลบใบงานนี้ใช่ไหม?')) {
    deleteJob(id);
    renderHistory();
    showToast('ลบเรียบร้อยแล้ว', 'success');
  }
}

function filterHistory() {
  renderHistory();
}

// ===== DASHBOARD =====
function renderDashboard() {
  const jobs = getJobs();
  const now = new Date();
  const thisMonth = jobs.filter(j => {
    const d = new Date(j.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  setText('dash-total-jobs', jobs.length);
  setText('dash-month-jobs', thisMonth.length);
  setText('dash-month-revenue', fmt(thisMonth.reduce((s, j) => s + (j.grandTotal || 0), 0), 0));
  setText('dash-total-revenue', fmt(jobs.reduce((s, j) => s + (j.grandTotal || 0), 0), 0));

  const techMap = {};
  jobs.forEach(j => {
    const t = j.technician || 'ไม่ระบุ';
    if (!techMap[t]) techMap[t] = { count: 0, revenue: 0 };
    techMap[t].count++;
    techMap[t].revenue += j.grandTotal || 0;
  });

  const techRows = Object.entries(techMap)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, data], i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${name}</td>
        <td class="text-center"><strong>${data.count}</strong></td>
        <td class="text-right">${fmt(data.revenue, 0)}</td>
        <td class="text-right">${data.count > 0 ? fmt(data.revenue / data.count, 0) : '-'}</td>
      </tr>`).join('');

  document.getElementById('tech-tbody').innerHTML = techRows ||
    '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px">ยังไม่มีข้อมูล</td></tr>';

  const recentRows = jobs.slice(0, 8).map(j => `
    <tr>
      <td>${thaiDate(j.date)}</td>
      <td>${j.br1No || '-'}</td>
      <td>${j.meterNo || '-'}</td>
      <td>${j.technician || '-'}</td>
      <td class="text-right">${fmt(j.grandTotal)}</td>
      <td class="text-center"><span class="badge badge-success">เสร็จสิ้น</span></td>
    </tr>`).join('');

  document.getElementById('recent-tbody').innerHTML = recentRows ||
    '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:16px">ยังไม่มีข้อมูล</td></tr>';
}

// ===== HELPERS =====
function calcDuration(start, end) {
  if (!start || !end) return '-';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return '-';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `0:${String(m).padStart(2, '0')}`;
}

function showToast(msg, type = 'info') {
  const icon = { success: 'ti-check', warning: 'ti-alert-triangle', error: 'ti-x', info: 'ti-info-circle' }[type] || 'ti-info-circle';
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="ti ${icon}"></i> ${msg}`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function switchPreviewDoc(type) {
  if (!editingJobId) return;
  const job = getJob(editingJobId);
  if (!job) return;
  document.getElementById('pdf-frame').innerHTML = type === 'mt1' ? generateMT1HTML(job) : generateBR1HTML(job);
}

// ===== LOGO UPLOAD =====
async function uploadLogoToGAS(input) {
  const file = input.files[0];
  if (!file) return;

  const statusEl = document.getElementById('logo-status');
  statusEl.textContent = '⏳ กำลังอัปโหลดโลโก้ขึ้น Google Drive...';
  statusEl.style.color = '#f39c12';

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64 = e.target.result;
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: 'uploadLogo',
          base64: base64,
          fileName: file.name
        })
      });
      const data = await res.json();
      
      if (data.success) {
        const s = getSettings();
        s.logoUrl = data.imageUrl; 
        await saveSettings(s);     

        statusEl.textContent = '✓ อัปโหลดสำเร็จ!';
        statusEl.style.color = '#27ae60';
        
        const imgEl = document.getElementById('logo-preview-img');
        imgEl.src = data.imageUrl;
        imgEl.style.display = 'block';
        showToast('อัปโหลดโลโก้หน่วยงานสำเร็จ', 'success');
      } else {
        statusEl.textContent = '✗ บันทึกไม่สำเร็จ: ' + data.error;
        statusEl.style.color = '#e74c3c';
      }
    } catch (err) {
      statusEl.textContent = '✗ ขัดข้อง: การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว';
      statusEl.style.color = '#e74c3c';
    }
  };
  reader.readAsDataURL(file);
}