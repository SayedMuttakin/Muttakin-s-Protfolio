const mongoose = require('mongoose');

const SliderImageSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  altText: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SliderImage', SliderImageSchema);
