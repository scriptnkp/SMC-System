// ==========================================
// Report Engine: จัดการระบบพิมพ์ PDF บร.1 และ มท.1
// ==========================================

function printBR1(formData) {
    const printArea = document.getElementById('printArea');
    
    const br1Str = formData.br1Info || '';
    const br1Parts = br1Str.split('/');
    const br1Book = br1Parts[0] ? br1Parts[0].trim() : '-';
    const br1No = br1Parts[1] ? br1Parts[1].trim() : br1Book;

    let itemsHtml = '';
    let totalMaterialCost = 0;

    formData.items.forEach((item, index) => {
        if(item.itemName) {
            let code = item.itemName.split(' - ')[0] || '';
            let name = item.itemName.split(' - ')[1] || item.itemName;
            let unitPrice = parseFloat(item.unitPrice) || 0;
            let qty = parseFloat(item.qty) || 0;
            let basePrice = unitPrice / 1.4;
            let rowTotal = item.totalPrice || (unitPrice * qty);
            totalMaterialCost += rowTotal;

            itemsHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${code}</td>
                    <td class="left">${name}</td>
                    <td>${qty}</td>
                    <td>${basePrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td>${rowTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td></td>
                </tr>
            `;
        }
    });

    if(!itemsHtml) itemsHtml = '<tr><td colspan="7" style="text-align:center; color:#999; padding: 10px;">- ไม่มีรายการพัสดุ -</td></tr>';

    let first30Min = formData.serviceFee > 0 ? 285 : 0;
    let next30Min = formData.serviceFee > 285 ? formData.serviceFee - 285 : 0;
    let totalSectionA = formData.switchFee + formData.serviceFee;
    let sum1 = formData.switchFee;
    let sum2 = formData.serviceFee + formData.materialsFee;
    let sumTotal = sum1 + sum2;
    let vatAmount = sumTotal * 0.07;
    let grandTotal = sumTotal + vatAmount;

    const htmlContent = `
        <div class="print-doc">
            <div class="header-top">
                <div class="logo-area">
                <div class="logo-circle"><div class="logo-inner">กฟภ.</div></div>
                </div>
                <div class="org-name">การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม</div>
                <div class="doc-info">
                <div><strong>เลขที่ใบสั่งซ่อม :</strong> <span class="badge">${br1No}</span></div>
                <div>กฟฟ. : กฟจ.นครพนม</div>
                <div>เจ้าหน้าที่ผู้ประมาณการ : ${formData.staffName}</div>
                <div>วันที่ : ${formatThaiDate(formData.serviceDate)}</div>
                </div>
            </div>
            <div class="doc-title">ใบประมาณการค่าใช้จ่ายบริการแก้ไขไฟฟ้าขัดข้อง (บร.1)</div>
            <div class="section-label">ผู้รับบริการ</div>
            <div class="info-row-full">
                <span class="info-label">1.) ชื่อลูกค้า / สถานที่ผู้ใช้ไฟ :</span>
                <span class="info-value">${formData.customerName}</span>
                <span style="font-size:12px">โทร</span>
                <span class="info-value" style="max-width:130px">${formData.phone}</span>
            </div>
            <div class="info-row-full">
                <span class="info-label">2.) หมายเลขมิเตอร์ PEA. / NO :</span>
                <span class="info-value">${formData.meterNo}</span>
            </div>
            <div class="info-row-full" style="align-items:center;flex-wrap:wrap;gap:4px">
                <span style="font-size:12px">- ใบ บร.1 / เล่มที่</span>
                <span class="info-value" style="max-width:50px">${br1Book}</span>
                <span style="font-size:12px">เลขที่ :</span>
                <span class="info-value" style="max-width:80px">${br1No}</span>
                <span style="font-size:12px">ให้บริการเมื่อวันที่</span>
                <span class="info-value" style="max-width:140px">${formatThaiDate(formData.serviceDate)}</span>
            </div>
            <div class="info-row-full" style="align-items:center;flex-wrap:wrap;gap:4px">
                <span style="font-size:12px">- ตั้งแต่เวลา :</span>
                <span class="info-value" style="max-width:50px">${formData.timeStart}</span>
                <span style="font-size:12px">น. ถึงเวลา :</span>
                <span class="info-value" style="max-width:50px">${formData.timeEnd}</span>
                <span style="font-size:12px">น. รวมเวลาปฏิบัติงาน</span>
                <span class="info-value" style="max-width:60px">${formData.totalHours}</span>
            </div>
            <div class="info-row-full" style="align-items:center;flex-wrap:wrap;gap:4px">
                <span style="font-size:12px">3.) พชง./ผู้ให้บริการ (ชื่อ - สกุล) :</span>
                <span class="info-value" style="max-width:150px">${formData.staffName}</span>
                <span style="font-size:12px">รวมผู้ปฏิบัติงาน จำนวน</span>
                <span class="info-value" style="max-width:30px;text-align:center">3</span>
                <span style="font-size:12px">คน</span>
            </div>
            <div class="section-label">รายการปฏิบัติงาน</div>
            <div class="section-a">
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px">
                <strong style="font-size:13px">ข้อ ก. งานตรวจสอบและแก้ไขไฟฟ้าขัดข้อง :</strong>
                <label style="font-size:12.5px;display:flex;align-items:center;gap:4px">
                    <span style="font-family: Arial; font-size:14px;">&#9744;</span> <span>ด้านแรงสูง</span>
                </label>
                <label style="font-size:12.5px;display:flex;align-items:center;gap:4px">
                    <span style="font-family: Arial; font-size:14px; font-weight:bold;">&#9745;</span> <span>ด้านแรงต่ำ</span>
                </label>
                </div>
                <div class="flex-space" style="margin:4px 0">
                <span style="font-size:12.5px">1.ค่าปลด - สับอุปกรณ์ตัดตอน</span>
                <span style="font-size:12.5px">เป็นเงิน <strong class="underline">${formData.switchFee.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong> บาท</span>
                </div>
                <div style="margin:4px 0 2px;font-size:12.5px;font-weight:600">2.ค่าบริการแก้ไขไฟฟ้าขัดข้อง แรงสูง/แรงต่ำ</div>
                <div class="flex-space" style="padding-left:16px;margin:2px 0">
                <span style="font-size:12px">- สำหรับ 30 นาทีแรก 285 บาท</span>
                <span style="font-size:12px">เป็นเงิน <strong class="underline">${first30Min.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong> บาท</span>
                </div>
                <div class="flex-space" style="padding-left:16px;margin:2px 0">
                <span style="font-size:12px">- สำหรับครึ่งชั่วโมงต่อไป</span>
                <span style="font-size:12px">เป็นเงิน <strong class="underline">${next30Min.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong> บาท</span>
                </div>
                <div class="flex-space" style="border-top:1.5px solid #333;margin-top:6px;padding-top:4px">
                <strong style="font-size:13px">รวมเป็นเงิน</strong>
                <strong style="font-size:13px"><span class="underline">${totalSectionA.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> บาท</strong>
                </div>
            </div>
            <div class="section-label">รายการพัสดุ</div>
            <div style="font-size:12.5px;margin-bottom:4px"><strong>ข้อ ข. อุปกรณ์ที่ กฟภ. นำมาใช้ในการแก้ไขกระแสไฟฟ้าขัดข้องให้ ( ลูกค้า / ผู้ใช้ไฟ )</strong></div>
            <div style="font-size:11.5px;color:#555;margin-bottom:6px">
                ( 1.) ทำราคาพัสดุ กฟภ. ให้เป็นราคาผู้ใช้ไฟ (บวก 15%) &nbsp;&nbsp; ( 2.) ค่าดำเนินการบวก 31%
            </div>
            <table class="items">
                <thead>
                <tr>
                    <th style="width:32px">ที่</th>
                    <th style="width:100px">รหัส</th>
                    <th>รายการ</th>
                    <th style="width:45px">จำนวน</th>
                    <th style="width:75px">ราคา<br>มาตราฐาน</th>
                    <th style="width:90px">ราคาผู้ใช้ไฟ / (บาท)<br>ราคา+40%</th>
                    <th style="width:60px">หมายเหตุ</th>
                </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                    <tr>
                        <td colspan="5" style="text-align:right;font-weight:700">รวม</td>
                        <td style="font-weight:700">${totalMaterialCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            <div class="summary-block">
                <div style="font-size:12px;font-weight:700;margin-bottom:6px">สรุปค่าใช้จ่าย :</div>
                <div class="sum-row">
                <span class="sum-label">1.) ค่าปลด-สับอุปกรณ์ตัดตอน</span>
                <span class="sum-code"></span>
                <span style="font-size:12px">เป็นเงิน</span>
                <span class="sum-val">${sum1.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                <span class="sum-unit">บาท</span>
                </div>
                <div class="sum-row">
                <span class="sum-label">2.) ค่าตรวจสอบและแก้ไข + ค่าพัสดุอุปกรณ์</span>
                <span class="sum-code"></span>
                <span style="font-size:12px">เป็นเงิน</span>
                <span class="sum-val">${sum2.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                <span class="sum-unit">บาท</span>
                </div>
                <div class="sum-row" style="margin-top:4px">
                <span class="sum-label" style="padding-left:16px">- รวมเป็นเงิน (ข้อ 1.+2. )</span>
                <span class="sum-code"></span>
                <span style="font-size:12px">เป็นเงิน</span>
                <span class="sum-val">${sumTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                <span class="sum-unit">บาท</span>
                </div>
                <div class="sum-row">
                <span class="sum-label" style="padding-left:16px">- รวมภาษี 7 %</span>
                <span class="sum-code"></span>
                <span style="font-size:12px">เป็นเงิน</span>
                <span class="sum-val">${vatAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                <span class="sum-unit">บาท</span>
                </div>
                <div class="sum-row" style="font-weight:700;border-top:1px solid #aaa;padding-top:4px;margin-top:4px">
                <span class="sum-label" style="padding-left:16px">- สรุป (ข้อ 1.+2. ) รวมค่าใช้จ่ายทั้งหมด</span>
                <span class="sum-code"></span>
                <span style="font-size:12px">เป็นเงิน</span>
                <span class="sum-val" style="border-bottom:2px double #111">${grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                <span class="sum-unit">บาท</span>
                </div>
            </div>
            <div class="total-final">
                <span>รวมเป็นเงินทั้งสิ้น :</span>
                <span>${grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</span>
            </div>
            <div class="grand-total-text">( ${BAHTTEXT(grandTotal)} )</div>
            <div class="sig-area">
                <div class="sig-block">
                <span class="sig-line"></span>
                <div>(ลงชื่อ)................................................ผู้ประมาณการ</div>
                <div style="margin-top:4px">( ${formData.staffName} )</div>
                <div class="sig-date">............../............/..............</div>
                </div>
                <div class="sig-block">
                <span class="sig-line"></span>
                <div>(ลงชื่อ)................................................ผู้ตรวจ</div>
                <div style="margin-top:4px">(...............................................)</div>
                <div class="sig-date">............../............/..............</div>
                </div>
            </div>
        </div>
    `;

    printArea.innerHTML = htmlContent;
    window.print();
}

function printMT1(formData) {
    const printArea = document.getElementById('printArea');
    
    const br1Str = formData.br1Info || '';
    const br1Parts = br1Str.split('/');
    const br1Book = br1Parts[0] ? br1Parts[0].trim() : '-';
    const br1No = br1Parts[1] ? br1Parts[1].trim() : br1Book;

    const mt1Section2 = formData.serviceFee + formData.materialsFee; 
    const subTotal = formData.switchFee + mt1Section2; 
    const vat = subTotal * 0.07; 
    const totalGrand = subTotal + vat; 

    const htmlContent = `
        <div class="print-doc-mt1">
          <div class="clearfix">
            <div class="header-right">
              การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม<br>
              3 ถนนอรัญญิกาวาส ต.ในเมือง<br>
              อำเภอเมือง &nbsp;จังหวัดนครพนม &nbsp;48000
            </div>
            <div class="logo-area">
              <svg class="logo-svg" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="26" fill="none" stroke="#5a2d82" stroke-width="2"/>
                <circle cx="28" cy="28" r="20" fill="none" stroke="#5a2d82" stroke-width="1.2"/>
                <text x="28" y="24" text-anchor="middle" font-size="7" fill="#5a2d82" font-family="Sarabun,sans-serif" font-weight="700">การไฟฟ้า</text>
                <text x="28" y="33" text-anchor="middle" font-size="7" fill="#5a2d82" font-family="Sarabun,sans-serif" font-weight="700">ส่วนภูมิภาค</text>
                <path d="M20 40 L28 44 L36 40" fill="none" stroke="#f5a623" stroke-width="2" stroke-linecap="round"/>
                <line x1="28" y1="36" x2="28" y2="44" stroke="#f5a623" stroke-width="2"/>
              </svg>
              <div class="org-brand">
                <span class="org-th">การไฟฟ้าส่วนภูมิภาค</span>
                <span class="org-en">PROVINCIAL ELECTRICITY AUTHORITY</span>
              </div>
            </div>
            <div class="doc-no" style="margin-top:8px">ที่ มท 5306.46/นพ.-</div>
          </div>

          <div class="date-center">${formatThaiDate(formData.serviceDate)}</div>

          <div class="subject-row">
            <span class="subject-label">เรื่อง</span>
            <span>แจ้งค่าบริการแก้กระแสไฟฟ้าขัดข้อง</span>
          </div>
          <div class="to-row">
            <span class="subject-label">เรียน</span>
            <span>${formData.customerName}</span>
          </div>

          <p class="body-text">
            ด้วยในวันที่ &nbsp;<strong>${formatThaiDate(formData.serviceDate)}</strong>&nbsp; เวลา &nbsp;<strong>${formData.timeStart} น.</strong>&nbsp; ถึงเวลา &nbsp;<strong>${formData.timeEnd} น.</strong>
            การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม ได้บริการแก้กระแสไฟฟ้าขัดข้องให้แก่
            หมายเลขผู้ใช้ไฟ <span class="underline-blank" style="min-width:120px">${formData.meterNo}</span> พร้อมออกหลักฐาน ใบบริการแก้ไขกระแสไฟฟ้าขัดข้อง ใบ บร.1
            เล่มที่ <span class="underline-blank" style="min-width:50px">${br1Book}</span> เลขที่ <span class="underline-blank" style="min-width:60px">${br1No}</span>
            เพื่อเรียกเก็บค่าใช้จ่ายในภายหลังนั้น บัดนี้ การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม
            ได้ตรวจสอบประมาณการแล้วมีค่าใช้จ่าย ดังนี้
          </p>

          <table class="amount-table" style="margin-top:10px">
            <tr>
              <td class="label">1.) ค่าปลด-สับอุปกรณ์ตัดตอน</td>
              <td class="mid">เป็นเงิน</td>
              <td class="val">${formData.switchFee.toLocaleString('en-US', {minimumFractionDigits: 2})}&nbsp;&nbsp;บาท</td>
            </tr>
            <tr>
              <td class="label">2.) ค่าตรวจสอบและแก้ไข + ค่าพัสดุอุปกรณ์</td>
              <td class="mid">เป็นเงิน</td>
              <td class="val">${mt1Section2.toLocaleString('en-US', {minimumFractionDigits: 2})}&nbsp;&nbsp;บาท</td>
            </tr>
            <tr>
              <td class="label" style="padding-left:40px">-รวมเป็นเงิน (ข้อ 1.+2. )</td>
              <td class="mid">เป็นเงิน</td>
              <td class="val">${subTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}&nbsp;&nbsp;บาท</td>
            </tr>
            <tr>
              <td class="label" style="padding-left:40px">-ภาษี 7 %</td>
              <td class="mid">เป็นเงิน</td>
              <td class="val">${vatAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}&nbsp;&nbsp;บาท</td>
            </tr>
            <tr class="grand-total-row" style="border-top:1.5px solid #333">
              <td class="label" style="padding-left:40px;font-weight:700">-สรุป (ข้อ 1.+2. ) รวมค่าใช้จ่ายทั้งหมด</td>
              <td class="mid" style="font-weight:700;text-align:center">รวมเป็นเงิน</td>
              <td class="val" style="font-weight:700;font-size:14px">${totalGrand.toLocaleString('en-US', {minimumFractionDigits: 2})}&nbsp;&nbsp;บาท</td>
            </tr>
          </table>

          <div class="baht-text">( ${BAHTTEXT(totalGrand)} )</div>

          <p class="closing">จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป จักขอบคุณยิ่ง</p>
          <p style="text-align:center;margin-top:10px;font-size:13.5px">ขอแสดงความนับถือ</p>

          <div class="sign-area">
            <div style="height:50px"></div>
            <div class="sign-name">${formData.staffName}</div>
            <div>เจ้าหน้าที่ผู้ประมาณการ กฟภ. นครพนม</div>
            <div>การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม</div>
          </div>

          <div class="footer">
            แผนกปฏิบัติการและบำรุงรักษาระบบไฟฟ้า การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม<br>
            โทร. 042-516199
          </div>
        </div>
    `;

    printArea.innerHTML = htmlContent;
    window.print();
}

// 🟢 จุดที่แก้ไขวงเล็บตกหล่น (Syntax Error: Unexpected token '}')
function formatThaiDate(dateStr) {
    if (!dateStr) return '................................';
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function BAHTTEXT(num) {
    if (isNaN(num) || num === null) return "";
    num = num.toFixed(2);
    const [numInt, numDec] = num.split(".");
    const txtNum = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
    const txtDigit = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
    let strInt = "";
    const len = numInt.length;
    for (let i = 0; i < len; i++) {
        let n = parseInt(numInt.charAt(i));
        let d = len - 1 - i;
        if (n !== 0) {
            if (d === 1 && n === 1) strInt += "สิบ";
            else if (d === 1 && n === 2) strInt += "ยี่สิบ";
            else if (d === 0 && n === 1 && len > 1) strInt += "เอ็ด";
            else strInt += txtNum[n] + txtDigit[d];
        }
    }
    if (strInt === "") strInt = "ศูนย์";
    strInt += "บาท";
    if (numDec === "00" || numDec === "0") {
        strInt += "ถ้วน";
    } else {
        let strDec = "";
        let dLen = numDec.length;
        for (let i = 0; i < dLen; i++) {
            let n = parseInt(numDec.charAt(i));
            let d = dLen - 1 - i;
            if (n !== 0) {
                if (d === 1 && n === 1) strDec += "สิบ";
                else if (d === 1 && n === 2) strDec += "ยี่สิบ";
                else if (d === 0 && n === 1 && dLen > 1 && numDec.charAt(0) !== '0') strDec += "เอ็ด";
                else strDec += txtNum[n] + txtDigit[d];
            }
        }
        strInt += strDec + "สตางค์";
    }
    return strInt;
}
