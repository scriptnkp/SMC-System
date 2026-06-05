const API_URL = 'https://script.google.com/macros/s/AKfycbxzaxiO9VErx1JeRK1RxFspKNYAKsljlyx5de4MPiAO72JP7GIh7Mr2QGJ5SzwWcABE/exec';

let materialsData = [];
let historyData = []; 

document.addEventListener("DOMContentLoaded", () => {
    loadCSV('ราคามาตราฐาน.csv'); 
    resetForm();
});

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if(tab === 'form') {
        document.getElementById('formSection').style.display = 'block';
        document.getElementById('dashboardSection').style.display = 'none';
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
    } else {
        document.getElementById('formSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        fetchDashboardData(); 
    }
}

function loadCSV(url) {
    showLoader('กำลังโหลดฐานข้อมูลราคา...');
    Papa.parse(url, {
        download: true, header: true, skipEmptyLines: true,
        complete: function(results) {
            materialsData = results.data;
            const datalist = document.getElementById('materialsList');
            materialsData.forEach(item => {
                const option = document.createElement('option');
                option.value = `${item['รหัสพัสดุ']} - ${item['ชื่อพัสดุ']}`;
                datalist.appendChild(option);
            });
            hideLoader();
        }
    });
}

function addItemRow(itemName = '', qty = 1) {
    const container = document.getElementById('itemsContainer');
    const rowId = Date.now() + Math.floor(Math.random() * 1000);
    const html = `
        <div class="item-row" id="row-${rowId}">
            <input type="text" class="item-select" list="materialsList" placeholder="พิมพ์ค้นหา..." value="${itemName}" onchange="calculateTotal()" required>
            <input type="number" class="item-qty" placeholder="จำนวน" min="1" value="${qty}" onchange="calculateTotal()" required>
            <button type="button" class="btn-delete" onclick="removeRow(${rowId})">ลบ</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    calculateTotal();
}

function removeRow(rowId) {
    document.getElementById(`row-${rowId}`).remove();
    calculateTotal();
}

function resetForm() {
    document.getElementById('serviceForm').reset();
    document.getElementById('editRowIndex').value = '';
    document.getElementById('editTimestamp').value = '';
    document.getElementById('submitBtn').innerText = 'บันทึกข้อมูลเข้าระบบ';
    document.getElementById('serviceDate').valueAsDate = new Date();
    document.getElementById('itemsContainer').innerHTML = '';
    addItemRow();
    calculateTotal();
}

function calculateTotal() {
    const start = document.getElementById('timeStart').value;
    const end = document.getElementById('timeEnd').value;
    let serviceFee = 0;
    
    if (start && end) {
        const startTime = new Date(`2000-01-01T${start}`);
        let endTime = new Date(`2000-01-01T${end}`);
        if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
        
        let diffMins = (endTime - startTime) / 60000;
        let hours = Math.floor(diffMins / 60);
        let mins = diffMins % 60;
        document.getElementById('totalHoursTxt').innerText = `${hours} ชม. ${mins} นาที`;

        if (diffMins > 0) {
            serviceFee = 285;
            if (diffMins > 30) serviceFee += Math.ceil((diffMins - 30) / 30) * 285;
        }
    }

    let materialsFee = 0;
    document.querySelectorAll('.item-row').forEach(row => {
        const itemVal = row.querySelector('.item-select').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        if (itemVal) {
            const itemCode = itemVal.split(' - ')[0];
            const matchedItem = materialsData.find(m => m['รหัสพัสดุ'] === itemCode);
            if (matchedItem) {
                let price = parseFloat(matchedItem['ราคามาตรฐาน']);
                if (isNaN(price) || price === 0) price = parseFloat(matchedItem['Std_อีสาน']);
                if (!isNaN(price)) materialsFee += (price * 1.4) * qty;
            }
        }
    });

    const switchFee = 570;
    const total = switchFee + serviceFee + materialsFee;

    document.getElementById('serviceFeeTxt').innerText = serviceFee.toLocaleString();
    document.getElementById('sumService').innerText = serviceFee.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' บาท';
    document.getElementById('sumMaterials').innerText = materialsFee.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' บาท';
    document.getElementById('sumTotal').innerText = total.toLocaleString('en-US', {minimumFractionDigits: 2}) + ' บาท';
}

document.getElementById('serviceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        items.push({ itemName: row.querySelector('.item-select').value, qty: row.querySelector('.item-qty').value });
    });

    const editRowIndex = document.getElementById('editRowIndex').value;

    const payload = {
        action: editRowIndex ? 'edit' : 'create',
        rowIndex: editRowIndex,
        timestamp: document.getElementById('editTimestamp').value, 
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
        totalMt1: parseFloat(document.getElementById('sumTotal').innerText.replace(/,/g, ''))
    };

    showLoader(editRowIndex ? 'กำลังอัปเดตข้อมูล...' : 'กำลังบันทึกข้อมูล...');
    fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
    .then(r => r.json())
    .then(result => {
        hideLoader();
        if (result.status === 'success') {
            alert(result.message);
            resetForm();
        } else { alert('เกิดข้อผิดพลาด: ' + result.message); }
    })
    .catch(e => { hideLoader(); alert('ไม่สามารถเชื่อมต่อระบบหลังบ้านได้'); });
});

function fetchDashboardData() {
    showLoader('กำลังโหลดประวัติ...');
    fetch(API_URL)
    .then(r => r.json())
    .then(result => {
        hideLoader();
        if(result.status === 'success') {
            historyData = result.data.reverse(); 
            renderDashboard();
            renderHistory();
        }
    }).catch(e => { hideLoader(); alert('โหลดข้อมูลล้มเหลว'); });
}

function renderDashboard() {
    const summary = {};
    historyData.forEach(row => {
        const staff = row.StaffName || 'ไม่ระบุชื่อ';
        if(!summary[staff]) summary[staff] = { count: 0, totalRevenue: 0 };
        summary[staff].count += 1;
        summary[staff].totalRevenue += parseFloat(row.TotalMT1) || 0;
    });

    let html = '';
    for(const [staff, data] of Object.entries(summary)) {
        html += `<tr><td><strong>${staff}</strong></td><td>${data.count}</td><td style="color:#28a745; font-weight:bold;">${data.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}</td></tr>`;
    }
    document.querySelector('#dashboardTable tbody').innerHTML = html || '<tr><td colspan="3" style="text-align:center;">ยังไม่มีข้อมูล</td></tr>';
}

function renderHistory() {
    let html = '';
    historyData.slice(0, 20).forEach(row => {
        const dateStr = row.ServiceDate ? new Date(row.ServiceDate).toLocaleDateString('th-TH') : '-';
        const total = parseFloat(row.TotalMT1) || 0;
        html += `<tr><td>${dateStr}</td><td>${row.CustomerName}</td><td>${row.StaffName}</td><td>${total.toLocaleString('en-US', {minimumFractionDigits: 2})}</td><td><button class="btn-sm" onclick="editRecord(${row.rowIndex})">✏️ แก้ไข</button></td></tr>`;
    });
    document.querySelector('#historyTable tbody').innerHTML = html || '<tr><td colspan="5" style="text-align:center;">ยังไม่มีประวัติ</td></tr>';
}

function editRecord(rowIndex) {
    const record = historyData.find(r => r.rowIndex === rowIndex);
    if(!record) return;

    switchTab('form'); 
    document.getElementById('editRowIndex').value = record.rowIndex;
    document.getElementById('editTimestamp').value = record.Timestamp;
    
    if(record.ServiceDate) {
        const d = new Date(record.ServiceDate);
        document.getElementById('serviceDate').value = d.toISOString().split('T')[0];
    }
    
    document.getElementById('timeStart').value = record.TimeStart;
    document.getElementById('timeEnd').value = record.TimeEnd;
    document.getElementById('br1Info').value = record.BR1_Info;
    document.getElementById('customerName').value = record.CustomerName;
    document.getElementById('phone').value = record.Phone;
    document.getElementById('meterNo').value = record.MeterNo;
    document.getElementById('staffName').value = record.StaffName;

    document.getElementById('itemsContainer').innerHTML = ''; 
    try {
        const items = JSON.parse(record.ItemsJSON || '[]');
        items.forEach(item => addItemRow(item.itemName, item.qty));
        if(items.length === 0) addItemRow(); 
    } catch(e) { addItemRow(); }

    calculateTotal();
    document.getElementById('submitBtn').innerText = 'อัปเดตข้อมูล (Edit)';
    window.scrollTo(0, 0); 
}

function showLoader(text) { document.getElementById('loader').style.display = 'flex'; document.getElementById('loaderText').innerText = text; }
function hideLoader() { document.getElementById('loader').style.display = 'none'; }

// ฟังก์ชันสั่งพิมพ์รายงาน
function triggerReportPrint(reportType) {
    try {
        const items = [];
        document.querySelectorAll('.item-row').forEach(row => {
            const itemVal = row.querySelector('.item-select').value;
            const qty = parseFloat(row.querySelector('.item-qty').value) || 1;
            let unitPrice = 0;
            
            if (itemVal && materialsData.length > 0) {
                const itemCode = itemVal.split(' - ')[0];
                const matchedItem = materialsData.find(m => m['รหัสพัสดุ'] === itemCode);
                if (matchedItem) {
                    let price = parseFloat(matchedItem['ราคามาตรฐาน']);
                    if (isNaN(price) || price === 0) price = parseFloat(matchedItem['Std_อีสาน']);
                    if (!isNaN(price)) unitPrice = price * 1.4; // บวก 40%
                }
            }

            items.push({
                itemName: itemVal,
                qty: qty,
                unitPrice: unitPrice,
                totalPrice: unitPrice * qty
            });
        });

        const currentData = {
            serviceDate: document.getElementById('serviceDate').value,
            timeStart: document.getElementById('timeStart').value,
            timeEnd: document.getElementById('timeEnd').value,
            totalHours: document.getElementById('totalHoursTxt').innerText,
            staffName: document.getElementById('staffName').value,
            customerName: document.getElementById('customerName').value,
            phone: document.getElementById('phone').value,
            meterNo: document.getElementById('meterNo').value,
            br1Info: document.getElementById('br1Info').value || '',
            items: items,
            switchFee: 570,
            serviceFee: parseFloat(document.getElementById('sumService').innerText.replace(/,/g, '')) || 0,
            materialsFee: parseFloat(document.getElementById('sumMaterials').innerText.replace(/,/g, '')) || 0,
            totalBr1: parseFloat(document.getElementById('sumTotal').innerText.replace(/,/g, '')) || 570,
        };

        if (reportType === 'BR1') {
            printBR1(currentData);
        } else if (reportType === 'MT1') {
            printMT1(currentData);
        }
    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการสร้างเอกสารพิมพ์ กรุณาตรวจสอบว่ากรอกข้อมูลครบถ้วน');
    }
}