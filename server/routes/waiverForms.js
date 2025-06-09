const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

// Helper function to add centered text (only for headers)
function addCenteredText(doc, text, y, fontSize = 12) {
  doc.fontSize(fontSize);
  const textWidth = doc.widthOfString(text);
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const x = doc.page.margins.left + (pageWidth - textWidth) / 2;
  doc.text(text, x, y);
  return y + fontSize + 5; // Return next Y position
}

// Helper function to add input field with proper form alignment
function addFormField(doc, label, x, y, lineLength = 180) {
  doc.fontSize(10).text(label, x, y);
  const labelWidth = doc.widthOfString(label);
  // Draw underline for input
  doc.moveTo(x + labelWidth + 5, y + 12)
     .lineTo(x + labelWidth + lineLength, y + 12)
     .stroke();
  return y + 25; // Increased spacing to prevent overlap
}

// Generate and serve PDF
router.get('/download', (req, res) => {
  // Create a new PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 60, right: 60 }
  });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=gym-waiver-form.pdf');

  // Pipe the PDF directly to the response
  doc.pipe(res);

  let currentY = 50;
  const leftMargin = 60;
  const rightMargin = 320; // Adjusted for better spacing
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Header - CENTER ALIGNED
  doc.fillColor('#2c3e50');
  currentY = addCenteredText(doc, 'FITNESS CENTER GYM', currentY, 18);
  currentY = addCenteredText(doc, 'LIABILITY WAIVER AND RELEASE FORM', currentY, 14);
  currentY += 20; // Extra space after header

  // Personal Information Section - LEFT ALIGNED
  doc.fillColor('#2c3e50').fontSize(12).text('PARTICIPANT INFORMATION', leftMargin, currentY);
  currentY += 25;

  doc.fillColor('#000000');
  // Two column layout for form fields - track both columns properly
  let leftColumnY = currentY;
  let rightColumnY = currentY;

  leftColumnY = addFormField(doc, 'Full Name:', leftMargin, leftColumnY, 200);
  rightColumnY = addFormField(doc, 'Date of Birth:', rightMargin, rightColumnY, 150);
  
  // Use the maximum Y to ensure no overlap
  currentY = Math.max(leftColumnY, rightColumnY);
  
  currentY = addFormField(doc, 'Address:', leftMargin, currentY, 400);
  
  leftColumnY = currentY;
  rightColumnY = currentY;
  leftColumnY = addFormField(doc, 'Phone:', leftMargin, leftColumnY, 180);
  rightColumnY = addFormField(doc, 'Email:', rightMargin, rightColumnY, 180);
  
  currentY = Math.max(leftColumnY, rightColumnY);
  
  leftColumnY = currentY;
  rightColumnY = currentY;
  leftColumnY = addFormField(doc, 'Emergency Contact:', leftMargin, leftColumnY, 180);
  rightColumnY = addFormField(doc, 'Emergency Phone:', rightMargin, rightColumnY, 150);
  
  currentY = Math.max(leftColumnY, rightColumnY) + 15;

  // Waiver Content Section - LEFT ALIGNED with CENTER TITLE
  doc.fillColor('#2c3e50');
  currentY = addCenteredText(doc, 'WAIVER AND RELEASE OF LIABILITY', currentY, 12);
  currentY += 5;

  const waiverText = `I acknowledge that participation in fitness activities involves inherent risks of injury including but not limited to sprains, strains, fractures, and cardiovascular complications. I voluntarily assume all risks associated with my participation and use of facilities.

I hereby release, waive, and discharge the fitness center, its owners, employees, and agents from any liability, claims, or damages arising from my participation in activities or use of facilities.

I certify that I am in good physical condition and have no medical conditions that would prevent safe participation. I agree to follow all facility rules and safety guidelines.`;

  doc.fillColor('#000000').fontSize(9);
  const waiverHeight = doc.heightOfString(waiverText, {
    width: pageWidth - 20,
    lineGap: 3
  });
  
  doc.text(waiverText, leftMargin, currentY, {
    width: pageWidth - 20,
    align: 'justify',
    lineGap: 3
  });

  currentY += waiverHeight + 20;

  // Health Screening - LEFT ALIGNED with CENTER TITLE
  doc.fillColor('#2c3e50');
  currentY = addCenteredText(doc, 'HEALTH SCREENING', currentY, 11);
  currentY += 5;

  doc.fillColor('#000000').fontSize(9);
  const questions = [
    'Do you have any heart conditions or cardiovascular disease?',
    'Do you have any injuries or physical limitations?',
    'Are you currently taking any medications?'
  ];

  questions.forEach(question => {
    doc.text(question, leftMargin, currentY);
    doc.text('☐ Yes    ☐ No', pageWidth - 80, currentY); // Better alignment
    currentY += 20; // Consistent spacing between questions
  });

  currentY += 15;

  // Photo consent - LEFT ALIGNED
  doc.text('I consent to photos/videos for promotional purposes:', leftMargin, currentY);
  doc.text('☐ Yes    ☐ No', pageWidth - 80, currentY);
  currentY += 30;

  // Signature Section - CENTER TITLE, LEFT ALIGNED CONTENT
  doc.fillColor('#2c3e50');
  currentY = addCenteredText(doc, 'ACKNOWLEDGMENT AND SIGNATURE', currentY, 12);
  currentY += 5;

  doc.fillColor('#000000').fontSize(9);
  const acknowledgmentText = 'I have read and understood this waiver and sign it voluntarily without inducement.';
  const ackHeight = doc.heightOfString(acknowledgmentText, {
    width: pageWidth - 20,
    align: 'center'
  });
  
  doc.text(acknowledgmentText, leftMargin, currentY, {
    width: pageWidth - 20,
    align: 'center'
  });
  currentY += ackHeight + 20;

  // Signature fields - LEFT ALIGNED with proper spacing
  doc.fontSize(10);
  leftColumnY = currentY;
  rightColumnY = currentY;
  leftColumnY = addFormField(doc, 'Participant Signature:', leftMargin, leftColumnY, 200);
  rightColumnY = addFormField(doc, 'Date:', rightMargin, rightColumnY, 120);
  
  currentY = Math.max(leftColumnY, rightColumnY) + 15;

  // Minor section - LEFT ALIGNED
  doc.fillColor('#2c3e50').fontSize(10).text('FOR PARTICIPANTS UNDER 18 YEARS:', leftMargin, currentY);
  currentY += 20;

  doc.fillColor('#000000');
  leftColumnY = currentY;
  rightColumnY = currentY;
  leftColumnY = addFormField(doc, 'Parent/Guardian Signature:', leftMargin, leftColumnY, 200);
  rightColumnY = addFormField(doc, 'Date:', rightMargin, rightColumnY, 120);
  
  currentY = Math.max(leftColumnY, rightColumnY) + 20;

  // Check if we need a new page for footer
  if (currentY > doc.page.height - 80) {
    doc.addPage();
    currentY = 50;
  }

  // Footer - CENTER ALIGNED
  doc.fontSize(8).fillColor('#666666');
  addCenteredText(doc, 'This waiver is valid for the duration of membership and must be renewed annually.', doc.page.height - 60, 8);

  // Finalize the PDF
  doc.end();
});

module.exports = router;