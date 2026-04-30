const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', TestimonialSchema);
