// URL ของ Google Apps Script ของคุณ (Fix ไว้เลย)
const API_URL = 'https://script.google.com/macros/s/AKfycbxzaxiO9VErx1JeRK1RxFspKNYAKsljlyx5de4MPiAO72JP7GIh7Mr2QGJ5SzwWcABE/exec';

let materialsData = []; // เก็บข้อมูลพัสดุจาก CSV

document.addEventListener("DOMContentLoaded", () => {
    // 1. โหลดไฟล์ CSV อัตโนมัติเมื่อเปิดหน้าเว็บ (สมมติว่าไฟล์อยู่ในโฟลเดอร์เดียวกันบน GitHub)
    loadCSV('ราคามาตราฐาน.csv'); 
    
    // ตั้งค่าวันที่ปัจจุบันให้ช่องวันที่
    document.getElementById('serviceDate').valueAsDate = new Date();
    
    // สร้างช่องใส่พัสดุเริ่มต้น 1 ช่อง
    addItemRow();
});

// ฟังก์ชันอ่านไฟล์ CSV ด้วย PapaParse
function loadCSV(url) {
    showLoader('กำลังโหลดฐานข้อมูลราคา...');
    Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            materialsData = results.data;
            const datalist = document.getElementById('materialsList');
            
            // สร้าง Dropdown แบบค้นหาได้
            materialsData.forEach(item => {
                const option = document.createElement('option');
                // แสดงรหัสพัสดุ + ชื่อ
                option.value = `${item['รหัสพัสดุ']} - ${item['ชื่อพัสดุ']}`;
                datalist.appendChild(option);
            });
            hideLoader();
        },
        error: function(err) {
            console.error("CSV Load Error:", err);
            hideLoader();
            alert("ไม่สามารถโหลดไฟล์ ราคามาตราฐาน.csv ได้ กรุณาตรวจสอบว่ามีไฟล์อยู่บนระบบ");
        }
    });
}

// ฟังก์ชันเพิ่มบรรทัดพัสดุ
function addItemRow() {
    const container = document.getElementById('itemsContainer');
    const rowId = Date.now();
    const html = `
        <div class="item-row" id="row-${rowId}">
            <input type="text" class="item-select" list="materialsList" placeholder="พิมพ์ค้นหารหัส หรือ ชื่อพัสดุ..." onchange="calculateTotal()" required>
            <input type="number" class="item-qty" placeholder="จำนวน" min="1" value="1" onchange="calculateTotal()" required>
            <button type="button" class="btn-delete" onclick="removeRow(${rowId})">ลบ</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function removeRow(rowId) {
    document.getElementById(`row-${rowId}`).remove();
    calculateTotal();
}

// ฟังก์ชันหลัก: คำนวณเงินทั้งหมด
function calculateTotal() {
    // 1. คำนวณค่าบริการ (จากเวลา)
    const start = document.getElementById('timeStart').value;
    const end = document.getElementById('timeEnd').value;
    let serviceFee = 0;
    
    if (start && end) {
        const startTime = new Date(`2000-01-01T${start}`);
        let endTime = new Date(`2000-01-01T${end}`);
        
        if (endTime < startTime) endTime.setDate(endTime.getDate() + 1); // ข้ามวัน
        
        let diffMins = (endTime - startTime) / 60000;
        let hours = Math.floor(diffMins / 60);
        let mins = diffMins % 60;
        document.getElementById('totalHoursTxt').innerText = `${hours} ชม. ${mins} นาที`;

        // ตรรกะ: 30 นาทีแรก 285 / ต่อไปทุก 30 นาที 285
        if (diffMins > 0) {
            serviceFee = 285; // 30 นาทีแรก
            if (diffMins > 30) {
                serviceFee += Math.ceil((diffMins - 30) / 30) * 285;
            }
        }
    }

    // 2. คำนวณค่าพัสดุ
    let materialsFee = 0;
    const itemRows = document.querySelectorAll('.item-row');
    
    itemRows.forEach(row => {
        const itemVal = row.querySelector('.item-select').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        
        if (itemVal) {
            const itemCode = itemVal.split(' - ')[0]; // แยกรหัสพัสดุออกมา
            const matchedItem = materialsData.find(m => m['รหัสพัสดุ'] === itemCode);
            
            if (matchedItem) {
                // ตรรกะ: เช็ค Column E (ราคามาตรฐาน) ถ้าไม่มี ดึง Column K (Std_อีสาน)
                let price = parseFloat(matchedItem['ราคามาตรฐาน']);
                if (isNaN(price) || price === 0) {
                    price = parseFloat(matchedItem['Std_อีสาน']);
                }
                
                if (!isNaN(price)) {
                    // บวก 40% (x 1.4) ตามโจทย์
                    materialsFee += (price * 1.4) * qty;
                }
            }
        }
    });

    // 3. อัปเดตหน้าจอ
    const switchFee = 570;
    const total = switchFee + serviceFee + materialsFee;

    document.getElementById('serviceFeeTxt').innerText = serviceFee.toLocaleString();
    document.getElementById('sumService').innerText = serviceFee.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' บาท';
    document.getElementById('sumMaterials').innerText = materialsFee.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' บาท';
    document.getElementById('sumTotal').innerText = total.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' บาท';
}

// จับเหตุการณ์ตอนกด Submit Form
document.getElementById('serviceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // สร้าง Array ของรายการพัสดุที่เลือก
    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        items.push({
            itemName: row.querySelector('.item-select').value,
            qty: row.querySelector('.item-qty').value
        });
    });

    // เตรียมก้อนข้อมูล (Payload) ตามชื่อคอลัมน์ฝั่ง Backend
    const payload = {
        serviceDate: document.getElementById('serviceDate').value,
        timeStart: document.getElementById('timeStart').value,
        timeEnd: document.getElementById('timeEnd').value,
        totalHours: document.getElementById('totalHoursTxt').innerText,
        staffName: document.getElementById('staffName').value,
        customerName: document.getElementById('customerName').value,
        phone: document.getElementById('phone').value,
        meterNo: document.getElementById('meterNo').value,
        br1Info: document.getElementById('br1Info').value,
        items: items,
        switchFee: 570,
        serviceFee: parseFloat(document.getElementById('sumService').innerText.replace(/,/g, '')),
        materialsFee: parseFloat(document.getElementById('sumMaterials').innerText.replace(/,/g, '')),
        totalBr1: parseFloat(document.getElementById('sumTotal').innerText.replace(/,/g, '')),
        totalMt1: parseFloat(document.getElementById('sumTotal').innerText.replace(/,/g, '')) // ยอดเดียวกัน
    };

    // ส่งเข้า GAS API
    showLoader('กำลังบันทึกข้อมูลเข้าระบบ...');
    
    fetch(API_URL, {
        method: 'POST',
        // GAS รองรับ text/plain เพื่อเลี่ยงปัญหา CORS Preflight ได้ดีที่สุด
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        hideLoader();
        if (result.status === 'success') {
            alert('บันทึกข้อมูลเรียบร้อยแล้ว!');
            document.getElementById('serviceForm').reset(); // เคลียร์ฟอร์ม
            calculateTotal(); // รีเซ็ตยอดเงิน
        } else {
            alert('เกิดข้อผิดพลาด: ' + result.message);
        }
    })
    .catch(error => {
        hideLoader();
        console.error("API Error:", error);
        alert('ไม่สามารถเชื่อมต่อระบบหลังบ้านได้');
    });
});

// UI Helpers
function showLoader(text) {
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('loaderText').innerText = text;
}
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}