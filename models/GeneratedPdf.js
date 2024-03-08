const mongoose = require('mongoose');
const Customer = require('../models/Customer');


const generatedPdfSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  filename: String,
  fileType: {
    type: String,
    required: true
  },
  filePath: String,
});

const GeneratedPdf = mongoose.model('GeneratedPdf', generatedPdfSchema, 'generated_pdfs');

module.exports = GeneratedPdf;
