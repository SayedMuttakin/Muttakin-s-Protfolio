/**
 * Migration script: Replace localhost:5000 URLs with relative paths in MongoDB
 * Run this locally: node fix-urls.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Models (inline)
const ProjectSchema = new mongoose.Schema({ imageUrl: String }, { strict: false });
const TestimonialSchema = new mongoose.Schema({ imageUrl: String }, { strict: false });
const SliderSchema = new mongoose.Schema({ imageUrl: String }, { strict: false });

const Project = mongoose.model('Project', ProjectSchema);
const Testimonial = mongoose.model('Testimonial', TestimonialSchema);
const SliderImage = mongoose.model('SliderImage', SliderSchema);

function fixUrl(url) {
    if (!url) return url;
    // Replace http://localhost:PORT/uploads/... → /uploads/...
    return url.replace(/https?:\/\/[^/]+\/uploads\//, '/uploads/');
}

async function migrate() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!\n');

    let totalFixed = 0;

    // Fix Projects
    const projects = await Project.find({ imageUrl: /localhost/ });
    console.log(`Found ${projects.length} projects with localhost URLs`);
    for (const p of projects) {
        p.imageUrl = fixUrl(p.imageUrl);
        await p.save();
        totalFixed++;
    }

    // Fix Testimonials
    const testimonials = await Testimonial.find({ imageUrl: /localhost/ });
    console.log(`Found ${testimonials.length} testimonials with localhost URLs`);
    for (const t of testimonials) {
        t.imageUrl = fixUrl(t.imageUrl);
        await t.save();
        totalFixed++;
    }

    // Fix SliderImages
    const sliders = await SliderImage.find({ imageUrl: /localhost/ });
    console.log(`Found ${sliders.length} slider images with localhost URLs`);
    for (const s of sliders) {
        s.imageUrl = fixUrl(s.imageUrl);
        await s.save();
        totalFixed++;
    }

    console.log(`\n✅ Done! Fixed ${totalFixed} records.`);
    await mongoose.disconnect();
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
