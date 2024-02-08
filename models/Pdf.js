const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
    filename: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    filePath: {
      type: String,
      required: true
    }
  });

const Pdf = mongoose.model('Pdf', pdfSchema);

module.exports = Pdf;