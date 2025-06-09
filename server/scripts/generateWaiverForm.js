const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure the output directory exists
const outputDir = path.join(__dirname, '../public/waiver-forms');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'gym-waiver-form.pdf');

// Create a new PDF document
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 60, right: 60 }
});

// Create write stream
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Helper function to add centered text (only for headers)
function addCenteredText(doc, text, y, fontSize = 12) {
  doc.fontSize(fontSize);
  const textWidth = doc.widthOfString(text);
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const x = doc.page.margins.left + (pageWidth - textWidth) / 2;
  return doc.text(text, x, y);
}

// Helper function to add input field with proper form alignment
function addFormField(doc, label, x, y, lineLength = 180) {
  doc.fontSize(10).text(label, x, y);
  const labelWidth = doc.widthOfString(label);
  // Draw underline for input
  doc.moveTo(x + labelWidth + 5, y + 12)
     .lineTo(x + labelWidth + lineLength, y + 12)
     .stroke();
  return y + 22;
}

let currentY = 50;
const leftMargin = 60;
const rightMargin = 300;

// Header - CENTER ALIGNED
doc.fillColor('#2c3e50');
addCenteredText(doc, 'FITNESS CENTER GYM', currentY, 18);
currentY += 25;
addCenteredText(doc, 'LIABILITY WAIVER AND RELEASE FORM', currentY, 14);
currentY += 35;

// Personal Information Section - LEFT ALIGNED
doc.fillColor('#2c3e50').fontSize(12).text('PARTICIPANT INFORMATION', leftMargin, currentY);
currentY += 20;

doc.fillColor('#000000');
// Two column layout for form fields
currentY = addFormField(doc, 'Full Name:', leftMargin, currentY, 150);
let tempY = addFormField(doc, 'Date of Birth:', rightMargin, currentY - 22, 120);
currentY = addFormField(doc, 'Address:', leftMargin, currentY, 300);
currentY = addFormField(doc, 'Phone:', leftMargin, currentY, 130);
tempY = addFormField(doc, 'Email:', rightMargin, currentY - 22, 150);
currentY = addFormField(doc, 'Emergency Contact:', leftMargin, currentY, 150);
addFormField(doc, 'Emergency Phone:', rightMargin, currentY - 22, 130);

currentY += 20;

// Waiver Content Section - LEFT ALIGNED with CENTER TITLE
doc.fillColor('#2c3e50');
addCenteredText(doc, 'WAIVER AND RELEASE OF LIABILITY', currentY, 12);
currentY += 18;

const waiverText = `I acknowledge that participation in fitness activities involves inherent risks of injury including but not limited to sprains, strains, fractures, and cardiovascular complications. I voluntarily assume all risks associated with my participation and use of facilities.

I hereby release, waive, and discharge the fitness center, its owners, employees, and agents from any liability, claims, or damages arising from my participation in activities or use of facilities.

I certify that I am in good physical condition and have no medical conditions that would prevent safe participation. I agree to follow all facility rules and safety guidelines.`;

doc.fillColor('#000000').fontSize(9).text(waiverText, leftMargin, currentY, {
  width: 480,
  align: 'justify',
  lineGap: 2
});

currentY += 85;

// Health Screening - LEFT ALIGNED with CENTER TITLE
doc.fillColor('#2c3e50');
addCenteredText(doc, 'HEALTH SCREENING', currentY, 11);
currentY += 18;

doc.fillColor('#000000').fontSize(9);
const questions = [
  'Do you have any heart conditions or cardiovascular disease?',
  'Do you have any injuries or physical limitations?',
  'Are you currently taking any medications?'
];

questions.forEach(question => {
  doc.text(question, leftMargin, currentY);
  doc.text('☐ Yes    ☐ No', 450, currentY);
  currentY += 16;
});

currentY += 10;

// Photo consent - LEFT ALIGNED
doc.text('I consent to photos/videos for promotional purposes:', leftMargin, currentY);
doc.text('☐ Yes    ☐ No', 350, currentY);
currentY += 25;

// Signature Section - CENTER TITLE, LEFT ALIGNED CONTENT
doc.fillColor('#2c3e50');
addCenteredText(doc, 'ACKNOWLEDGMENT AND SIGNATURE', currentY, 12);
currentY += 18;

doc.fillColor('#000000').fontSize(9).text('I have read and understood this waiver and sign it voluntarily without inducement.', leftMargin, currentY, {
  width: 480,
  align: 'center'
});
currentY += 20;

// Signature fields - LEFT ALIGNED
doc.fontSize(10);
currentY = addFormField(doc, 'Participant Signature:', leftMargin, currentY, 150);
addFormField(doc, 'Date:', rightMargin, currentY - 22, 100);
currentY += 10;

// Minor section - LEFT ALIGNED
doc.fillColor('#2c3e50').fontSize(10).text('FOR PARTICIPANTS UNDER 18 YEARS:', leftMargin, currentY);
currentY += 15;

doc.fillColor('#000000');
currentY = addFormField(doc, 'Parent/Guardian Signature:', leftMargin, currentY, 150);
addFormField(doc, 'Date:', rightMargin, currentY - 22, 100);

// Footer - CENTER ALIGNED
doc.fontSize(8).fillColor('#666666');
addCenteredText(doc, 'This waiver is valid for the duration of membership and must be renewed annually.', doc.page.height - 50, 8);

// Finalize the PDF
doc.end();

// Handle stream events
stream.on('finish', () => {
  console.log('Professional single-page gym waiver PDF created successfully at:', outputPath);
});

stream.on('error', (err) => {
  console.error('Error creating PDF:', err);
});