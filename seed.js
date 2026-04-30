/**
 * seed.js - Existing portfolio data ko MongoDB-te import korbe
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./backend/models/Project');
const Testimonial = require('./backend/models/Testimonial');
const SliderImage = require('./backend/models/SliderImage');

const BASE = 'http://localhost:5000';

const projects = [
    {
        title: 'Full-Stack E-Commerce Platform',
        tags: ['React.js', 'Node.js', 'MongoDB'],
        imageUrl: `${BASE}/images/highlights/image1.webp`,
        projectUrl: 'https://github.com/'
    },
    {
        title: 'SaaS Project Management Dashboard',
        tags: ['Next.js', 'Express.js', 'SaaS'],
        imageUrl: `${BASE}/images/highlights/image2.webp`,
        projectUrl: 'https://github.com/'
    },
    {
        title: 'Real-Time Chat Application',
        tags: ['Socket.io', 'Node.js', 'React', 'MongoDB'],
        imageUrl: `${BASE}/images/highlights/image3.webp`,
        projectUrl: 'https://github.com/'
    },
    {
        title: 'Healthcare Appointment System',
        tags: ['REST API', 'JWT Auth', 'Healthcare'],
        imageUrl: `${BASE}/images/highlights/image4.webp`,
        projectUrl: 'https://github.com/'
    }
];

const testimonials = [
    {
        name: 'Mitch Brutus',
        title: 'Founder - Brutus Vanguard, Inc',
        location: 'New York, USA',
        thumbnailUrl: `${BASE}/images/testimonial/feedback-thambnail-1.webp`,
        videoUrl: `${BASE}/video/video1.mp4`
    },
    {
        name: 'Amir Arshia',
        title: 'Owner - Tech Startup',
        location: 'Kingston, Canada',
        thumbnailUrl: `${BASE}/images/testimonial/feedback-thambnail-2.webp`,
        videoUrl: `${BASE}/video/video2.mp4`
    },
    {
        name: 'Client Name',
        title: 'CEO - Digital Agency',
        location: 'London, UK',
        thumbnailUrl: `${BASE}/images/testimonial/feedback-thambnail-3.webp`,
        videoUrl: `${BASE}/video/video3.mp4`
    }
];

const sliderImages = [
    { imageUrl: `${BASE}/images/projects/project-1.png`, altText: 'E-commerce full-stack web app' },
    { imageUrl: `${BASE}/images/projects/project-2.png`, altText: 'Healthcare management dashboard' },
    { imageUrl: `${BASE}/images/projects/project-3.png`, altText: 'Real estate listing platform' },
    { imageUrl: `${BASE}/images/projects/project-4.png`, altText: 'Restaurant ordering system' },
    { imageUrl: `${BASE}/images/projects/project-5.png`, altText: 'Finance analytics web app' },
    { imageUrl: `${BASE}/images/projects/project-6.png`, altText: 'SaaS product web application' },
    { imageUrl: `${BASE}/images/projects/project-7.png`, altText: 'Business management system' },
    { imageUrl: `${BASE}/images/projects/project-8.png`, altText: 'Social media platform' },
    { imageUrl: `${BASE}/images/projects/project-9.png`, altText: 'Project 9' },
    { imageUrl: `${BASE}/images/projects/project-10.png`, altText: 'Project 10' },
    { imageUrl: `${BASE}/images/projects/project-11.png`, altText: 'Project 11' },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000
        });
        console.log('✅ MongoDB connected');

        // Clear existing data
        await Project.deleteMany({});
        await Testimonial.deleteMany({});
        await SliderImage.deleteMany({});
        console.log('🗑️  Old data cleared');

        // Insert new data
        await Project.insertMany(projects);
        console.log(`✅ ${projects.length} Projects imported`);

        await Testimonial.insertMany(testimonials);
        console.log(`✅ ${testimonials.length} Testimonials imported`);

        await SliderImage.insertMany(sliderImages);
        console.log(`✅ ${sliderImages.length} Slider Images imported`);

        console.log('\n🎉 Done! Refresh your Admin Panel to see the data.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

seed();
