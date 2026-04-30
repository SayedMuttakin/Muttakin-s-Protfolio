const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Models
const AdminUser = require('./backend/models/AdminUser');
const Project = require('./backend/models/Project');
const Testimonial = require('./backend/models/Testimonial');
const SliderImage = require('./backend/models/SliderImage');
const Setting = require('./backend/models/Setting');
const Contact = require('./backend/models/Contact');

const app = express();
const PORT = process.env.PORT || 5000;

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretportfoliojwtkey';

console.log('MONGODB_URI:', MONGODB_URI ? MONGODB_URI.substring(0, 40) + '...' : 'NOT FOUND!');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed!'));
    }
});

// ─── MongoDB Connection ───────────────────────────────────────────
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
})
.then(async () => {
    console.log('✅ MongoDB connected successfully');

    // Seed default admin
    const adminExists = await AdminUser.findOne({ username: 'admin' });
    if (!adminExists) {
        const hashed = await bcrypt.hash('admin123', 10);
        await AdminUser.create({ username: 'admin', password: hashed });
        console.log('✅ Default admin created: admin / admin123');
    } else {
        console.log('✅ Admin user exists in DB');
    }

    // Seed default settings
    const emailSetting = await Setting.findOne({ key: 'email' });
    if (!emailSetting) await Setting.create({ key: 'email', value: 'muttakinrahman@gmail.com' });

    const waSetting = await Setting.findOne({ key: 'whatsapp' });
    if (!waSetting) await Setting.create({ key: 'whatsapp', value: 'https://wa.me/+8801700000000' });
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
});

// ─── JWT Middleware ───────────────────────────────────────────────
const verifyToken = (req, res, next) => {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(403).json({ error: 'No token provided' });
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.userId = decoded.id;
        next();
    });
};

// ─── Async Error Wrapper ──────────────────────────────────────────
const wrap = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(err => {
        console.error('Route error:', err.message);
        res.status(500).json({ error: err.message });
    });

// ─── AUTH ─────────────────────────────────────────────────────────
app.post('/api/admin/login', wrap(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password required' });

    const user = await AdminUser.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
}));

// ─── IMAGE UPLOAD ─────────────────────────────────────────────────
app.post('/api/admin/upload', verifyToken, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
});

// ─── SETTINGS ─────────────────────────────────────────────────────
app.get('/api/settings', wrap(async (req, res) => {
    const settings = await Setting.find();
    const obj = {};
    settings.forEach(s => (obj[s.key] = s.value));
    res.json(obj);
}));

app.post('/api/admin/settings', verifyToken, wrap(async (req, res) => {
    const { email, whatsapp } = req.body;
    await Setting.findOneAndUpdate({ key: 'email' }, { value: email }, { upsert: true, new: true });
    await Setting.findOneAndUpdate({ key: 'whatsapp' }, { value: whatsapp }, { upsert: true, new: true });
    res.json({ success: true });
}));

// ─── PROJECTS ─────────────────────────────────────────────────────
app.get('/api/projects', wrap(async (req, res) => {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
}));

app.post('/api/admin/projects', verifyToken, wrap(async (req, res) => {
    const project = await Project.create(req.body);
    res.json(project);
}));

app.put('/api/admin/projects/:id', verifyToken, wrap(async (req, res) => {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
}));

app.delete('/api/admin/projects/:id', verifyToken, wrap(async (req, res) => {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true });
}));

// ─── TESTIMONIALS ─────────────────────────────────────────────────
app.get('/api/testimonials', wrap(async (req, res) => {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
}));

app.post('/api/admin/testimonials', verifyToken, wrap(async (req, res) => {
    const testimonial = await Testimonial.create(req.body);
    res.json(testimonial);
}));

app.put('/api/admin/testimonials/:id', verifyToken, wrap(async (req, res) => {
    const updated = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
}));

app.delete('/api/admin/testimonials/:id', verifyToken, wrap(async (req, res) => {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ success: true });
}));

// ─── SLIDER IMAGES ────────────────────────────────────────────────
app.get('/api/slider-images', wrap(async (req, res) => {
    const images = await SliderImage.find().sort({ createdAt: -1 });
    res.json(images);
}));

app.post('/api/admin/slider-images', verifyToken, wrap(async (req, res) => {
    const image = await SliderImage.create(req.body);
    res.json(image);
}));

app.delete('/api/admin/slider-images/:id', verifyToken, wrap(async (req, res) => {
    await SliderImage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
}));

app.put('/api/admin/slider-images/:id', verifyToken, wrap(async (req, res) => {
    const updated = await SliderImage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
}));

// ─── CONTACT ──────────────────────────────────────────────────────
app.post('/api/contact', wrap(async (req, res) => {
    await Contact.create(req.body);
    res.json({ success: true, message: 'Message sent successfully!' });
}));

app.get('/api/admin/contacts', verifyToken, wrap(async (req, res) => {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
}));

app.delete('/api/admin/contacts/:id', verifyToken, wrap(async (req, res) => {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
}));

// ─── HEALTH CHECK ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongoState: mongoose.connection.readyState,
        // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    });
});

// ─── START SERVER ─────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
