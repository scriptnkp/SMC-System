// ==========================================
// Report Engine: จัดการแบบฟอร์ม บร.1 และ มท.1
// จัด Layout ตามเอกสารอ้างอิงต้นฉบับ กฟภ.
// ==========================================

function printBR1(formData) {
    const printArea = document.getElementById('printArea');
    
    // จัดรายการพัสดุ
    let itemsHtml = '';
    formData.items.forEach((item, index) => {
        if(item.itemName) {
            itemsHtml += `
                <tr>
                    <td style="text-align:center; padding: 4px;">${index + 1}</td>
                    <td style="padding: 4px;">${item.itemName}</td>
                    <td style="text-align:center; padding: 4px;">${item.qty}</td>
                </tr>
            `;
        }
    });

    // โครงสร้างเอกสาร บร.1 แบบใหม่ (ตามภาพ)
    const htmlContent = `
        <div class="gov-report br1-report" style="font-size: 14pt; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="width: 50%;">การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม</div>
                <div style="width: 50%;">
                    <table style="width: 100%; border: none;">
                        <tr><td style="border: none; padding: 0;">เลขที่ใบสั่งซ่อม :</td><td style="border: none; padding: 0;">................................................</td></tr>
                        <tr><td style="border: none; padding: 0;">กฟฟ.</td><td style="border: none; padding: 0;">กฟจ.นครพนม</td></tr>
                        <tr><td style="border: none; padding: 0;">เจ้าหน้าที่ผู้ประมาณการ :</td><td style="border: none; padding: 0;">${formData.staffName}</td></tr>
                    </table>
                </div>
            </div>

            <div style="text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 5px;">
                ใบประมาณการค่าใช้จ่ายบริการแก้ไขไฟฟ้าขัดข้อง (บร.1)
            </div>
            
            <div style="text-align: right; margin-bottom: 15px;">
                วันที่: ${formatThaiDate(formData.serviceDate)}
            </div>

            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 10px;">ผู้รับบริการ</div>
            <div style="margin-left: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border: none; margin-bottom: 5px;">
                    <tr>
                        <td style="border: none; padding: 2px 0;">1.) ชื่อลูกค้า / สถานที่ผู้ใช้ไฟ : ${formData.customerName}</td>
                        <td style="border: none; padding: 2px 0;">โทร ${formData.phone}</td>
                    </tr>
                </table>
                <div style="margin-bottom: 5px;">2.) หมายเลขมิเตอร์ PEA. / NO : ${formData.meterNo}</div>
                <div style="margin-bottom: 5px;">
                    -ใบ บร.1 / เล่มที่ ${formData.br1Info.split('/')[0] || '..........'} 
                    เลขที่ : ${formData.br1Info.split('/')[1] || '..........'} 
                    ให้บริการเมื่อวันที่ ${formatThaiDate(formData.serviceDate)}
                </div>
                <div style="margin-bottom: 5px;">
                    - ตั้งแต่เวลา : ${formData.timeStart} น. 
                    ถึงเวลา : ${formData.timeEnd} น. 
                    รวมเวลาปฏิบัติงาน ${formData.totalHours} ชั่วโมง
                </div>
                <div>
                    3.) พชง/ผู้ให้บริการ (ชื่อ - สกุล) : ${formData.staffName} 
                    <span style="margin-left: 20px;">รวมผู้ปฏิบัติงาน จำนวน ..... คน</span>
                </div>
            </div>

            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 10px;">รายการปฏิบัติงาน</div>
            <div style="margin-left: 20px; margin-bottom: 20px;">
                <div style="margin-bottom: 10px;">
                    <span style="font-size: 16pt;">☑</span> ข้อ ก. งานตรวจสอบและแก้ไขไฟฟ้าขัดข้อง 
                    <span style="margin-left: 30px;"><span style="font-size: 16pt;">☐</span> ด้านแรงสูง</span>
                    <span style="margin-left: 15px;"><span style="font-size: 16pt;">☑</span> ด้านแรงต่ำ</span>
                </div>
                
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="border: none; padding: 2px 0;">1. ค่าปลด - สับอุปกรณ์ตัดตอน</td>
                        <td style="border: none; padding: 2px 0; text-align: right;">เป็นเงิน ${formData.switchFee.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="border: none; padding: 2px 0;">2. ค่าบริการแก้ไขไฟฟ้าขัดข้อง แรงสูง/แรงต่ำ</td>
                        <td style="border: none; padding: 2px 0; text-align: right;">เป็นเงิน ${formData.serviceFee.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="border: none; padding: 2px 0; padding-left: 20px; color: #555;">- สำหรับ 30 นาทีแรก 285 บาท</td>
                        <td style="border: none;"></td>
                    </tr>
                    <tr>
                        <td style="border: none; padding: 2px 0; padding-left: 20px; color: #555;">- สำหรับครึ่งชั่วโมงต่อไป (ช่วงละ 285 บาท)</td>
                        <td style="border: none;"></td>
                    </tr>
                    <tr>
                        <td style="border: none; padding: 10px 0; font-weight: bold;">รวมค่าแรงและบริการตรวจสอบแก้ไข</td>
                        <td style="border: none; padding: 10px 0; text-align: right; font-weight: bold; text-decoration: underline;">เป็นเงิน ${(formData.switchFee + formData.serviceFee).toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                </table>
            </div>

            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 10px;">รายการพัสดุ</div>
            <div style="margin-left: 20px; margin-bottom: 15px;">
                <div>ข้อ ข. อุปกรณ์ที่ กฟภ. นำมาใช้ในการแก้ไขกระแสไฟฟ้าขัดข้องให้ (ลูกค้า / ผู้ใช้ไฟ)</div>
                <div style="padding-left: 30px; font-size: 13pt; color: #333;">
                    (1.) ทำราคาพัสดุ กฟภ. ให้เป็นราคาผู้ใช้ไฟ (บวก 15%)<br>
                    (2.) ค่าดำเนินการบวก 31% <br>
                    <small><i>* รวมคิดราคาพัสดุ + 40% เรียบร้อยแล้ว</i></small>
                </div>
            </div>

            <table class="report-data-table" style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #000; width: 10%; text-align:center; padding: 5px;">ลำดับ</th>
                        <th style="border: 1px solid #000; width: 75%; text-align:center; padding: 5px;">รหัสพัสดุ - ชื่อพัสดุ</th>
                        <th style="border: 1px solid #000; width: 15%; text-align:center; padding: 5px;">จำนวน</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml || '<tr><td colspan="3" style="border: 1px solid #000; text-align:center; padding: 10px; color:#999;">- ไม่มีรายการพัสดุ -</td></tr>'}
                </tbody>
            </table>

            <div style="text-align: right; margin-top: 10px; margin-bottom: 20px;">
                เป็นเงิน ${formData.materialsFee.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท
            </div>

            <div style="text-align: right; font-size: 16pt; font-weight: bold; border-top: 2px solid #000; padding-top: 10px;">
                รวมเป็นเงินทั้งสิ้น <span style="text-decoration: underline; margin-left: 20px;">${formData.totalBr1.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> บาท
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
    const subTotal = formData.switchFee + mt1Section2; // (ข้อ 1 + 2)
    const vat = subTotal * 0.07; // ภาษี 7%
    const totalGrand = subTotal + vat; // สรุปรวม

    // โครงสร้างเอกสาร มท.1 แบบใหม่ (ตามภาพ)
    const htmlContent = `
        <div class="gov-report mt1-report" style="font-size: 15pt; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 18pt; font-weight: bold;">การไฟฟ้าส่วนภูมิภาค</div>
                <div style="font-size: 12pt;">PROVINCIAL ELECTRICITY AUTHORITY</div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div style="width: 50%;">ที่ มท 5306.46/นพ.</div>
                <div style="width: 50%; text-align: left; padding-left: 10%;">
                    <div>การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม</div>
                    <div>3 ถนนอรัญญิกาวาส ต.ในเมือง</div>
                    <div>อำเภอเมือง จังหวัดนครพนม 48000</div>
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
                ${formatThaiDate(formData.serviceDate)}
            </div>

            <div style="margin-bottom: 20px;">
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="border: none; width: 10%; vertical-align: top;"><strong>เรื่อง</strong></td>
                        <td style="border: none;">แจ้งค่าบริการแก้กระแสไฟฟ้าขัดข้อง</td>
                    </tr>
                    <tr>
                        <td style="border: none; vertical-align: top; padding-top: 10px;"><strong>เรียน</strong></td>
                        <td style="border: none; padding-top: 10px;">${formData.customerName}</td>
                    </tr>
                </table>
            </div>

            <div style="text-indent: 2.5cm; text-align: justify; margin-bottom: 30px; line-height: 1.8;">
                ด้วยในวันที่ ${formatThaiDate(formData.serviceDate)} เวลา ${formData.timeStart} น. ถึงเวลา ${formData.timeEnd} น.
                การไฟฟ้าส่วนภูมิภาค จังหวัดนครพนม ได้บริการแก้กระแสไฟฟ้าขัดข้องให้แก่ หมายเลขผู้ใช้ไฟ ${formData.meterNo} 
                พร้อมออกหลักฐาน ใบบริการแก้ไขกระแสไฟฟ้าขัดข้อง ใบ บร.1 เล่มที่ ${formData.br1Info.split('/')[0] || '.......'} 
                เลขที่ ${formData.br1Info.split('/')[1] || '.......'} เพื่อเรียกเก็บค่าใช้จ่ายในภายหลังนั้น 
                บัดนี้ การไฟฟ้าส่วนภูมิภาคจังหวัดนครพนม ได้ตรวจสอบประมาณการแล้วมีค่าใช้จ่าย ดังนี้
            </div>

            <div style="margin-left: 10%; width: 85%; margin-bottom: 30px;">
                <table style="width: 100%; border: none; line-height: 1.8;">
                    <tr>
                        <td style="border: none;">1.) ค่าปลด-สับอุปกรณ์ตัดตอน</td>
                        <td style="border: none; text-align: right; width: 15%;">เป็นเงิน</td>
                        <td style="border: none; text-align: right; width: 25%;">${formData.switchFee.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="border: none;">2.) ค่าตรวจสอบและแก้ไข + ค่าพัสดุอุปกรณ์</td>
                        <td style="border: none; text-align: right;">เป็นเงิน</td>
                        <td style="border: none; text-align: right;">${mt1Section2.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="border: none; padding-top: 10px;">- รวมเป็นเงิน (ข้อ 1.+2.)</td>
                        <td style="border: none; text-align: right; padding-top: 10px;">เป็นเงิน</td>
                        <td style="border: none; text-align: right; padding-top: 10px;">${subTotal.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="border: none;">- ภาษี 7%</td>
                        <td style="border: none; text-align: right;">เป็นเงิน</td>
                        <td style="border: none; text-align: right;">${vat.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                    <tr>
                        <td style="border: none; font-weight: bold; padding-top: 10px;">- สรุป (ข้อ 1.+2.) รวมค่าใช้จ่ายทั้งหมด</td>
                        <td style="border: none; font-weight: bold; text-align: right; padding-top: 10px;">รวมเป็นเงิน</td>
                        <td style="border: none; font-weight: bold; text-align: right; padding-top: 10px; text-decoration: underline double;">${totalGrand.toLocaleString('en-US', {minimumFractionDigits: 2})} บาท</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; font-weight: bold; margin-bottom: 60px;">
                ( ${BAHTTEXT(totalGrand)} )
            </div>

            <div style="display: flex; justify-content: flex-end;">
                <div style="text-align: center;">
                    <div>ลงชื่อ............................................................</div>
                    <div style="margin-top: 5px;">( ${formData.staffName} )</div>
                    <div style="margin-top: 5px;">ตำแหน่ง เจ้าหน้าที่ผู้ประมาณการ กฟภ. นครพนม</div>
                </div>
            </div>
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
