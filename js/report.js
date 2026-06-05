// ==========================================
// Report Engine: จัดการแบบฟอร์ม บร.1 และ มท.1
// จัด Layout แบบ Pixel-Perfect ให้ตรงกับ Microsoft Word ของ กฟภ.
// ==========================================

function printBR1(formData) {
    const printArea = document.getElementById('printArea');
    
    // จัดรายการพัสดุ
    let itemsHtml = '';
    formData.items.forEach((item, index) => {
        if(item.itemName) {
            itemsHtml += `
                <tr>
                    <td style="border: 1px solid #000; text-align:center; padding: 2px 4px;">${index + 1}</td>
                    <td style="border: 1px solid #000; padding: 2px 4px;">${item.itemName}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 2px 4px;">${item.qty}</td>
                </tr>
            `;
        }
    });

    // คำนวณค่าบริการย่อย (30 นาทีแรก กับ ส่วนเกิน)
    let first30Min = formData.serviceFee > 0 ? 285 : 0;
    let next30Min = formData.serviceFee > 285 ? formData.serviceFee - 285 : 0;

    const htmlContent = `
        <div style="font-family: 'Sarabun', sans-serif !important; font-size: 15pt; line-height: 1.3; color: #000; width: 100%; margin: 0; padding: 0;">
            
            <div style="position: relative; height: 80px; margin-bottom: 10px;">
                <div style="position: absolute; left: 0; top: 0;">การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม</div>
                <div style="position: absolute; right: 0; top: 0; width: 350px;">
                    <table style="width: 100%; border: none; padding: 0; margin: 0; line-height: 1.2;">
                        <tr><td style="width: 150px; padding: 0;">เลขที่ใบสั่งซ่อม :</td><td style="padding: 0;">.............................................</td></tr>
                        <tr><td style="padding: 0;">กฟฟ.</td><td style="padding: 0;">กฟจ.นครพนม</td></tr>
                        <tr><td style="padding: 0;">เจ้าหน้าที่ผู้ประมาณการ :</td><td style="padding: 0;">${formData.staffName}</td></tr>
                    </table>
                </div>
            </div>

            <div style="text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 5px;">
                ใบประมาณการค่าใช้จ่ายบริการแก้ไขไฟฟ้าขัดข้อง (บร.1)
            </div>
            
            <div style="text-align: right; margin-bottom: 10px;">
                วันที่: ${formatThaiDate(formData.serviceDate)}
            </div>

            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">ผู้รับบริการ</div>
            <div style="margin-left: 20px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>1.) ชื่อลูกค้า / สถานที่ผู้ใช้ไฟ : ${formData.customerName}</span>
                    <span>โทร ${formData.phone}</span>
                </div>
                <div>2.) หมายเลขมิเตอร์ PEA. / NO : ${formData.meterNo}</div>
                <div>-ใบ บร.1 / เล่มที่ ${formData.br1Info.split('/')[0] || '........'} เลขที่ : ${formData.br1Info.split('/')[1] || '........'} ให้บริการเมื่อวันที่ ${formatThaiDate(formData.serviceDate)}</div>
                <div>- ตั้งแต่เวลา : ${formData.timeStart} น. ถึงเวลา : ${formData.timeEnd} น. รวมเวลาปฏิบัติงาน ${formData.totalHours}</div>
                <div>3.) พชง/ผู้ให้บริการ (ชื่อ - สกุล) : ${formData.staffName} <span style="margin-left: 40px;">รวมผู้ปฏิบัติงาน จำนวน 3 คน</span></div>
            </div>

            <div style="font-weight: bold; text-decoration: underline; margin-top: 10px; margin-bottom: 2px;">รายการปฏิบัติงาน</div>
            <div style="margin-left: 20px;">
                <div>
                    <span style="font-family: Arial;">&#9745;</span> ข้อ ก. งานตรวจสอบและแก้ไขไฟฟ้าขัดข้อง 
                    <span style="margin-left: 30px;"><span style="font-family: Arial;">&#9744;</span> ด้านแรงสูง</span>
                    <span style="margin-left: 15px;"><span style="font-family: Arial;">&#9745;</span> ด้านแรงต่ำ</span>
                </div>
                
                <table style="width: 100%; border: none; margin-top: 2px;">
                    <tr>
                        <td style="padding: 0;">1. ค่าปลด - สับอุปกรณ์ตัดตอน</td>
                        <td style="text-align: right; padding: 0;">เป็นเงิน ${formData.switchFee.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="padding: 0;">2. ค่าบริการแก้ไขไฟฟ้าขัดข้อง แรงสูง/แรงต่ำ</td>
                        <td style="text-align: right; padding: 0;"></td>
                    </tr>
                    <tr>
                        <td style="padding: 0 0 0 20px; color: #333;">- สำหรับ 30 นาทีแรก 285 บาท</td>
                        <td style="text-align: right; padding: 0;">เป็นเงิน ${first30Min.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="padding: 0 0 0 20px; color: #333;">- สำหรับครึ่งชั่วโมงต่อไป</td>
                        <td style="text-align: right; padding: 0;">เป็นเงิน ${next30Min.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0 0 20px; font-weight: bold;">รวมค่าแรงและบริการตรวจสอบแก้ไข</td>
                        <td style="text-align: right; padding: 5px 0 0 0; font-weight: bold;">รวมเป็นเงิน ${(formData.switchFee + formData.serviceFee).toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                </table>
            </div>

            <div style="font-weight: bold; text-decoration: underline; margin-top: 10px; margin-bottom: 2px;">รายการพัสดุ</div>
            <div style="margin-left: 20px;">
                <div>ข้อ ข. อุปกรณ์ที่ กฟภ. นำมาใช้ในการแก้ไขกระแสไฟฟ้าขัดข้องให้ (ลูกค้า / ผู้ใช้ไฟ)</div>
                <div style="padding-left: 20px;">
                    (1.) ทำราคาพัสดุ กฟภ. ให้เป็นราคาผู้ใช้ไฟ (บวก 15%)<br>
                    (2.) ค่าดำเนินการบวก 31%
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #000; width: 10%; text-align:center; padding: 2px;">ลำดับ</th>
                        <th style="border: 1px solid #000; width: 75%; text-align:center; padding: 2px;">รหัสพัสดุ - ชื่อพัสดุ</th>
                        <th style="border: 1px solid #000; width: 15%; text-align:center; padding: 2px;">จำนวน</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml || '<tr><td colspan="3" style="border: 1px solid #000; text-align:center; padding: 5px; color:#999;">- ไม่มีรายการพัสดุ -</td></tr>'}
                </tbody>
            </table>

            <div style="text-align: right; margin-top: 5px;">
                เป็นเงิน ${formData.materialsFee.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท
            </div>

            <div style="text-align: right; margin-top: 15px; font-size: 16pt; font-weight: bold;">
                รวมเป็นเงินทั้งสิ้น <span style="margin-left: 20px;">${formData.totalBr1.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> บาท
            </div>
        </div>
    `;

    printArea.innerHTML = htmlContent;
    window.print();
}


function printMT1(formData) {
    const printArea = document.getElementById('printArea');
    
    // คำนวณตามสูตร มท.1
    const mt1Section2 = formData.serviceFee + formData.materialsFee; 
    const subTotal = formData.switchFee + mt1Section2; 
    const vat = subTotal * 0.07; 
    const totalGrand = subTotal + vat; 

    const htmlContent = `
        <div style="font-family: 'Sarabun', sans-serif !important; font-size: 16pt; line-height: 1.4; color: #000; width: 100%; margin: 0; padding: 0;">
            
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://upload.wikimedia.org/wikipedia/th/thumb/6/64/Provincial_Electricity_Authority_logo.svg/300px-Provincial_Electricity_Authority_logo.svg.png" style="width: 60px; height: auto; margin-bottom: 5px;">
                <div style="font-size: 18pt; font-weight: bold; line-height: 1.2;">การไฟฟ้าส่วนภูมิภาค</div>
                <div style="font-size: 14pt; line-height: 1.2;">PROVINCIAL ELECTRICITY AUTHORITY</div>
            </div>

            <div style="position: relative; height: 80px;">
                <div style="position: absolute; left: 0; top: 0;">ที่ มท 5306.46/นพ.</div>
                <div style="position: absolute; right: 0; top: 0; width: 350px;">
                    การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม<br>
                    3 ถนนอรัญญิกาวาส ต.ในเมือง<br>
                    อำเภอเมือง จังหวัดนครพนม 48000
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 20px;">
                ${formatThaiDate(formData.serviceDate)}
            </div>

            <table style="width: 100%; border: none; margin-bottom: 10px;">
                <tr>
                    <td style="width: 70px; vertical-align: top; padding: 0; font-weight: bold;">เรื่อง</td>
                    <td style="padding: 0;">แจ้งค่าบริการแก้กระแสไฟฟ้าขัดข้อง</td>
                </tr>
                <tr>
                    <td style="vertical-align: top; padding: 5px 0 0 0; font-weight: bold;">เรียน</td>
                    <td style="padding: 5px 0 0 0;">${formData.customerName}</td>
                </tr>
            </table>

            <div style="text-indent: 2.5cm; text-align: justify; margin-bottom: 20px; line-height: 1.6;">
                ด้วยในวันที่ ${formatThaiDate(formData.serviceDate)} เวลา ${formData.timeStart} น. ถึงเวลา ${formData.timeEnd} น.
                การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม ได้บริการแก้กระแสไฟฟ้าขัดข้องให้แก่ หมายเลขผู้ใช้ไฟ ${formData.meterNo} 
                พร้อมออกหลักฐาน ใบบริการแก้ไขกระแสไฟฟ้าขัดข้อง ใบ บร.1 เล่มที่ ${formData.br1Info.split('/')[0] || '.......'} 
                เลขที่ ${formData.br1Info.split('/')[1] || '.......'} เพื่อเรียกเก็บค่าใช้จ่ายในภายหลังนั้น บัดนี้ การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม
                ได้ตรวจสอบประมาณการแล้วมีค่าใช้จ่าย ดังนี้
            </div>

            <div style="margin-left: 40px;">
                <table style="width: 90%; border: none; line-height: 1.6;">
                    <tr>
                        <td style="padding: 0;">1.) ค่าปลด-สับอุปกรณ์ตัดตอน</td>
                        <td style="text-align: right; width: 80px; padding: 0;">เป็นเงิน</td>
                        <td style="text-align: right; width: 120px; padding: 0;">${formData.switchFee.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="padding: 0;">2.) ค่าตรวจสอบและแก้ไข + ค่าพัสดุอุปกรณ์</td>
                        <td style="text-align: right; padding: 0;">เป็นเงิน</td>
                        <td style="text-align: right; padding: 0;">${mt1Section2.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="padding: 0;">- รวมเป็นเงิน (ข้อ 1.+2.)</td>
                        <td style="text-align: right; padding: 0;">เป็นเงิน</td>
                        <td style="text-align: right; padding: 0;">${subTotal.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="padding: 0;">- ภาษี 7%</td>
                        <td style="text-align: right; padding: 0;">เป็นเงิน</td>
                        <td style="text-align: right; padding: 0;">${vat.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; padding: 5px 0 0 0;">- สรุป (ข้อ 1.+2.) รวมค่าใช้จ่ายทั้งหมด</td>
                        <td style="font-weight: bold; text-align: right; padding: 5px 0 0 0;">รวมเป็นเงิน</td>
                        <td style="font-weight: bold; text-align: right; padding: 5px 0 0 0;">${totalGrand.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; font-weight: bold; margin-top: 20px;">
                ( ${BAHTTEXT(totalGrand)} )
            </div>

            <div style="position: relative; height: 100px; margin-top: 60px;">
                <div style="position: absolute; right: 0; text-align: center; width: 350px;">
                    ลงชื่อ............................................................<br>
                    ( ${formData.staffName} )<br>
                    ตำแหน่ง เจ้าหน้าที่ผู้ประมาณการ กฟภ. นครพนม
                </div>
            </div>
        </div>
    `;

    printArea.innerHTML = htmlContent;
    window.print();
}

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
