const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  filename: String,
  fileType: String,
  filePath: String,
  uploadDate: { type: Date, default: Date.now },
});

const Pdf = mongoose.model('Pdf', pdfSchema);

module.exports = Pdf;
