// ===== Materials Loader (CSV) =====
let MATERIALS = [];

async function loadMaterials() {
  try {
    const res = await fetch('data/materials.csv');
    const text = await res.text();
    MATERIALS = parseCSV(text);
    console.log(`Loaded ${MATERIALS.length} materials`);
  } catch (e) {
    console.warn('Could not load materials.csv:', e);
    MATERIALS = [];
  }
}

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (!cols[0]) continue;
    const code     = cols[0].trim();
    const name     = cols[1] ? cols[1].trim() : '';
    const unit     = cols[2] ? cols[2].trim() : 'EA';
    const priceE   = parseFloat(cols[4])  || 0;
    const priceK   = parseFloat(cols[10]) || 0;
    const basePrice = priceE > 0 ? priceE : priceK;
    if (code && name && basePrice > 0) {
      results.push({ code, name, unit, basePrice });
    }
  }
  return results;
}

function parseCSVLine(line) {
  const cols = [];
  let cur = '', inQuote = false;
  for (const c of line) {
    if (c === '"') { inQuote = !inQuote; }
    else if (c === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
    else { cur += c; }
  }
  cols.push(cur.trim());
  return cols;
}

function searchMaterials(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return MATERIALS.filter(m =>
    m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
  ).slice(0, 60);
}

function calcUserPrice(basePrice) {
  return Math.round(basePrice * 1.40 * 100) / 100;
}

function importCSVFromText(text) {
  MATERIALS = parseCSV(text);
  return MATERIALS.length;
}
