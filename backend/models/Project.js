const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tags: [{ type: String }],
  imageUrl: { type: String, required: true },
  projectUrl: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
