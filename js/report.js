function printBR1(formData) {
    const printArea = document.getElementById('printArea');
    let itemsHtml = '';
    formData.items.forEach((item, index) => {
        if(item.itemName) {
            itemsHtml += `
                <tr>
                    <td style="text-align:center;">${index + 1}</td>
                    <td>${item.itemName}</td>
                    <td style="text-align:center;">${item.qty}</td>
                </tr>
            `;
        }
    });

    const htmlContent = `
        <div class="gov-report br1-report">
            <div class="report-header" style="text-align: center; margin-bottom: 20px;">
                <h2>ใบประมาณการค่าใช้จ่ายบริการแก้ไขไฟฟ้าขัดข้อง (บร.1)</h2>
                <p>การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม</p>
            </div>
            
            <table class="report-meta-table">
                <tr>
                    <td><strong>เลขที่ใบสั่งซ่อม :</strong> ${formData.br1Info || '-'}</td>
                    <td><strong>กฟฟ. :</strong> นครพนม</td>
                </tr>
                <tr>
                    <td><strong>เจ้าหน้าที่ผู้ประมาณการ :</strong> ${formData.staffName}</td>
                    <td><strong>วันที่ :</strong> ${formatThaiDate(formData.serviceDate)}</td>
                </tr>
            </table>

            <div class="section-title">ข้อมูลผู้รับบริการ</div>
            <table class="report-meta-table">
                <tr>
                    <td colspan="2"><strong>1.) ชื่อลูกค้า / สถานที่ผู้ใช้ไฟ :</strong> ${formData.customerName}</td>
                </tr>
                <tr>
                    <td><strong>โทร :</strong> ${formData.phone}</td>
                    <td><strong>2.) หมายเลขมิเตอร์ PEA. / NO :</strong> ${formData.meterNo}</td>
                </tr>
                <tr>
                    <td colspan="2"><strong>ใบ บร.1 เล่มที่/เลขที่ :</strong> ${formData.br1Info}</td>
                </tr>
                <tr>
                    <td colspan="2">
                        <strong>ให้บริการเมื่อวันที่ :</strong> ${formatThaiDate(formData.serviceDate)} 
                        <strong>ตั้งแต่เวลา :</strong> ${formData.timeStart} น. 
                        <strong>ถึงเวลา :</strong> ${formData.timeEnd} น. 
                        <strong>รวมเวลาปฏิบัติงาน :</strong> ${formData.totalHours}
                    </td>
                </tr>
                <tr>
                    <td colspan="2"><strong>3.) พชง./ผู้ให้บริการ (ชื่อ-สกุล) :</strong> ${formData.staffName}</td>
                </tr>
            </table>

            <div class="section-title">รายการปฏิบัติงาน</div>
            <div style="margin-bottom: 10px;">
                <input type="checkbox" checked readonly> <strong>ข้อ ก. งานตรวจสอบและแก้ไขไฟฟ้าขัดข้อง</strong> 
                <span style="margin-left: 20px;">( ☑ ด้านแรงต่ำ / ☐ ด้านแรงสูง )</span>
            </div>
            
            <table class="report-data-table">
                <thead>
                    <tr>
                        <th style="width: 70%;">รายการ</th>
                        <th style="width: 30%; text-align: right;">เป็นเงิน (บาท)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1. ค่าปลด - สับอุปกรณ์ตัดตอน</td>
                        <td style="text-align: right;">${formData.switchFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>2. ค่าบริการแก้ไขไฟฟ้าขัดข้อง (30 นาทีแรก 285.- / ครึ่งชั่วโมงถัดไป ช่วงละ 285.-)</td>
                        <td style="text-align: right;">${formData.serviceFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>รวมค่าแรงและบริการตรวจสอบแก้ไข</strong></td>
                        <td style="text-align: right; font-weight: bold;">${(formData.switchFee + formData.serviceFee).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="section-title" style="margin-top: 20px;">ข้อ ข. รายการพัสดุอุปกรณ์ที่นำมาใช้แก้ไขขัดข้อง (+40%)</div>
            <table class="report-data-table">
                <thead>
                    <tr>
                        <th style="width: 10%; text-align:center;">ลำดับ</th>
                        <th style="width: 75%;">รหัสพัสดุ - ชื่อพัสดุ</th>
                        <th style="width: 15%; text-align:center;">จำนวน</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml || '<tr><td colspan="3" style="text-align:center; color:#999;">- ไม่มีรายการพัสดุ -</td></tr>'}
                </tbody>
            </table>

            <div style="margin-top: 15px; text-align: right; font-size: 1.1rem;">
                <strong>รวมค่าพัสดุอุปกรณ์สุทธิ:</strong> ${formData.materialsFee.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท
            </div>

            <div style="margin-top: 30px; border-top: 2px solid #000; padding-top: 10px; text-align: right; font-size: 1.2rem;">
                <strong>รวมเป็นเงินทั้งสิ้น (บร.1): <span style="text-decoration: underline; font-weight:bold;">${formData.totalBr1.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> บาท</strong>
            </div>
        </div>
    `;

    printArea.innerHTML = htmlContent;
    window.print();
}

function printMT1(formData) {
    const printArea = document.getElementById('printArea');
    const mt1Section2 = formData.switchFee + formData.serviceFee + formData.materialsFee;
    const subTotal = formData.switchFee + mt1Section2;
    const vat = subTotal * 0.07;
    const totalGrand = subTotal + vat;

    const htmlContent = `
        <div class="gov-report mt1-report">
            <div class="report-header" style="margin-bottom: 30px;">
                <div style="font-size: 1.4rem; font-weight: bold; color: #000;">การไฟฟ้าส่วนภูมิภาค</div>
                <div style="font-size: 0.9rem; letter-spacing: 1px;">PROVINCIAL ELECTRICITY AUTHORITY</div>
                <hr style="border: 1px solid #000; margin: 5px 0 20px 0;">
            </div>

            <table class="report-meta-table" style="margin-bottom: 30px;">
                <tr>
                    <td><strong>ที่ มท :</strong> 5306.46/นพ.</td>
                    <td style="text-align: right;"><strong>การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม</strong><br>3 ถนนอรัญญิกาวาส ต.ในเมือง<br>อ.เมือง จ.นครพนม 48000</td>
                </tr>
                <tr>
                    <td colspan="2" style="padding-top: 15px;"><strong>วันที่ :</strong> ${formatThaiDate(formData.serviceDate)}</td>
                </tr>
            </table>

            <div style="margin-bottom: 20px; line-height: 1.8;">
                <p><strong>เรื่อง:</strong> แจ้งค่าบริการแก้กระแสไฟฟ้าขัดข้อง</p>
                <p><strong>เรียน:</strong> ${formData.customerName}</p>
            </div>

            <div style="text-indent: 2.5cm; margin-bottom: 20px; line-height: 1.8; text-align: justify;">
                ด้วยในวันที่ ${formatThaiDate(formData.serviceDate)} ตั้งแต่เวลา ${formData.timeStart} น. ถึงเวลา ${formData.timeEnd} น. การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม ได้บริการแก้กระแสไฟฟ้าขัดข้องให้แก่ท่าน หมายเลขผู้ใช้ไฟ/หมายเลขมิเตอร์ ${formData.meterNo} พร้อมออกหลักฐานใบบริการแก้ไขกระแสไฟฟ้าขัดข้อง ใบ บร.1 เล่มที่/เลขที่ ${formData.br1Info} เพื่อเรียกเก็บค่าใช้จ่ายในภายหลังนั้น บัดนี้ การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม ได้ตรวจสอบประมาณการตามมาตรฐานแล้ว มีค่าใช้จ่ายดังนี้:
            </div>

            <table class="report-data-table" style="margin-top: 20px; margin-bottom: 20px;">
                <thead>
                    <tr>
                        <th style="width: 70%;">รายการค่าใช้จ่าย</th>
                        <th style="width: 30%; text-align: right;">เป็นเงิน (บาท)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1.) ค่าปลด-สับอุปกรณ์ตัดตอน</td>
                        <td style="text-align: right;">${formData.switchFee.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                    <tr>
                        <td>2.) ค่าตรวจสอบและแก้ไข + ค่าพัสดุอุปกรณ์ <br><small style="color:#555;">(คำนวณสัมพันธ์เชื่อมโยงจากใบ บร.1)</small></td>
                        <td style="text-align: right;">${mt1Section2.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                    <tr style="font-weight: bold; border-top: 1px solid #000;">
                        <td>รวมเป็นเงิน (ข้อ 1 + 2)</td>
                        <td style="text-align: right;">${subTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                    <tr>
                        <td>ภาษีมูลค่าเพิ่ม (VAT 7%)</td>
                        <td style="text-align: right;">${vat.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                    <tr style="font-weight: bold; font-size: 1.15rem; border-top: 2px double #000; border-bottom: 2px double #000;">
                        <td>สรุปรวมค่าใช้จ่ายทั้งหมดทั้งสิ้น</td>
                        <td style="text-align: right; text-decoration: underline;">${totalGrand.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 15px; font-weight: bold;">
                (ตัวอักษร: ${BAHTTEXT(totalGrand)})
            </div>

            <table style="width: 100%; margin-top: 60px; border: none;">
                <tr>
                    <td style="width: 50%;"></td>
                    <td style="text-align: center; line-height: 1.8;">
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
    if (!dateStr) return '-';
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
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