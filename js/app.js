// URL ของ Google Apps Script ของคุณ
const API_URL = 'https://script.google.com/macros/s/AKfycbxzaxiO9VErx1JeRK1RxFspKNYAKsljlyx5de4MPiAO72JP7GIh7Mr2QGJ5SzwWcABE/exec';

let materialsData = [];

document.addEventListener("DOMContentLoaded", () => {
    loadCSV('ราคามาตราฐาน.csv'); 
    document.getElementById('serviceDate').valueAsDate = new Date();
    addItemRow();
});

function loadCSV(url) {
    showLoader('กำลังโหลดฐานข้อมูลราคา...');
    Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            materialsData = results.data;
            const datalist = document.getElementById('materialsList');
            materialsData.forEach(item => {
                const option = document.createElement('option');
                option.value = `${item['รหัสพัสดุ']} - ${item['ชื่อพัสดุ']}`;
                datalist.appendChild(option);
            });
            hideLoader();
        },
        error: function(err) {
            console.error("CSV Load Error:", err);
            hideLoader();
            alert("ไม่สามารถโหลดไฟล์ ราคามาตราฐาน.csv ได้");
        }
    });
}

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
            if (diffMins > 30) {
                serviceFee += Math.ceil((diffMins - 30) / 30) * 285;
            }
        }
    }

    let materialsFee = 0;
    const itemRows = document.querySelectorAll('.item-row');
    
    itemRows.forEach(row => {
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
        items.push({
            itemName: row.querySelector('.item-select').value,
            qty: row.querySelector('.item-qty').value
        });
    });

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
        totalMt1: parseFloat(document.getElementById('sumTotal').innerText.replace(/,/g, ''))
    };

    showLoader('กำลังบันทึกข้อมูลเข้าระบบ...');
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        hideLoader();
        if (result.status === 'success') {
            alert('บันทึกข้อมูลเรียบร้อยแล้ว!');
            document.getElementById('serviceForm').reset();
            calculateTotal();
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

function showLoader(text) {
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('loaderText').innerText = text;
}
function hideLoader() { document.getElementById('loader').style.display = 'none'; }

// ฟังก์ชันส่งข้อมูลไปให้ระบบออกรายงานและสั่งพิมพ์
function triggerReportPrint(reportType) {
    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        items.push({
            itemName: row.querySelector('.item-select').value,
            qty: parseFloat(row.querySelector('.item-qty').value) || 1
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
        br1Info: document.getElementById('br1Info').value,
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
}