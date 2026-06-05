// ===== Materials (ราคามาตรฐาน) Loader =====
// Reads data/materials.csv
// Col E (index 4) = ราคามาตรฐาน, Col K (index 10) = Std_อีสาน
// Price logic: use col E if present, else col K

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
    const code = cols[0].trim();
    const name = cols[1] ? cols[1].trim() : '';
    const unit = cols[2] ? cols[2].trim() : 'EA';
    const priceE = parseFloat(cols[4]) || 0;   // col E = index 4 (ราคามาตรฐาน)
    const priceK = parseFloat(cols[10]) || 0;  // col K = index 10 (Std_อีสาน)
    const basePrice = priceE > 0 ? priceE : priceK;
    if (code && name && basePrice > 0) {
      results.push({ code, name, unit, basePrice });
    }
  }
  return results;
}

function parseCSVLine(line) {
  const cols = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuote = !inQuote;
    } else if (c === ',' && !inQuote) {
      cols.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  cols.push(cur.trim());
  return cols;
}

function searchMaterials(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return MATERIALS.filter(m =>
    m.code.toLowerCase().includes(q) ||
    m.name.toLowerCase().includes(q)
  ).slice(0, 50);
}

function getMaterialByCode(code) {
  return MATERIALS.find(m => m.code === code) || null;
}

function calcUserPrice(basePrice) {
  // +40%
  return Math.round(basePrice * 1.40 * 100) / 100;
}
