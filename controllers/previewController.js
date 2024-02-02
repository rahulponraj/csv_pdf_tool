const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');

const generatePreview = async (userList) => {
  const previews = [];

  for (const user of userList) {
    try {
      const pdfPath = `uploads/${user._id}.pdf`;

      // Load the PDF directly from the file
      const pdfBuffer = await fs.readFile(pdfPath);
      console.log(`Loaded PDF Buffer for user ID ${user._id}`);
      //console.log(`PDF Content for user ID ${user._id}:`, pdfBuffer.toString('utf8'));


      const pdfDoc = await PDFDocument.load(pdfBuffer);
      console.log(`PDF Document loaded for user ID ${user._id}`);
      console.log('PDF Buffer length:', pdfBuffer.length);
      // Generate a base64 preview
      const previewBuffer = await pdfDoc.save();
      console.log(`Saved PDF Buffer for user ID ${user._id}`);

      // Convert the buffer to base64
      const previewBase64 = previewBuffer.toString('base64');
      console.log(`Generated preview for user ID ${user._id}`);

      previews.push({ userId: user._id, preview: previewBase64 });
      console.log(`PDF Buffer for user ID ${user._id}`);
    } catch (error) {
      console.error('Error generating preview for user ID:', user._id, error);
    }
  }

  return previews;
};

module.exports = { generatePreview };
