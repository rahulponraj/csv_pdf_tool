const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    filePath: String,
}, { collection: 'qrcodes' });

const QRCode = mongoose.model('QRCode', qrCodeSchema);

module.exports = QRCode;
