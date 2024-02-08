const path = require('path');
const fs = require('fs');

const generatePreview = async (req, res) => {
  try {
    // Assuming the generated PDFs are stored in the "generated_pdfs" folder
    const generatedPdfDir = path.join(__dirname, '..', 'generated_pdfs');
    const pdfFiles = await fs.promises.readdir(generatedPdfDir);

    // Generate an array of PDF preview URLs
    const pdfPreviews = pdfFiles.map(pdfFile => {
      return `/generated_pdfs/${pdfFile}`; // Assuming the server serves static files from the "generated_pdfs" folder
    });

    res.json({ success: true, data: { pdfPreviews } });
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    res.status(500).json({ success: false, error: 'Failed to generate PDF preview' });
  }
};

module.exports = { generatePreview };
