// ===== PEA App v2.1 — Main Logic =====

let currentPage     = 'dashboard';
let editingJobId    = null;
let br1MatRows      = [];
let _previewJob     = null;
window._cachedSettings = {};

// ── ฟังก์ชันคำนวณบล็อกเวลา ───────────────────────
function getServiceCalc(start, end, s30) {
  if (!start || !end) return { sv: s30 * 2, blocks: 2 };
  const [sh,sm] = start.split(':').map(Number);
  const [eh,em] = end.split(':').map(Number);
  const m = (eh*60+em) - (sh*60+sm);
  
  if (isNaN(m) || m <= 0) return { sv: s30 * 2, blocks: 2 };
  
  if (m <= 30) return { sv: s30, blocks: 1 };
  
  const extraBlocks = Math.ceil((m - 30) / 30);
  return { sv: s30 + (extraBlocks * s30), blocks: 1 + extraBlocks };
}

// ── INIT ──────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  showLoginScreen();
  await loadMaterials();
  try {
    await initAuth();
  } catch(e) {
    console.error('Auth init failed:', e);
    document.getElementById('login-err').textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต';
  }
  setupHamburger();
});

// ── HAMBURGER (mobile) ────────────────
function setupHamburger() {
  document.getElementById('hamburger')?.addEventListener('click', openSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);
}
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

// ── AUTH ──────────────────────────────
function showLoginScreen() {
  document.getElementById('app-wrapper').classList.remove('show');
  document.getElementById('login-screen').classList.remove('hide');
  const err = document.getElementById('login-err');
  if (err) err.textContent = '';
  setVal('login-empid', '');
  resetPin();
}

function showApp() {
  document.getElementById('login-screen').classList.add('hide');
  document.getElementById('app-wrapper').classList.add('show');
  if (currentProfile) {
    setText('topbar-user', `${currentProfile.full_name} (${currentProfile.employee_id})`);
    setText('sidebar-user-name', currentProfile.full_name);
    setText('sidebar-user-role', currentProfile.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ช่าง');
    setText('sidebar-user-emp',  `รหัส ${currentProfile.employee_id}`);
    setText('user-avatar-text', nameInitial(currentProfile.full_name));
  }
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin() ? '' : 'none';
  });
  const logo = getLogoBase64();
  if (logo) applyLogoEverywhere(logo);
  setTodayDate();
  loadSettingsFromDB();
  navigateTo('dashboard');
}

// ── LOGIN ─────────────────────────────
function resetPin() {} 

async function handleLogin() {
  const empId = getVal('login-empid').trim();
  const err   = document.getElementById('login-err');
  if (!empId)           { err.textContent = 'กรุณากรอกรหัสพนักงาน'; return; }
  if (empId.length < 6) { err.textContent = 'รหัสพนักงาน 6-7 หลัก'; return; }

  const btn = document.getElementById('login-submit');
  btn.disabled = true; btn.textContent = 'กำลังเข้าสู่ระบบ...';
  err.textContent = '';

  try {
    await loginWithEmployeeId(empId);
  } catch(e) {
    err.textContent = 'รหัสพนักงานหรือ PIN ไม่ถูกต้อง';
    btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ';
    resetPin();
  }
}

async function handleLogout() {
  closeSidebar();
  await logout();
}

// ── NAVIGATION ────────────────────────
function navigateTo(page) {
  closeSidebar();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-'+page);
  const nv = document.querySelector(`[data-page="${page}"]`);
  if (pg) pg.classList.add('active');
  if (nv) nv.classList.add('active');
  currentPage = page;
  const titles = {
    dashboard: 'แดชบอร์ดสรุปงาน',
    br1:       'กรอกใบ บร.1',
    history:   'ประวัติการแจ้งซ่อม',
    settings:  'ตั้งค่าระบบ',
    users:     'จัดการผู้ใช้งาน',
  };
  setText('topbar-title', titles[page] || page);
  if (page === 'dashboard') renderDashboard();
  if (page === 'history')   renderHistory();
  if (page === 'users')     renderUsers();
}

// ── DATE ──────────────────────────────
function setTodayDate() {
  const t = new Date().toISOString().split('T')[0];
  setVal('f-date', t);
  setVal('f-service-date', t);
}

// ── SETTINGS ──────────────────────────
async function saveSettingsForm() {
  if (!isAdmin()) { showToast('เฉพาะ Admin เท่านั้น','warning'); return; }
  try {
    await saveSettingsToDB({
      office: getVal('s-office'), address: getVal('s-address'),
      manager: getVal('s-manager'), phone: getVal('s-phone'),
      doc_prefix: getVal('s-doc-prefix'), dept: getVal('s-dept'),
      book_no: getVal('s-book-no'),
      switch_cost:   parseFloat(getVal('s-switch-cost'))||570,
      service_30min: parseFloat(getVal('s-service-30min'))||285,
    });
    showToast('บันทึกการตั้งค่าแล้ว','success');
  } catch(e) { showToast('บันทึกไม่สำเร็จ: '+e.message,'error'); }
}

// ── LOGO ──────────────────────────────
async function uploadLogo(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2*1024*1024) { showToast('ไฟล์ใหญ่เกิน 2MB','warning'); return; }
  setText('logo-status','กำลังอัพโหลด...');
  try {
    const url = await uploadLogoToStorage(file);
    await saveSettingsToDB({ logo_url: url });
    const rd = new FileReader();
    rd.onload = e => { setLogoBase64(e.target.result); applyLogoEverywhere(e.target.result); };
    rd.readAsDataURL(file);
    setText('logo-status','✓ อัพโหลดสำเร็จ');
    showToast('บันทึกโลโก้แล้ว','success');
  } catch(e) {
    const rd = new FileReader();
    rd.onload = ev => { setLogoBase64(ev.target.result); applyLogoEverywhere(ev.target.result); };
    rd.readAsDataURL(file);
    setText('logo-status','✓ บันทึกเฉพาะเครื่องนี้');
    showToast('บันทึกโลโก้เฉพาะเครื่องนี้','warning');
  }
}

function removeLogo() {
  setLogoBase64(null);
  ['sidebar-logo-img','login-logo-img','logo-preview-img'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.src=''; el.style.display='none'; }
  });
  ['sidebar-logo-default','logo-placeholder'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display='';
  });
  setText('logo-status','');
  showToast('ลบโลโก้แล้ว','success');
}

// ── BR1 FORM ──────────────────────────
function newBR1() {
  editingJobId = null;
  br1MatRows = [];
  document.getElementById('br1-form').reset();
  setTodayDate();
  if (currentProfile) {
    setVal('f-technician', currentProfile.full_name);
    setVal('f-estimator',  currentProfile.full_name);
  }
  const s = getSettings();
  if (s.book_no) setVal('f-book-no', s.book_no);
  renderMatTable();
  calcTotals();
  navigateTo('br1');
  window.scrollTo(0,0);
}

function loadJobToForm(job) {
  editingJobId = job.id;
  br1MatRows = (job.job_materials||[]).map(m => ({
    code: m.code, name: m.name, unit: m.unit,
    basePrice: parseFloat(m.base_price), qty: m.qty,
  }));
  setVal('f-date',          job.date);
  setVal('f-service-date',  job.service_date);
  setVal('f-time-start',    job.time_start);
  setVal('f-time-end',      job.time_end);
  setVal('f-customer-name', job.customer_name);
  setVal('f-customer-phone',job.customer_phone);
  setVal('f-meter-no',      job.meter_no);
  setVal('f-address',       job.address);
  setVal('f-br1-no',        job.br1_no);
  setVal('f-book-no',       job.book_no);
  setVal('f-technician',    job.technician);
  setVal('f-estimator',     job.estimator);
  setVal('f-workers',       job.workers);
  setVal('f-work-type',     job.work_type);
  renderMatTable();
  calcTotals();
  navigateTo('br1');
  window.scrollTo(0,0);
}

// ── MATERIAL TABLE ────────────────────
function renderMatTable() {
  const tb = document.getElementById('mat-tbody');
  if (!tb) return;
  if (!br1MatRows.length) {
    tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:#aaa">
      <i class="ti ti-package" style="font-size:28px;display:block;margin-bottom:4px"></i>ค้นหาและเพิ่มรายการด้านบน</td></tr>`;
    calcTotals(); return;
  }
  tb.innerHTML = br1MatRows.map((r,i) => `<tr>
    <td class="tc">${i+1}</td>
    <td><span style="font-size:12px;color:#64748b">${r.code}</span></td>
    <td style="min-width:160px">${r.name}</td>
    <td class="tc">${r.unit||'EA'}</td>
    <td class="tc"><input type="number" class="field qty-input" value="${r.qty}" min="1" onchange="updateQty(${i},this.value)"></td>
    <td class="tr">${fmt(r.basePrice)}</td>
    <td class="tr"><strong>${fmt(calcUserPrice(r.basePrice)*r.qty)}</strong></td>
    <td class="tc"><button class="btn-icon danger btn-sm" onclick="removeRow(${i})"><i class="ti ti-trash"></i></button></td>
  </tr>`).join('');
  calcTotals();
}

function updateQty(i, v) { br1MatRows[i].qty = parseInt(v)||1; calcTotals(); }
function removeRow(i)    { br1MatRows.splice(i,1); renderMatTable(); }

function addMat(mat) {
  const ex = br1MatRows.findIndex(r => r.code === mat.code);
  ex >= 0 ? br1MatRows[ex].qty++ : br1MatRows.push({...mat, qty:1});
  renderMatTable();
  setVal('mat-search','');
  const dd = document.getElementById('mat-dd');
  if (dd) { dd.innerHTML=''; dd.style.display='none'; }
}

function onMatSearch(v) {
  const dd = document.getElementById('mat-dd');
  if (!v || v.length < 2) { dd.style.display='none'; return; }
  const res = searchMaterials(v);
  if (!res.length) { dd.style.display='none'; return; }
  dd.innerHTML = res.map(m => `
    <div class="mat-option" onclick='addMat(${JSON.stringify(m)})'>
      <div>${m.name}</div>
      <div class="code">${m.code} &nbsp;|&nbsp; ฐาน: ${fmt(m.basePrice)} บ. &nbsp;|&nbsp; <strong>+40%: ${fmt(calcUserPrice(m.basePrice))} บ.</strong></div>
    </div>`).join('');
  dd.style.display = 'block';
}

document.addEventListener('click', e => {
  if (!e.target.closest('#mat-search-wrap')) {
    const dd = document.getElementById('mat-dd');
    if (dd) dd.style.display = 'none';
  }
});

// ── CALC ──────────────────────────────
function calcTotals() {
  const s = getSettings();
  const sw  = parseFloat(s.switch_cost)   || 570;
  const s30 = parseFloat(s.service_30min) || 285;
  const mu  = br1MatRows.reduce((sum,r) => sum + calcUserPrice(r.basePrice)*r.qty, 0);
  const mh  = mu;

  const tStart = getVal('f-time-start');
  const tEnd = getVal('f-time-end');
  const { sv, blocks } = getServiceCalc(tStart, tEnd, s30);

  const st2 = sv + mh;
  const tx  = st2 * 0.07;
  const gd  = sw + st2 + tx;

  setText('c-switch', fmt(sw));
  
  const lbl = document.getElementById('lbl-service');
  if(lbl) lbl.textContent = `· ค่าบริการ (${blocks}×30 นาที)`;
  
  setText('c-service', fmt(sv));
  setText('c-mat-u', fmt(mu));
  setText('c-mat-h', fmt(mh));
  setText('c-st2', fmt(st2));
  setText('c-tax', fmt(tx));
  setText('c-grand', fmt(gd));
}

// ── SAVE ──────────────────────────────
async function saveCurrentJob() {
  const s  = getSettings();
  const sw = parseFloat(s.switch_cost)||570, s30 = parseFloat(s.service_30min)||285;
  const mu = br1MatRows.reduce((sum,r)=>sum+calcUserPrice(r.basePrice)*r.qty,0);
  const mh = mu;

  const tStart = getVal('f-time-start');
  const tEnd = getVal('f-time-end');
  const { sv } = getServiceCalc(tStart, tEnd, s30);

  const st2= Math.round((sv+mh)*100)/100;
  const tx = Math.round(st2*.07*100)/100;
  const gd = Math.round((sw+st2+tx)*100)/100;

  if (!getVal('f-date')||!getVal('f-meter-no')) {
    showToast('กรุณากรอก วันที่ และ หมายเลขมิเตอร์','warning'); return null;
  }
  const job = {
    id: editingJobId,
    br1No: getVal('f-br1-no'), bookNo: getVal('f-book-no')||s.book_no,
    date: getVal('f-date'), serviceDate: getVal('f-service-date'),
    timeStart: getVal('f-time-start'), timeEnd: getVal('f-time-end'),
    customerName: getVal('f-customer-name'), customerPhone: getVal('f-customer-phone'),
    meterNo: getVal('f-meter-no'), address: getVal('f-address'),
    technician: getVal('f-technician'), estimator: getVal('f-estimator'),
    workers: getVal('f-workers')||'1', workType: getVal('f-work-type')||'high',
    switchCost: sw, svc30min: s30, serviceCost: sv,
    matUserTotal: Math.round(mu*100)/100, matHandling: mh,
    subtotal2: st2, tax: tx, grandTotal: gd,
  };
  try {
    const id = await saveJobToDB(job, br1MatRows);
    editingJobId = id;
    showToast('บันทึกเรียบร้อยแล้ว','success');
    return id;
  } catch(e) { showToast('บันทึกไม่สำเร็จ: '+e.message,'error'); return null; }
}

// ── PREVIEW ───────────────────────────
async function previewBR1() {
  const id = await saveCurrentJob(); if (!id) return;
  const jobs = await fetchJobs({}); _previewJob = jobs.find(j=>j.id===id);
  if (!_previewJob) return;
  document.getElementById('pdf-frame').innerHTML = generateBR1HTML(_previewJob);
  document.getElementById('pdf-overlay').classList.add('show');
}

async function previewMT1() {
  const id = await saveCurrentJob(); if (!id) return;
  const jobs = await fetchJobs({}); _previewJob = jobs.find(j=>j.id===id);
  if (!_previewJob) return;
  document.getElementById('pdf-frame').innerHTML = generateMT1HTML(_previewJob);
  document.getElementById('pdf-overlay').classList.add('show');
}

function closePdfOverlay() { document.getElementById('pdf-overlay').classList.remove('show'); }

function switchDoc(type) {
  if (!_previewJob) return;
  document.getElementById('pdf-frame').innerHTML = type==='mt1' ? generateMT1HTML(_previewJob) : generateBR1HTML(_previewJob);
}

function printDoc() {
  const c = document.getElementById('pdf-frame').innerHTML;
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    <style>body{font-family:'Sarabun',sans-serif;font-size:13px;color:#111;margin:24px 40px}
    table{border-collapse:collapse;width:100%} th,td{border:1px solid #888;padding:4px 6px}
    th{background:#e0e0e0} @media print{body{margin:0}}</style>
    </head><body>${c}</body></html>`);
  w.document.close(); setTimeout(()=>w.print(),500);
}

// ── HISTORY ───────────────────────────
async function renderHistory() {
  const tb = document.getElementById('history-tbody');
  tb.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:#aaa">กำลังโหลด...</td></tr>`;
  try {
    const jobs = await fetchJobs({
      search:     getVal('h-search'),
      technician: getVal('h-tech'),
      dateFrom:   getVal('h-date-from'),
      dateTo:     getVal('h-date-to'),
    });
    if (!jobs.length) {
      tb.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:#aaa">ไม่พบข้อมูล</td></tr>`; return;
    }
    tb.innerHTML = jobs.map(j => {
      const mine = j.created_by===currentUser?.id||isAdmin();
      return `<tr>
        <td>${thaiDate(j.date)}</td>
        <td>${j.br1_no||'-'}</td>
        <td class="hide-mobile">${j.meter_no||'-'}</td>
        <td class="hide-mobile">${j.customer_name||'-'}</td>
        <td>${j.technician||j.profiles?.full_name||'-'}</td>
        <td class="tr"><strong>${fmt(j.grand_total)}</strong></td>
        <td class="tc hide-mobile">
          ${j.job_materials?.length 
            ? `<button type="button" class="badge b-primary" style="cursor:pointer; border:none;" onclick="window.viewMaterials('${j.id}', this)">${j.job_materials.length} รายการ</button>` 
            : '-'}
        </td>
        <td class="tc hide-mobile">
          ${isAdmin() 
          ? `<button type="button" class="badge ${j.status === 'paid' ? 'b-success' : 'b-warning'}" style="cursor:pointer; border:none;" onclick="window.togglePaymentStatus('${j.id}', '${j.status || 'unpaid'}', this)">
          ${j.status === 'paid' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
          </button>`
          : `<span class="badge ${j.status === 'paid' ? 'b-success' : 'b-warning'}">
         ${j.status === 'paid' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
       </span>`
  }
</td>
        <td><div class="td-actions">
          ${mine?`<button class="btn-icon btn-sm" onclick="editFromHistory('${j.id}')" title="แก้ไข"><i class="ti ti-edit"></i></button>`:''}
          <button class="btn-icon btn-sm" onclick="viewFromHistory('${j.id}')" title="ดูเอกสาร"><i class="ti ti-file-text"></i></button>
          ${mine?`<button class="btn-icon btn-sm danger" onclick="confirmDel('${j.id}')" title="ลบ"><i class="ti ti-trash"></i></button>`:''}
        </div></td>
      </tr>`;
    }).join('');
  } catch(e) {
    tb.innerHTML = `<tr><td colspan="9" style="text-align:center;color:red;padding:16px">${e.message}</td></tr>`;
  }
}

async function editFromHistory(id) {
  const jobs = await fetchJobs({}); const j = jobs.find(x=>x.id===id); if(j) loadJobToForm(j);
}

async function viewFromHistory(id) {
  const jobs = await fetchJobs({}); _previewJob = jobs.find(x=>x.id===id);
  if (!_previewJob) return;
  document.getElementById('pdf-frame').innerHTML = generateBR1HTML(_previewJob);
  document.getElementById('pdf-overlay').classList.add('show');
}

async function confirmDel(id) {
  if (!confirm('ต้องการลบใบงานนี้ใช่ไหม?')) return;
  try { await deleteJobFromDB(id); showToast('ลบแล้ว','success'); renderHistory(); }
  catch(e) { showToast('ลบไม่สำเร็จ: '+e.message,'error'); }
}

function filterHistory() { renderHistory(); }

// ── DASHBOARD ─────────────────────────
async function renderDashboard() {
  setText('dash-total','...'); setText('dash-month','...');
  try {
    const jobs = await fetchJobs({});
    const now = new Date();
    const mJobs = jobs.filter(j => {
      const d = new Date(j.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    });
    setText('dash-total',   jobs.length);
    setText('dash-month',   mJobs.length);
    setText('dash-rev-m',   fmt(mJobs.reduce((s,j)=>s+(j.grand_total||0),0),0));
    setText('dash-rev-all', fmt(jobs.reduce((s,j)=>s+(j.grand_total||0),0),0));

    // Tech summary
    const tmap = {};
    jobs.forEach(j => {
      const t = j.technician||j.profiles?.full_name||'ไม่ระบุ';
      if (!tmap[t]) tmap[t] = {n:0,rev:0,mn:0};
      tmap[t].n++; tmap[t].rev += j.grand_total||0;
      const d=new Date(j.date);
      if(d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()) tmap[t].mn++;
    });
    document.getElementById('tech-tbody').innerHTML =
      Object.entries(tmap).sort((a,b)=>b[1].n-a[1].n)
      .map(([name,d],i)=>`<tr>
        <td>${i+1}</td><td><strong>${name}</strong></td>
        <td class="tc">${d.n}</td><td class="tc">${d.mn}</td>
        <td class="tr">${fmt(d.rev,0)}</td>
        <td class="tr">${d.n?fmt(d.rev/d.n,0):'-'}</td>
      </tr>`).join('')||`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:16px">ยังไม่มีข้อมูล</td></tr>`;

    document.getElementById('recent-tbody').innerHTML =
      jobs.slice(0,8).map(j=>`<tr>
        <td>${thaiDate(j.date)}</td><td>${j.br1_no||'-'}</td>
        <td>${j.meter_no||'-'}</td><td>${j.technician||'-'}</td>
        <td class="tr">${fmt(j.grand_total)}</td>
        <td class="tc"><span class="badge ${j.status === 'paid' ? 'b-success' : 'b-warning'}">${j.status === 'paid' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}</span></td>
      </tr>`).join('')||`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:16px">ยังไม่มีข้อมูล</td></tr>`;
  } catch(e) { showToast('โหลด Dashboard ไม่สำเร็จ','error'); }
}

// ── USERS ─────────────────────────────
async function renderUsers() {
  if (!isAdmin()) return;
  const tb = document.getElementById('users-tbody');
  tb.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#aaa">กำลังโหลด...</td></tr>`;
  try {
    const profiles = await fetchAllProfiles();
    tb.innerHTML = profiles.map(p=>`<tr>
      <td>${p.employee_id}</td>
      <td>
        <input type="text" class="field" style="max-width:200px;min-height:36px;font-size:13.5px"
          value="${p.full_name}" onblur="saveName('${p.id}',this.value)">
      </td>
      <td class="tc">
        <select class="field" style="width:auto;min-height:36px;font-size:13.5px"
          onchange="changeRole('${p.id}',this.value)" ${p.id===currentUser?.id?'disabled':''}>
          <option value="technician" ${p.role==='technician'?'selected':''}>ช่าง</option>
          <option value="admin"      ${p.role==='admin'?'selected':''}>Admin</option>
        </select>
      </td>
      <td class="tc"><span class="badge ${p.role==='admin'?'b-admin':'b-success'}">${p.role==='admin'?'Admin':'ช่าง'}</span></td>
      <td class="tc">${p.id===currentUser?.id?'<span style="font-size:12px;color:#aaa">ตัวเอง</span>':''}</td>
    </tr>`).join('');
  } catch(e) { tb.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;padding:16px">${e.message}</td></tr>`; }
}

async function changeRole(id,role) {
  try { await updateProfileRole(id,role); showToast('อัพเดทสิทธิ์แล้ว','success'); renderUsers(); }
  catch(e) { showToast('ไม่สำเร็จ: '+e.message,'error'); }
}

async function saveName(id, name) {
  try { await updateProfileName(id, name); showToast('บันทึกชื่อแล้ว','success'); }
  catch(e) { showToast('ไม่สำเร็จ: '+e.message,'error'); }
}

// ── CSV ───────────────────────────────
function importCSVFile(input) {
  const file = input.files[0]; if (!file) return;
  const rd = new FileReader();
  rd.onload = e => {
    const n = importCSVFromText(e.target.result);
    setText('csv-status',`✓ โหลดสำเร็จ ${n} รายการ`);
    showToast(`อัพเดทราคามาตรฐาน ${n} รายการแล้ว`,'success');
  };
  rd.readAsText(file,'UTF-8');
}

// ── BR1 HTML ──────────────────────────
function generateBR1HTML(job) {
  const s   = getSettings();
  const sw  = parseFloat(job.switch_cost||s.switch_cost)||570;
  const s30 = parseFloat(job.svc_30min||s.service_30min)||285;
  const ms  = job.job_materials||[];
  const mu  = ms.reduce((sum,m)=>sum+parseFloat(m.user_price||0),0);
  const mh  = mu;
  
  let sv = s30 * 2; 
  if (job.serviceCost) sv = parseFloat(job.serviceCost);
  else {
    const calc = getServiceCalc(job.time_start, job.time_end, s30);
    sv = calc.sv;
  }

  const st2 = sv+mh, tx=st2*.07, gd=sw+st2+tx;
  const extraSv = sv > s30 ? sv - s30 : 0;
  
  const wH  = (job.work_type||'high')!=='low', wL=job.work_type==='low'||job.work_type==='both';

  const rows = ms.map((m,i)=>`<tr>
    <td>${i+1}</td><td>${m.code}</td><td style="text-align:left">${m.name}</td>
    <td>${m.qty}</td><td style="text-align:right">${fmt(m.base_price)}</td>
    <td style="text-align:right"><strong>${fmt(m.user_price)}</strong></td><td></td>
  </tr>`).join('');

  return `<div style="font-size:13px;color:#111;line-height:1.7">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
    <div>${docLogoTag(52)}</div>
    <div style="text-align:center;flex:1;font-size:17px;font-weight:700;color:#1a3a6b;padding:0 10px">การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม</div>
    <div style="text-align:right;font-size:12px;line-height:2;min-width:200px">
      <div><b>เลขที่ใบสั่งซ่อม :</b> ${job.br1_no||'-'}</div>
      <div>กฟฟ. : ${s.office||''}</div>
      <div>ผู้ประมาณการ : ${job.estimator||'-'}</div>
      <div>วันที่ : ${thaiDate(job.date)}</div>
    </div>
  </div>
  <div style="text-align:center;font-size:14px;font-weight:700;border:2px solid #111;padding:5px 12px;margin:8px 0">ใบประมาณการค่าใช้จ่ายบริการแก้ไขไฟฟ้าขัดข้อง (บร.1)</div>
  <b>ผู้รับบริการ</b>
  <div style="font-size:12.5px;display:flex;gap:8px;padding:2px 0;border-bottom:1px dotted #ccc">
    <span style="min-width:195px;color:#555">1.) ชื่อลูกค้า / สถานที่ผู้ใช้ไฟ :</span>
    <span style="border-bottom:1px solid #666;flex:1;padding:0 4px">${job.customer_name||''}</span>
    <span>โทร</span><span style="border-bottom:1px solid #666;min-width:110px;padding:0 4px">${job.customer_phone||''}</span>
  </div>
  <div style="font-size:12.5px;display:flex;gap:8px;padding:2px 0;border-bottom:1px dotted #ccc">
    <span style="color:#555;min-width:195px">2.) หมายเลขมิเตอร์ PEA. / NO :</span>
    <span style="border-bottom:1px solid #666;flex:1;padding:0 4px">${job.meter_no||''}</span>
  </div>
  <div style="font-size:12px;display:flex;gap:5px;flex-wrap:wrap;padding:2px 0;border-bottom:1px dotted #ccc">
    <span>- ใบ บร.1 / เล่มที่</span><span style="border-bottom:1px solid #666;min-width:48px;padding:0 4px">${job.book_no||s.book_no||''}</span>
    <span>เลขที่ :</span><span style="border-bottom:1px solid #666;min-width:58px;padding:0 4px">${job.br1_no||''}</span>
    <span>ให้บริการเมื่อ</span><span style="border-bottom:1px solid #666;min-width:110px;padding:0 4px">${thaiDate(job.service_date||job.date)}</span>
  </div>
  <div style="font-size:12px;display:flex;gap:5px;flex-wrap:wrap;padding:2px 0;border-bottom:1px dotted #ccc">
    <span>- ตั้งแต่เวลา :</span><span style="border-bottom:1px solid #666;min-width:48px;padding:0 4px">${job.time_start||''}</span>
    <span>ถึง</span><span style="border-bottom:1px solid #666;min-width:48px;padding:0 4px">${job.time_end||''}</span>
    <span>น. รวม</span><span style="border-bottom:1px solid #666;min-width:38px;padding:0 4px">${calcDuration(job.time_start,job.time_end)}</span><span>ชม.</span>
  </div>
  <div style="font-size:12px;display:flex;gap:5px;flex-wrap:wrap;padding:2px 0;border-bottom:1px dotted #ccc;margin-bottom:8px">
    <span>3.) พชง. :</span><span style="border-bottom:1px solid #666;min-width:140px;padding:0 4px">${job.technician||''}</span>
    <span>จำนวน</span><span style="border-bottom:1px solid #666;min-width:28px;padding:0 4px;text-align:center">${job.workers||1}</span><span>คน</span>
  </div>
  <b>รายการปฏิบัติงาน</b>
  <div style="border:1px solid #888;padding:10px 12px;border-radius:2px;margin:6px 0">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:7px;font-size:13px">
      <b>ข้อ ก. งานตรวจสอบและแก้ไขไฟฟ้าขัดข้อง :</b>
      <span>${wH?'☑':'☐'} ด้านแรงสูง</span><span>${wL?'☑':'☐'} ด้านแรงต่ำ</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12.5px;margin:3px 0">
      <span>1.ค่าปลด-สับอุปกรณ์ตัดตอน</span><span>เป็นเงิน <u>${fmt(sw)}</u> บาท</span>
    </div>
    <div style="font-size:12.5px;font-weight:600;margin:4px 0 2px">2.ค่าบริการแก้ไขไฟฟ้าขัดข้อง แรงสูง/แรงต่ำ</div>
    <div style="display:flex;justify-content:space-between;padding-left:14px;font-size:12px">
      <span>- สำหรับ 30 นาทีแรก ${fmt(s30)} บาท</span><span>เป็นเงิน <u>${fmt(s30)}</u> บาท</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding-left:14px;font-size:12px;margin-bottom:4px">
      <span>- สำหรับครึ่งชั่วโมงต่อไป</span><span>เป็นเงิน <u>${fmt(extraSv)}</u> บาท</span>
    </div>
    <div style="display:flex;justify-content:space-between;border-top:1.5px solid #333;padding-top:4px;font-weight:700">
      <span>รวมเป็นเงิน</span><span><u>${fmt(sw+sv)}</u> บาท</span>
    </div>
  </div>
  <b>รายการพัสดุ</b>
  <div style="font-size:12.5px;font-weight:600;margin:4px 0 2px">ข้อ ข. อุปกรณ์ที่ กฟภ. นำมาใช้ในการแก้ไขกระแสไฟฟ้าขัดข้อง</div>
  <div style="font-size:11.5px;color:#555;margin-bottom:5px">( 1.) ราคาผู้ใช้ไฟ (บวก 40%)</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin:6px 0">
    <thead><tr>
      <th style="background:#e0e0e0;border:1px solid #888;padding:5px;width:26px">ที่</th>
      <th style="background:#e0e0e0;border:1px solid #888;padding:5px;width:106px">รหัส</th>
      <th style="background:#e0e0e0;border:1px solid #888;padding:5px">รายการ</th>
      <th style="background:#e0e0e0;border:1px solid #888;padding:5px;width:46px">จำนวน</th>
      <th style="background:#e0e0e0;border:1px solid #888;padding:5px;width:78px">ราคามาตราฐาน</th>
      <th style="background:#e0e0e0;border:1px solid #888;padding:5px;width:90px">ราคาผู้ใช้ไฟ<br>ราคา+40%</th>
      <th style="background:#e0e0e0;border:1px solid #888;padding:5px;width:56px">หมายเหตุ</th>
    </tr></thead>
    <tbody>
      ${rows||'<tr><td colspan="7" style="border:1px solid #888;text-align:center;color:#aaa;padding:6px">ไม่มีรายการพัสดุ</td></tr>'}
      <tr><td colspan="5" style="border:1px solid #888;text-align:right;padding:4px 6px;font-weight:700">รวม</td>
        <td style="border:1px solid #888;text-align:right;padding:4px 6px;font-weight:700">${fmt(mu)}</td>
        <td style="border:1px solid #888"></td></tr>
    </tbody>
  </table>
  <div style="border:1px solid #888;padding:8px 12px;margin:8px 0;border-radius:2px">
    <div style="font-size:12px;font-weight:700;margin-bottom:4px">หมายเหตุ :</div>
    ${[['1.) ค่าปลด-สับอุปกรณ์ตัดตอน','S-3Z-333',fmt(sw),'(SAP)'],
       ['2.) ค่าตรวจสอบและแก้ไข + ค่าพัสดุอุปกรณ์','S-3Z-444',fmt(st2),'(พิมพ์)'],
       ['- รวมเป็นเงิน (ข้อ 1.+2. )','',fmt(sw+st2),''],
       ['- รวมภาษี 7 %','',fmt(tx),''],
    ].map(([l,c,v,n])=>`<div style="display:flex;font-size:12.5px;padding:2px 0;align-items:baseline">
      <span style="flex:1;padding-left:${l.startsWith('-')?'34':'14'}px;font-size:12px">${l}</span>
      <span style="font-size:11px;color:#666;width:64px">${c}</span>
      <span>เป็นเงิน</span>
      <span style="width:80px;text-align:right;border-bottom:1px solid #666;padding:0 4px">${v}</span>
      <span style="margin-left:3px;font-size:12px">บาท</span>
      <span style="font-size:11px;color:#666;margin-left:5px">${n}</span>
    </div>`).join('')}
    <div style="display:flex;font-size:13px;padding:4px 0 2px;border-top:1px solid #aaa;margin-top:4px;font-weight:700;align-items:baseline">
      <span style="flex:1;padding-left:34px">- สรุป (ข้อ 1.+2. ) รวมค่าใช้จ่ายทั้งหมด</span>
      <span style="width:64px"></span><span>เป็นเงิน</span>
      <span style="width:80px;text-align:right;border-bottom:2px double #111;padding:0 4px">${fmt(gd)}</span>
      <span style="margin-left:3px;font-size:12px">บาท</span>
    </div>
  </div>
  <div style="display:flex;justify-content:flex-end;gap:12px;font-weight:700;font-size:14px;padding:6px 0;border-top:2px solid #111;border-bottom:2px solid #111;margin:8px 0 4px">
    <span>รวมเป็นเงินทั้งสิ้น :</span><span>${fmt(gd)} บาท</span>
  </div>
  <div style="text-align:center;font-size:13px;margin:4px 0 16px">( ${bahtText(gd)} )</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:18px">
    <div style="text-align:center;font-size:12px">
      <div style="border-bottom:1px solid #666;margin:28px 16px 4px"></div>
      <div>(ลงชื่อ)...............................................ผู้ประมาณการ</div>
      <div>(${job.estimator||'...................................'})</div>
      <div style="color:#666;font-size:11px">............/............/............</div>
    </div>
    <div style="text-align:center;font-size:12px">
      <div style="border-bottom:1px solid #666;margin:28px 16px 4px"></div>
      <div>(ลงชื่อ)...............................................ผู้ตรวจ</div>
      <div>(...............................................)</div>
      <div style="color:#666;font-size:11px">............/............/............</div>
    </div>
  </div>
</div>`;
}

// ── MT1 HTML ──────────────────────────
function generateMT1HTML(job) {
  const s   = getSettings();
  const sw  = parseFloat(job.switch_cost||s.switch_cost)||570;
  const s30 = parseFloat(job.svc_30min||s.service_30min)||285;
  const ms  = job.job_materials||[];
  const mu  = ms.reduce((sum,m)=>sum+parseFloat(m.user_price||0),0);
  
  let sv = s30 * 2; 
  if (job.serviceCost) sv = parseFloat(job.serviceCost);
  else {
    const calc = getServiceCalc(job.time_start, job.time_end, s30);
    sv = calc.sv;
  }

  const st2 = sv+mu, tx=st2*.07, gd=sw+st2+tx;
  return `<div style="line-height:2;font-size:13.5px;color:#111">
  <div style="display:flex;align-items:flex-start;margin-bottom:16px">
    <div style="display:flex;align-items:center;gap:10px;min-width:175px">
      ${docLogoTag(52)}
      <div>
        <div style="font-size:14px;font-weight:700;color:#5a2d82">การไฟฟ้าส่วนภูมิภาค</div>
        <div style="font-size:9px;letter-spacing:.5px;color:#5a2d82">PROVINCIAL ELECTRICITY AUTHORITY</div>
      </div>
    </div>
    <div style="flex:1;text-align:right;font-size:13.5px;line-height:2">
      ${s.office||''}<br>${s.address||''}
    </div>
  </div>
  <div>ที่ ${s.doc_prefix||'มท 5306.46/นพ.-'}</div>
  <div style="text-align:center;margin:14px 0 12px">${thaiDate(job.date)}</div>
  <div style="display:flex;gap:14px;margin-bottom:4px"><span style="min-width:48px;font-weight:500">เรื่อง</span><span>แจ้งค่าบริการแก้กระแสไฟฟ้าขัดข้อง</span></div>
  <div style="display:flex;gap:14px;margin-bottom:18px"><span style="min-width:48px;font-weight:500">เรียน</span>
    <span style="border-bottom:1px solid #555;flex:1;padding:0 4px">${job.customer_name||''}</span>
  </div>
  <div style="text-indent:48px">
    ด้วยในวันที่ <strong>${thaiDate(job.service_date||job.date)}</strong> เวลา <strong>${job.time_start||'...'} น.</strong>
    ถึงเวลา <strong>${job.time_end||'...'} น.</strong>
    การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม ได้บริการแก้กระแสไฟฟ้าขัดข้องให้แก่
    หมายเลขผู้ใช้ไฟ <span style="border-bottom:1px solid #555;padding:0 4px">${job.meter_no||''}</span>
    พร้อมออกหลักฐาน ใบ บร.1 เล่มที่ <span style="border-bottom:1px solid #555;padding:0 4px">${job.book_no||s.book_no||''}</span>
    เลขที่ <span style="border-bottom:1px solid #555;padding:0 4px">${job.br1_no||''}</span>
    เพื่อเรียกเก็บค่าใช้จ่ายในภายหลังนั้น บัดนี้ การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม
    ได้ตรวจสอบประมาณการแล้วมีค่าใช้จ่าย ดังนี้
  </div>
  <table style="width:100%;margin:10px 0;font-size:13.5px">
    ${[['1.) ค่าปลด-สับอุปกรณ์ตัดตอน',fmt(sw)],['2.) ค่าตรวจสอบและแก้ไข + ค่าพัสดุอุปกรณ์',fmt(st2)],
       ['&emsp;-รวมเป็นเงิน (ข้อ 1.+2. )',fmt(sw+st2)],['&emsp;-ภาษี 7 %',fmt(tx)]
    ].map(([l,v])=>`<tr><td style="padding:3px 0">${l}</td><td style="text-align:center;width:78px">เป็นเงิน</td>
      <td style="text-align:right;width:115px;padding-right:6px">${v} บาท</td></tr>`).join('')}
    <tr style="border-top:1.5px solid #333;font-weight:700;font-size:14px">
      <td style="padding:5px 0">&emsp;-สรุป (ข้อ 1.+2. ) รวมค่าใช้จ่ายทั้งหมด</td>
      <td style="text-align:center">รวมเป็นเงิน</td>
      <td style="text-align:right;padding-right:6px">${fmt(gd)} บาท</td>
    </tr>
  </table>
  <div style="text-align:center;margin:4px 0 12px">( ${bahtText(gd)} )</div>
  <div style="margin:12px 0 6px">จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป จักขอบคุณยิ่ง</div>
  <div style="text-align:center;margin-top:8px">ขอแสดงความนับถือ</div>
  <div style="text-align:center;margin:40px 0 16px">
    <div style="font-weight:600">${s.manager||''}</div>
    <div>ผู้จัดการ</div>
    <div>${s.office||''}</div>
  </div>
  <div style="margin-top:20px;padding-top:8px;border-top:1px solid #ccc;font-size:12px;color:#555">
    ${s.dept||''}<br>โทร. ${s.phone||''}
  </div>
</div>`;
}

// ── ฟังก์ชันเสริมสำหรับแสดงรายการพัสดุ ──
window.viewMaterials = async function(id, btn) {
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="ti ti-loader"></i> โหลด...';
  btn.disabled = true;

  try {
    const jobs = await fetchJobs({}); 
    const job = jobs.find(x => x.id === id);
    
    if (!job || !job.job_materials || job.job_materials.length === 0) {
      showToast('ไม่พบรายการพัสดุในใบงานนี้', 'warning');
      return;
    }
    
    const tbody = document.getElementById('mat-modal-tbody');
    tbody.innerHTML = job.job_materials.map((m, i) => `
      <tr>
        <td class="tc">${i + 1}</td>
        <td><span style="font-size:12px;color:#64748b">${m.code}</span></td>
        <td>${m.name}</td>
        <td class="tc"><strong>${m.qty}</strong> ${m.unit || 'EA'}</td>
      </tr>
    `).join('');
    
    document.getElementById('mat-modal-overlay').classList.add('open');
  } catch (err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
};

window.closeMatModal = function() {
  document.getElementById('mat-modal-overlay').classList.remove('open');
};

// ── ฟังก์ชันเปลี่ยนสถานะการจ่ายเงิน (Admin เท่านั้น) ──
window.togglePaymentStatus = async function(id, currentStatus, btn) {
  if (!isAdmin()) return;
  // สลับค่า: ถ้าจ่ายแล้ว -> กลับไปเป็นยังไม่จ่าย, ถ้ายังไม่จ่าย -> เป็นจ่ายแล้ว
  const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
  
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="ti ti-loader"></i>...';
  btn.disabled = true;

  try {
    await updateJobStatus(id, newStatus);
    showToast(newStatus === 'paid' ? 'อัพเดทสถานะ: จ่ายแล้ว' : 'อัพเดทสถานะ: ยังไม่จ่าย', 'success');
    renderHistory(); // โหลดตารางใหม่เพื่อให้ข้อมูลอัปเดตทันที
  } catch(err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการอัพเดทสถานะ', 'error');
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
};