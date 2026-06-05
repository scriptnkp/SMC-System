// ==========================================
// Report Engine: จัด Layout ด้วย Table 100% (ป้องกัน CSS เพี้ยนตอนพิมพ์)
// ==========================================

function printBR1(formData) {
    const printArea = document.getElementById('printArea');
    
    // สร้างแถวรายการพัสดุ พร้อมราคาหน่วยละ และ จำนวนเงิน
    let itemsHtml = '';
    formData.items.forEach((item, index) => {
        if(item.itemName) {
            itemsHtml += `
                <tr>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${index + 1}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${item.itemName}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${item.qty}</td>
                    <td style="border: 1px solid #000; text-align:right; padding: 4px;">${item.unitPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td style="border: 1px solid #000; text-align:right; padding: 4px;">${item.totalPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                </tr>
            `;
        }
    });

    // คำนวณค่าบริการย่อย
    let first30Min = formData.serviceFee > 0 ? 285 : 0;
    let next30Min = formData.serviceFee > 285 ? formData.serviceFee - 285 : 0;

    const htmlContent = `
        <div style="font-family: 'Sarabun', sans-serif !important; font-size: 15px; color: #000; line-height: 1.5; padding: 0 20px;">
            
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
                <tr>
                    <td width="50%" valign="top">การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม</td>
                    <td width="50%" valign="top" align="right">
                        <table width="350" border="0" cellpadding="0" cellspacing="0" align="right">
                            <tr>
                                <td width="160" align="left">เลขที่ใบสั่งซ่อม :</td>
                                <td align="left">................................................</td>
                            </tr>
                            <tr>
                                <td align="left">กฟฟ.</td>
                                <td align="left">กฟจ.นครพนม</td>
                            </tr>
                            <tr>
                                <td align="left">เจ้าหน้าที่ผู้ประมาณการ :</td>
                                <td align="left">${formData.staffName}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                ใบประมาณการค่าใช้จ่ายบริการแก้ไขไฟฟ้าขัดข้อง (บร.1)
            </div>
            
            <div style="text-align: right; margin-bottom: 10px;">
                วันที่: ${formatThaiDate(formData.serviceDate)}
            </div>

            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 5px;">ผู้รับบริการ</div>
            <table width="100%" border="0" cellpadding="2" cellspacing="0" style="margin-left: 20px; margin-bottom: 10px;">
                <tr>
                    <td width="60%">1.) ชื่อลูกค้า / สถานที่ผู้ใช้ไฟ : ${formData.customerName}</td>
                    <td width="40%">โทร ${formData.phone}</td>
                </tr>
                <tr>
                    <td colspan="2">2.) หมายเลขมิเตอร์ PEA. / NO : ${formData.meterNo}</td>
                </tr>
                <tr>
                    <td colspan="2">-ใบ บร.1 / เล่มที่ ${formData.br1Info.split('/')[0] || '........'} เลขที่ : ${formData.br1Info.split('/')[1] || '........'} ให้บริการเมื่อวันที่ ${formatThaiDate(formData.serviceDate)}</td>
                </tr>
                <tr>
                    <td colspan="2">- ตั้งแต่เวลา : ${formData.timeStart} น. ถึงเวลา : ${formData.timeEnd} น. รวมเวลาปฏิบัติงาน ${formData.totalHours}</td>
                </tr>
                <tr>
                    <td colspan="2">3.) พชง/ผู้ให้บริการ (ชื่อ - สกุล) : ${formData.staffName} <span style="margin-left: 40px;">รวมผู้ปฏิบัติงาน จำนวน ..... คน</span></td>
                </tr>
            </table>

            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 5px;">รายการปฏิบัติงาน</div>
            <table width="100%" border="0" cellpadding="2" cellspacing="0" style="margin-left: 20px; margin-bottom: 10px;">
                <tr>
                    <td colspan="2">
                        <span style="font-family: Arial;">&#9745;</span> ข้อ ก. งานตรวจสอบและแก้ไขไฟฟ้าขัดข้อง 
                        <span style="margin-left: 40px;"><span style="font-family: Arial;">&#9744;</span> ด้านแรงสูง</span>
                        <span style="margin-left: 20px;"><span style="font-family: Arial;">&#9745;</span> ด้านแรงต่ำ</span>
                    </td>
                </tr>
                <tr>
                    <td width="70%">1. ค่าปลด - สับอุปกรณ์ตัดตอน</td>
                    <td width="30%" align="right">เป็นเงิน ${formData.switchFee.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                </tr>
                <tr>
                    <td>2. ค่าบริการแก้ไขไฟฟ้าขัดข้อง แรงสูง/แรงต่ำ</td>
                    <td align="right"></td>
                </tr>
                <tr>
                    <td style="padding-left: 20px; color: #333;">- สำหรับ 30 นาทีแรก 285 บาท</td>
                    <td align="right">เป็นเงิน ${first30Min.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                </tr>
                <tr>
                    <td style="padding-left: 20px; color: #333;">- สำหรับครึ่งชั่วโมงต่อไป</td>
                    <td align="right">เป็นเงิน ${next30Min.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; padding-left: 20px;">รวมค่าแรงและบริการตรวจสอบแก้ไข</td>
                    <td align="right" style="font-weight: bold;">รวมเป็นเงิน ${(formData.switchFee + formData.serviceFee).toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                </tr>
            </table>

            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 5px;">รายการพัสดุ</div>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-left: 20px; margin-bottom: 5px;">
                <tr>
                    <td>ข้อ ข. อุปกรณ์ที่ กฟภ. นำมาใช้ในการแก้ไขกระแสไฟฟ้าขัดข้องให้ (ลูกค้า / ผู้ใช้ไฟ)</td>
                </tr>
                <tr>
                    <td style="padding-left: 20px;">
                        (1.) ทำราคาพัสดุ กฟภ. ให้เป็นราคาผู้ใช้ไฟ (บวก 15%)<br>
                        (2.) ค่าดำเนินการบวก 31%
                    </td>
                </tr>
            </table>

            <table width="100%" border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin-bottom: 5px;">
                <thead>
                    <tr bgcolor="#f9f9f9">
                        <th width="8%">ลำดับ</th>
                        <th width="42%">รหัสพัสดุ - ชื่อพัสดุ</th>
                        <th width="10%">จำนวน</th>
                        <th width="20%">ราคาหน่วยละ</th>
                        <th width="20%">จำนวนเงิน</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml || '<tr><td colspan="5" align="center" style="padding: 10px; color:#999;">- ไม่มีรายการพัสดุ -</td></tr>'}
                </tbody>
            </table>

            <div style="text-align: right; margin-bottom: 15px;">
                เป็นเงิน ${formData.materialsFee.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท
            </div>

            <div style="text-align: right; font-size: 18px; font-weight: bold;">
                รวมเป็นเงินทั้งสิ้น <span style="margin-left: 20px;">${formData.totalBr1.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> บาท
            </div>
        </div>
    `;

    printArea.innerHTML = htmlContent;
    window.print();
}

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

// ---------------- Helper Functions ----------------
function formatThaiDate(dateStr) {
    if (!dateStr) return '................................';
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
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