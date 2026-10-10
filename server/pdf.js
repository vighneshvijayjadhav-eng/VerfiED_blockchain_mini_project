import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const verificationUrl = (base, id) => `${base.replace(/\/$/, '')}/verify/${encodeURIComponent(id)}`;
export async function certificatePdf(data, baseUrl) {
  const url = verificationUrl(baseUrl, data.credentialId);
  const qr = await QRCode.toBuffer(url, { width: 320, margin: 4, errorCorrectionLevel: 'M' });
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, info: { Title: `VerifiED ${data.credentialId}`, Author: 'PICT — DEMO', Subject: 'Academic blockchain prototype — not an official certificate' } });
  const chunks = [];
  const result = new Promise((resolve, reject) => { doc.on('data', chunk => chunks.push(chunk)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });
  const W = doc.page.width, H = doc.page.height;
  doc.rect(0, 0, W, H).fill('#FCFBF7');
  doc.lineWidth(2).rect(22, 22, W - 44, H - 44).stroke('#10233F');
  doc.lineWidth(.5).rect(29, 29, W - 58, H - 58).stroke('#B49A65');
  doc.save().strokeColor('#E4E7E7').lineWidth(.4);
  for (let i = 0; i < 20; i++) doc.ellipse(W / 2, H / 2, 160 + i * 7, 80 + i * 5).stroke();
  doc.restore();
  for (const [x,y,sx,sy] of [[38,38,1,1],[W-38,38,-1,1],[38,H-38,1,-1],[W-38,H-38,-1,-1]]) {
    doc.moveTo(x, y + sy*35).lineTo(x,y).lineTo(x+sx*35,y).lineWidth(2).stroke('#B49A65');
  }
  const center = (text, y, size, font = 'Helvetica', color = '#10233F') => doc.font(font).fontSize(size).fillColor(color).text(text, 65, y, { width: W - 130, align: 'center', lineGap: 2 });
  center('Pune Institute of Computer Technology (PICT) — DEMO', 57, 16, 'Helvetica-Bold');
  center('A C A D E M I C   R E C O R D S   •   V E R I F I E D', 84, 8, 'Helvetica', '#697887');
  center('Academic Certificate', 111, 37, 'Times-Roman');
  center('This is to certify that', 165, 11, 'Helvetica', '#697887');
  center(data.fullName, 185, data.fullName.length > 38 ? 24 : 32, 'Times-Italic');
  center('has successfully completed the academic programme recorded below', 227, 10, 'Helvetica', '#697887');
  const fields = [['DEGREE / COURSE', data.degree], ['DEPARTMENT', data.department], ['ROLL NUMBER', data.rollNumber], ['ACADEMIC YEAR', data.academicYear], ['GRADE', data.grade], ['COMPLETION DATE', data.completionDate]];
  fields.forEach(([label,value], i) => {
    const x = 86 + i % 3 * 225, y = 269 + Math.floor(i / 3) * 62;
    doc.font('Helvetica').fontSize(7).fillColor('#697887').text(label, x, y, { width: 205 });
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#10233F').text(value, x, y+16, { width: 205, height: 36 });
  });
  doc.moveTo(82, 402).lineTo(W-82,402).lineWidth(.6).stroke('#D6D9DC');
  doc.image(qr, 77, 421, { width: 92 });
  doc.font('Helvetica').fontSize(8).fillColor('#10233F').text('Scan for live status', 175, 437).font('Helvetica-Bold').text(data.credentialId, 175, 453);
  doc.font('Helvetica').fontSize(7).fillColor('#697887').text(`Issued: ${data.issuedAt}`, 175, 470, { width: 230 });
  doc.text('QR verifies registration, not PDF appearance.', 175, 486, { width: 235 });
  doc.circle(487, 464, 31).lineWidth(1).stroke('#B49A65');
  doc.circle(487, 464, 26).lineWidth(.5).stroke('#B49A65');
  doc.font('Times-Bold').fontSize(12).fillColor('#8C7343').text('DEMO', 458, 459, { width: 58, align: 'center' });
  doc.moveTo(574,467).lineTo(752,467).stroke('#10233F');
  doc.font('Helvetica').fontSize(9).fillColor('#10233F').text('Demo Authorized Issuer', 564, 478, { width: 195, align: 'center' });
  center('Academic blockchain prototype — not an official certificate', 537, 8, 'Helvetica', '#697887');
  doc.end();
  return result;
}
