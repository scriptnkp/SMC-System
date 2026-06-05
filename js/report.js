// ==========================================
// Report Engine: จัด Layout แบบฟอร์ม บร.1 และ มท.1
// ดึงโครงสร้าง HTML/CSS ต้นฉบับจาก กฟภ. 100%
// ==========================================

function printBR1(formData) {
    const printArea = document.getElementById('printArea');
    
    // 1. จัดการข้อมูลรายการพัสดุ
    let itemsHtml = '';
    let totalMaterialCost = 0;

    formData.items.forEach((item, index) => {
        if(item.itemName) {
            // แยกรหัส และ ชื่อพัสดุ
            let code = item.itemName.split(' - ')[0] || '';
            let name = item.itemName.split(' - ')[1] || item.itemName;
            
            // ถอดราคาฐาน (ก่อนบวก 40%) กลับมาแสดงในช่อง "ราคามาตรฐาน"
            let basePrice = (item.unitPrice || 0) / 1.4;
            let rowTotal = item.totalPrice || 0;
            totalMaterialCost += rowTotal;

            itemsHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${code}</td>
                    <td class="left">${name}</td>
                    <td>${item.qty}</td>
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

    // คำนวณบล็อกสรุปเงิน (Summary Block)
    let sum1 = formData.switchFee;
    let sum2 = formData.serviceFee + formData.materialsFee;
    let sumTotal = sum1 + sum2;
    let vatAmount = sumTotal * 0.07;
    let grandTotal = sumTotal + vatAmount;

    // จัดการเลขที่ บร.1
    let br1Book = formData.br1Info.split('/')[0] || '-';
    let br1No = formData.br1Info.split('/')[1] || formData.br1Info;

    // 3. สร้าง HTML Template (รวม CSS ที่ Scope ไว้ใน #br1-print-layout ป้องกันหน้าเว็บพัง)
    const htmlContent = `
        <style>
            @media print {
                @page { size: A4 portrait; margin: 0.5in; }
                body * { visibility: hidden; }
                #printArea, #printArea * { visibility: visible; }
                #printArea { position: absolute; left: 0; top: 0; width: 100%; }
                
                #br1-print-layout { font-family:'Sarabun',sans-serif; background:#fff; max-width:720px; margin:0 auto; padding:10px 20px; font-size:13px; color:#111; line-height:1.5; }
                #br1-print-layout .header-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px; }
                #br1-print-layout .logo-area { display:flex; align-items:center; gap:10px; }
                #br1-print-layout .logo-circle { width:52px; height:52px; border:2px solid #1a3a6b; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
                #br1-print-layout .logo-inner { width:38px; height:38px; border:2px solid #1a3a6b; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:700; color:#1a3a6b; text-align:center; line-height:1.2; }
                #br1-print-layout .org-name { font-size:18px; font-weight:700; color:#1a3a6b; text-align:center; flex:1; }
                #br1-print-layout .doc-info { text-align:right; font-size:12px; line-height:1.8; min-width:210px; }
                #br1-print-layout .doc-title { text-align:center; font-size:14px; font-weight:700; border:2px solid #111; padding:5px 12px; margin:8px 0; display:inline-block; width:100%; box-sizing: border-box; }
                #br1-print-layout .section-label { font-weight:700; font-size:13px; margin:10px 0 6px; }
                #br1-print-layout .info-row-full { display:flex; gap:6px; align-items:baseline; font-size:12.5px; padding:2px 0; border-bottom:1px dotted #bbb; margin-bottom:2px; }
                #br1-print-layout .info-label { color:#444; white-space:nowrap; min-width:130px; font-size:12px; }
                #br1-print-layout .info-value { font-weight:500; border-bottom:1px solid #333; flex:1; min-width:80px; padding:0 4px; }
                #br1-print-layout .section-a { border:1px solid #888; padding:10px 12px; margin:8px 0; border-radius:2px; }
                #br1-print-layout .flex-space { display:flex; justify-content:space-between; }
                #br1-print-layout .underline { border-bottom:1px solid #333; min-width:80px; padding:0 4px; display:inline-block; text-align:right; }
                #br1-print-layout table.items { width:100%; border-collapse:collapse; font-size:12px; margin:8px 0; }
                #br1-print-layout table.items th { background:#e8e8e8; border:1px solid #888; padding:5px 6px; text-align:center; font-weight:700; }
                #br1-print-layout table.items td { border:1px solid #888; padding:4px 6px; text-align:center; }
                #br1-print-layout table.items td.left { text-align:left; }
                #br1-print-layout .summary-block { border:1px solid #888; padding:8px 12px; margin:8px 0; border-radius:2px; }
                #br1-print-layout .sum-row { display:flex; align-items:baseline; gap:6px; font-size:12.5px; padding:2px 0; }
                #br1-print-layout .sum-label { flex:1; font-size:12px; color:#333; }
                #br1-print-layout .sum-code { font-size:11px; color:#555; min-width:60px; }
                #br1-print-layout .sum-val { min-width:80px; text-align:right; font-weight:500; border-bottom:1px solid #555; padding:0 4px; }
                #br1-print-layout .sum-unit { min-width:30px; font-size:12px; }
                #br1-print-layout .total-final { display:flex; justify-content:flex-end; gap:10px; font-weight:700; font-size:13.5px; margin:8px 0 4px; padding:6px 0; border-top:2px solid #111; border-bottom:2px solid #111; }
                #br1-print-layout .grand-total-text { font-size:12.5px; text-align:center; margin:4px 0 10px; font-weight:500; }
                #br1-print-layout .sig-area { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }
                #br1-print-layout .sig-block { text-align:center; font-size:12px; }
                #br1-print-layout .sig-line { border-bottom:1px solid #555; margin:24px 20px 4px; display:block; }
                #br1-print-layout .sig-date { margin-top:4px; font-size:11.5px; color:#555; }
                #br1-print-layout .badge { background:#1a3a6b; color:#fff; font-size:11px; font-weight:700; padding:2px 8px; border-radius:2px; }
            }
        </style>

        <div id="br1-print-layout">
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


// โค้ดส่วน printMT1 และ Helper ยังคงเดิม เพื่อความต่อเนื่อง
function printMT1(formData) {
    const printArea = document.getElementById('printArea');
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
                พร้อมออกหลักฐาน ใบบริการแก้ไขกระแสไฟฟ้าขัดข้อง ใบ บร.1 เล่มที่ ${formData.br1Info.split('/')[0] || '.......'} 
                เลขที่ ${formData.br1Info.split('/')[1] || '.......'} เพื่อเรียกเก็บค่าใช้จ่ายในภายหลังนั้น บัดนี้ การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม
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
