// ==========================================
// Report Engine: จัดการระบบพิมพ์ PDF (แก้ไข Syntax Error แล้ว)
// ==========================================

function printBR1(formData) {
    const printArea = document.getElementById('printArea');
    
    // จัดการเลขที่ บร.1 ให้ปลอดภัยจากการพิมพ์ตกหล่น
    const br1Str = formData.br1Info || '';
    const br1Parts = br1Str.split('/');
    const br1Book = br1Parts[0] ? br1Parts[0].trim() : '-';
    const br1No = br1Parts[1] ? br1Parts[1].trim() : br1Book;

    // 1. จัดการข้อมูลรายการพัสดุ
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

    if(!itemsHtml) {
        itemsHtml = '<tr><td colspan="7" style="text-align:center; color:#999; padding: 10px;">- ไม่มีรายการพัสดุ -</td></tr>';
    }

    // 2. คำนวณค่าบริการและผลรวม
    let first30Min = formData.serviceFee > 0 ? 285 : 0;
    let next30Min = formData.serviceFee > 285 ? formData.serviceFee - 285 : 0;
    let totalSectionA = formData.switchFee + formData.serviceFee;

    let sum1 = formData.switchFee;
    let sum2 = formData.serviceFee + formData.materialsFee;
    let sumTotal = sum1 + sum2;
    let vatAmount = sumTotal * 0.07;
    let grandTotal = sumTotal + vatAmount;

    // 3. สร้าง HTML Template
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
        <div style="font-family: 'Sarabun', sans-serif !important; font-size: 16px; color: #000; line-height: 1.6; padding: 0 30px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://upload.wikimedia.org/wikipedia/th/thumb/6/64/Provincial_Electricity_Authority_logo.svg/300px-Provincial_Electricity_Authority_logo.svg.png" width="60" style="margin-bottom: 5px;"><br>
                <b style="font-size: 20px;">การไฟฟ้าส่วนภูมิภาค</b><br>
                <span style="font-size: 16px;">PROVINCIAL ELECTRICITY AUTHORITY</span>
            </div>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                    <td width="50%" valign="top">ที่ มท 5306.46/นพ.</td>
                    <td width="50%" valign="top" align="right">
                        <table width="280" border="0" cellpadding="0" cellspacing="0" align="right">
                            <tr><td align="left">การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม</td></tr>
                            <tr><td align="left">3 ถนนอรัญญิกาวาส ต.ในเมือง</td></tr>
                            <tr><td align="left">อำเภอเมือง จังหวัดนครพนม 48000</td></tr>
                        </table>
                    </td>
                </tr>
            </table>
            <div style="text-align: center; margin-bottom: 20px;">
                ${formatThaiDate(formData.serviceDate)}
            </div>
            <table width="100%" border="0" cellpadding="4" cellspacing="0" style="margin-bottom: 15px;">
                <tr>
                    <td width="8%" valign="top"><b>เรื่อง</b></td>
                    <td>แจ้งค่าบริการแก้กระแสไฟฟ้าขัดข้อง</td>
                </tr>
                <tr>
                    <td valign="top"><b>เรียน</b></td>
                    <td>${formData.customerName}</td>
                </tr>
            </table>
            <div style="text-indent: 50px; text-align: justify; margin-bottom: 20px;">
                ด้วยในวันที่ ${formatThaiDate(formData.serviceDate)} เวลา ${formData.timeStart} น. ถึงเวลา ${formData.timeEnd} น.
                การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม ได้บริการแก้กระแสไฟฟ้าขัดข้องให้แก่ หมายเลขผู้ใช้ไฟ ${formData.meterNo} 
                พร้อมออกหลักฐาน ใบบริการแก้ไขกระแสไฟฟ้าขัดข้อง ใบ บร.1 เล่มที่ ${br1Book} 
                เลขที่ ${br1No} เพื่อเรียกเก็บค่าใช้จ่ายในภายหลังนั้น บัดนี้ การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม
                ได้ตรวจสอบประมาณการแล้วมีค่าใช้จ่าย ดังนี้
            </div>
            <table width="85%" border="0" cellpadding="4" cellspacing="0" align="center" style="margin-bottom: 30px;">
                <tr>
                    <td width="60%">1.) ค่าปลด-สับอุปกรณ์ตัดตอน</td>
                    <td width="15%" align="right">เป็นเงิน</td>
                    <td width="25%" align="right">${formData.switchFee.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                </tr>
                <tr>
                    <td>2.) ค่าตรวจสอบและแก้ไข + ค่าพัสดุอุปกรณ์</td>
                    <td align="right">เป็นเงิน</td>
                    <td align="right">${mt1Section2.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                </tr>
                <tr>
                    <td>- รวมเป็นเงิน (ข้อ 1.+2.)</td>
                    <td align="right">เป็นเงิน</td>
                    <td align="right">${subTotal.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                </tr>
                <tr>
                    <td>- ภาษี 7%</td>
                    <td align="right">เป็นเงิน</td>
                    <td align="right">${vat.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; padding-top: 10px;">- สรุป (ข้อ 1.+2.) รวมค่าใช้จ่ายทั้งหมด</td>
                    <td style="font-weight: bold; text-align: right; padding-top: 10px;">รวมเป็นเงิน</td>
                    <td style="font-weight: bold; text-align: right; padding-top: 10px; text-decoration: underline;">${totalGrand.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                </tr>
            </table>
            <div style="text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 60px;">
                ( ${BAHTTEXT(totalGrand)} )
            </div>
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="50%"></td>
                    <td width="50%" align="center">
                        ลงชื่อ............................................................<br>
                        ( ${formData.staffName} )<br>
                        ตำแหน่ง เจ้าหน้าที่ผู้ประมาณการ กฟภ. นครพนม
                    </td>
                </tr>
            </table>
        </div>
    `;
    printArea.innerHTML = htmlContent;
    window.print();
}

// 🟢 จุดที่ได้รับการแก้ไข Syntax Error แล้ว (เพิ่ม ']')
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
