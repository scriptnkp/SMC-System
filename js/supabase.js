// ===== Supabase Client v2.1 =====
// แก้ 2 บรรทัดนี้ด้วยค่าจาก Supabase → Settings → API
const SUPABASE_URL  = 'https://ykqzmpygyscilxuddhrg.supabase.co';
const SUPABASE_ANON = 'ykqzmpygyscilxuddhrg';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

let currentUser    = null;
let currentProfile = null;

// ── AUTH ──────────────────────────────
async function initAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    currentUser = session.user;
    await fetchProfile();
    showApp();
  } else {
    showLoginScreen();
  }
  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      await fetchProfile();
      showApp();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null; currentProfile = null;
      showLoginScreen();
    }
  });
}

async function fetchProfile() {
  const { data } = await db.from('profiles').select('*').eq('id', currentUser.id).single();
  currentProfile = data;
}

// Login: employee_id → email ภายใน (empId@pea.internal)
async function loginWithEmployeeId(empId, password) {
  const email = `${empId.trim()}@pea.internal`;
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

async function logout() { await db.auth.signOut(); }
function isAdmin() { return currentProfile?.role === 'admin'; }

// ── SETTINGS ──────────────────────────
async function loadSettingsFromDB() {
  const { data } = await db.from('settings').select('*').eq('id', 1).single();
  if (data) {
    window._cachedSettings = data;
    applySettingsToForm(data);
    applyLogoFromDB(data.logo_url);
  }
}

async function saveSettingsToDB(payload) {
  const { error } = await db.from('settings')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) throw error;
  window._cachedSettings = { ...window._cachedSettings, ...payload };
}

function getSettings() { return window._cachedSettings || {}; }

// ── JOBS ──────────────────────────────
async function fetchJobs(filters = {}) {
  let q = db.from('jobs').select(`
    *, profiles:created_by(full_name, employee_id), job_materials(*)
  `).order('created_at', { ascending: false });

  if (filters.search)     q = q.or(`meter_no.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,br1_no.ilike.%${filters.search}%`);
  if (filters.technician) q = q.ilike('technician', `%${filters.technician}%`);
  if (filters.dateFrom)   q = q.gte('date', filters.dateFrom);
  if (filters.dateTo)     q = q.lte('date', filters.dateTo);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function saveJobToDB(job, materials) {
  const isNew = !job.id;
  const payload = {
    br1_no: job.br1No, book_no: job.bookNo,
    date: job.date, service_date: job.serviceDate,
    time_start: job.timeStart, time_end: job.timeEnd,
    customer_name: job.customerName, customer_phone: job.customerPhone,
    meter_no: job.meterNo, address: job.address,
    technician: job.technician, estimator: job.estimator,
    workers: parseInt(job.workers)||1, work_type: job.workType||'high',
    switch_cost: job.switchCost, service_cost: job.serviceCost, svc_30min: job.svc30min,
    mat_user_total: job.matUserTotal, mat_handling: job.matHandling,
    subtotal2: job.subtotal2, tax: job.tax, grand_total: job.grandTotal,
    status: 'active', updated_at: new Date().toISOString(),
  };

  let jobId = job.id;
  if (isNew) {
    payload.created_by = currentUser.id;
    const { data, error } = await db.from('jobs').insert(payload).select().single();
    if (error) throw error;
    jobId = data.id;
  } else {
    const { error } = await db.from('jobs').update(payload).eq('id', jobId);
    if (error) throw error;
    await db.from('job_materials').delete().eq('job_id', jobId);
  }

  if (materials.length > 0) {
    const { error } = await db.from('job_materials').insert(
      materials.map((m, i) => ({
        job_id: jobId, code: m.code, name: m.name, unit: m.unit||'EA',
        qty: m.qty, base_price: m.basePrice,
        user_price: calcUserPrice(m.basePrice) * m.qty, sort_order: i,
      }))
    );
    if (error) throw error;
  }
  return jobId;
}

async function deleteJobFromDB(id) {
  const { error } = await db.from('jobs').delete().eq('id', id);
  if (error) throw error;
}

// ── PROFILES (admin) ──────────────────
async function fetchAllProfiles() {
  const { data, error } = await db.from('profiles').select('*').order('full_name');
  if (error) throw error;
  return data || [];
}

async function updateProfileRole(userId, role) {
  const { error } = await db.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

async function updateProfileName(userId, fullName) {
  const { error } = await db.from('profiles').update({ full_name: fullName }).eq('id', userId);
  if (error) throw error;
}

// ── LOGO STORAGE ──────────────────────
async function uploadLogoToStorage(file) {
  const ext  = file.name.split('.').pop();
  const path = `logo/org-logo.${ext}`;
  const { error } = await db.storage.from('pea-assets').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = db.storage.from('pea-assets').getPublicUrl(path);
  return data.publicUrl;
}
