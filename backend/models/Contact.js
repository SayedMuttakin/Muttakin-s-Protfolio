const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  whatsapp: { type: String },
  interestedIn: { type: String },
  budget: { type: String },
  projectDetails: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Contact', ContactSchema);
