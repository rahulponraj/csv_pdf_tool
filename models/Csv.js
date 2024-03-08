const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const csvSchema = new Schema({
  filename: String,
  fileType: String,
  filePath: String,
  uploadDate: { type: Date, default: Date.now }
});

const Csv = mongoose.model('Csv', csvSchema);

module.exports = Csv; 
