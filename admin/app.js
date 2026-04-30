// Dynamic API URL — points to backend (port 5000) regardless of which server opens admin panel
const API_URL = window.location.port === '5000'
    ? `${window.location.protocol}//${window.location.host}/api`
    : 'http://localhost:5000/api';

// DOM Elements
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const mainContentArea = document.getElementById('mainContentArea');
const navBtns = document.querySelectorAll('.nav-btn');
const modalContainer = document.getElementById('modalContainer');
const modalBody = document.getElementById('modalBody');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');

// State
let token = localStorage.getItem('adminToken');
let currentSection = 'contacts';

// Init
if (token) {
    showDashboard();
    loadSection(currentSection);
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errEl = document.getElementById('loginError');
    errEl.classList.add('hidden');

    try {
        const res = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.token) {
            token = data.token;
            localStorage.setItem('adminToken', token);
            errEl.classList.add('hidden');
            showDashboard();
            loadSection('contacts');
        } else {
            errEl.textContent = data.error || 'Invalid credentials';
            errEl.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
        errEl.textContent = 'Server error. Please try again.';
        errEl.classList.remove('hidden');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    token = null;
    localStorage.removeItem('adminToken');
    dashboardView.classList.add('hide');
    loginView.classList.remove('hide');
});

function showDashboard() {
    loginView.classList.add('hide');
    dashboardView.classList.remove('hide');
}

// Navigation
navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        navBtns.forEach(b => {
            b.classList.remove('bg-purple-600/20', 'text-purple-400');
            b.classList.add('text-slate-400');
        });
        e.currentTarget.classList.add('bg-purple-600/20', 'text-purple-400');
        e.currentTarget.classList.remove('text-slate-400');
        currentSection = e.currentTarget.dataset.target;
        loadSection(currentSection);
    });
});

// Modal Logic
closeModalBtn.addEventListener('click', () => modalContainer.classList.add('hide'));
modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) modalContainer.classList.add('hide');
});

function showModal(title, contentHTML) {
    modalTitle.textContent = title;
    modalBody.innerHTML = contentHTML;
    modalContainer.classList.remove('hide');

    // Attach event listeners to all image upload fields rendered in this modal
    modalBody.querySelectorAll('.upload-drop-zone').forEach(dropZone => {
        const fieldId = dropZone.id.replace('drop-', '');
        const fileInput = document.getElementById('file-' + fieldId);
        if (!fileInput) return;

        // Click on drop zone → open file picker
        dropZone.addEventListener('click', () => fileInput.click());

        // Drag-and-drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                await processImageUpload(file, fieldId);
            } else {
                alert('Please drop an image file.');
            }
        });

        // File selected via picker
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) await processImageUpload(file, fieldId);
        });
    });
}

function closeModal() {
    modalContainer.classList.add('hide');
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, config);
    if (res.status === 401 || res.status === 403) {
        logoutBtn.click();
        throw new Error('Unauthorized');
    }
    return res.json();
}

// ─── Image Upload Helper ──────────────────────────────────────────
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/admin/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
}

// Image upload field widget
function imageUploadField(id, currentUrl = '') {
    return `
        <div class="image-upload-field" id="field-${id}">
            <div class="upload-drop-zone" id="drop-${id}">
                ${currentUrl 
                    ? `<img src="${currentUrl}" id="preview-${id}" class="upload-preview" alt="preview">`
                    : `<div id="preview-${id}" class="upload-placeholder">
                          <i class="ph ph-image text-4xl text-slate-500 mb-2 block"></i>
                          <p class="text-slate-400 text-sm">Click or drag &amp; drop to upload image</p>
                          <p class="text-slate-600 text-xs mt-1">PNG, JPG, WEBP up to 10MB</p>
                       </div>`
                }
                <div id="upload-progress-${id}" class="upload-progress-bar hidden"></div>
            </div>
            <input type="file" id="file-${id}" accept="image/*" class="hidden">
            <input type="hidden" id="img-url-${id}" value="${currentUrl}">
            <p id="upload-status-${id}" class="text-xs mt-1 text-slate-500">
                ${currentUrl ? '<span class="text-green-400">✓ Image loaded</span>' : ''}
            </p>
        </div>
    `;
}

// Render Header
function renderHeader(title, buttonText, buttonActionId) {
    return `
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold">${title}</h1>
            ${buttonText ? `<button id="${buttonActionId}" class="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><i class="ph ph-plus"></i> ${buttonText}</button>` : ''}
        </div>
    `;
}

// Action buttons helper
function actionBtns(editId, deleteEndpoint) {
    return `
        <div class="flex gap-2 mt-3">
            <button onclick="editItem('${editId}')" class="flex-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-sm py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors">
                <i class="ph ph-pencil-simple"></i> Edit
            </button>
            <button onclick="deleteItem('${deleteEndpoint}')" class="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors">
                <i class="ph ph-trash"></i> Delete
            </button>
        </div>
    `;
}

// Load Sections
async function loadSection(section) {
    mainContentArea.innerHTML = '<div class="flex justify-center items-center h-64"><i class="ph ph-spinner-gap animate-spin text-4xl text-purple-500"></i></div>';

    try {
        if (section === 'contacts') await renderContacts();
        if (section === 'projects') await renderProjects();
        if (section === 'testimonials') await renderTestimonials();
        if (section === 'slider') await renderSlider();
        if (section === 'settings') await renderSettings();
    } catch (err) {
        console.error(err);
        mainContentArea.innerHTML = `<div class="text-red-400 p-4 bg-red-900/20 rounded-xl">Failed to load data: ${err.message}</div>`;
    }
}

// ─── Render Contacts ───────────────────────────────────────────────
async function renderContacts() {
    const contacts = await apiRequest('/admin/contacts');
    let html = renderHeader('Messages', null, null);
    html += '<div class="grid gap-4">';
    contacts.forEach(c => {
        html += `
            <div class="glass-panel p-4 rounded-xl relative group">
                <h3 class="font-bold text-lg">${c.fullName || c.full_name || 'N/A'} <span class="text-sm font-normal text-slate-400">(${c.email})</span></h3>
                ${c.whatsapp ? `<p class="text-sm text-green-400 mb-2"><i class="ph ph-whatsapp-logo"></i> ${c.whatsapp}</p>` : ''}
                <div class="flex gap-2 mb-2">
                    <span class="bg-slate-800 text-xs px-2 py-1 rounded">${c.interestedIn || c.interested_in || 'N/A'}</span>
                    <span class="bg-slate-800 text-xs px-2 py-1 rounded">${c.budget || 'N/A'}</span>
                </div>
                <p class="text-slate-300 mt-2 whitespace-pre-wrap bg-slate-900/50 p-3 rounded-lg">${c.projectDetails || c.project_details || 'No details provided'}</p>
                <p class="text-xs text-slate-500 mt-2">${new Date(c.createdAt).toLocaleString()}</p>
                <button onclick="deleteItem('/admin/contacts/${c._id}')" class="absolute top-4 right-4 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded-lg text-sm transition-colors">
                    <i class="ph ph-trash"></i> Delete
                </button>
            </div>
        `;
    });
    if (contacts.length === 0) html += '<p class="text-slate-400 text-center py-16">No messages found.</p>';
    html += '</div>';
    mainContentArea.innerHTML = html;
}

// ─── Render Projects ───────────────────────────────────────────────
async function renderProjects() {
    const projects = await fetch(`${API_URL}/projects`).then(r => r.json());
    let html = renderHeader('Projects', 'Add Project', 'addProjectBtn');
    html += '<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">';
    projects.forEach(p => {
        html += `
            <div class="glass-panel rounded-xl overflow-hidden" data-id="${p._id}">
                <img src="${p.imageUrl}" alt="${p.title}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <h3 class="font-bold text-lg mb-2">${p.title}</h3>
                    <div class="flex flex-wrap gap-1 mb-1">
                        ${p.tags.map(t => `<span class="bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded">${t}</span>`).join('')}
                    </div>
                    <a href="${p.projectUrl}" target="_blank" class="text-blue-400 text-sm hover:underline block mb-2"><i class="ph ph-link"></i> Project Link</a>
                    ${actionBtns(p._id, `/admin/projects/${p._id}`)}
                </div>
            </div>
        `;
    });
    if (projects.length === 0) html += '<p class="text-slate-400 col-span-full text-center py-16">No projects found.</p>';
    html += '</div>';
    mainContentArea.innerHTML = html;

    // Store data for edit
    window._projectsData = projects;

    document.getElementById('addProjectBtn').addEventListener('click', () => {
        openProjectForm(null);
    });
}

function openProjectForm(project) {
    const isEdit = !!project;
    const form = `
        <form id="projectForm" class="space-y-4">
            <div><label class="block text-sm mb-1 text-slate-300">Title</label><input type="text" id="pTitle" required value="${isEdit ? project.title : ''}" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"></div>
            <div><label class="block text-sm mb-1 text-slate-300">Tags (comma separated)</label><input type="text" id="pTags" required value="${isEdit ? project.tags.join(', ') : ''}" placeholder="React.js, Node.js, MongoDB" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"></div>
            <div>
                <label class="block text-sm mb-1 text-slate-300">Project Image</label>
                ${imageUploadField('proj-img', isEdit ? project.imageUrl : '')}
            </div>
            <div><label class="block text-sm mb-1 text-slate-300">Project Link</label><input type="url" id="pUrl" required value="${isEdit ? project.projectUrl : ''}" placeholder="https://github.com/..." class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"></div>
            <button type="submit" id="pSubmitBtn" class="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded-lg font-medium transition-colors">${isEdit ? 'Update Project' : 'Save Project'}</button>
        </form>
    `;
    showModal(isEdit ? 'Edit Project' : 'Add Project', form);

    document.getElementById('projectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('pSubmitBtn');
        const imgUrl = document.getElementById('img-url-proj-img').value;
        if (!imgUrl) { alert('Please upload an image first!'); return; }
        btn.disabled = true;
        btn.textContent = 'Saving...';
        try {
            const payload = {
                title: document.getElementById('pTitle').value,
                tags: document.getElementById('pTags').value.split(',').map(t => t.trim()),
                imageUrl: imgUrl,
                projectUrl: document.getElementById('pUrl').value
            };
            if (isEdit) {
                await apiRequest(`/admin/projects/${project._id}`, 'PUT', payload);
            } else {
                await apiRequest('/admin/projects', 'POST', payload);
            }
            closeModal();
            loadSection('projects');
        } catch(err) {
            btn.disabled = false;
            btn.textContent = isEdit ? 'Update Project' : 'Save Project';
            alert('Error: ' + err.message);
        }
    });
}

// ─── Render Testimonials ───────────────────────────────────────────
async function renderTestimonials() {
    const items = await fetch(`${API_URL}/testimonials`).then(r => r.json());
    let html = renderHeader('Testimonials', 'Add Testimonial', 'addTestBtn');
    html += '<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">';
    items.forEach(i => {
        html += `
            <div class="glass-panel p-4 rounded-xl" data-id="${i._id}">
                <div class="flex gap-4 items-start mb-4">
                    <img src="${i.imageUrl}" class="w-full h-48 object-cover rounded-lg border-2 border-purple-500/30">
                </div>
                ${actionBtns(i._id, `/admin/testimonials/${i._id}`)}
            </div>
        `;
    });
    if (items.length === 0) html += '<p class="text-slate-400 col-span-full text-center py-16">No testimonials found.</p>';
    html += '</div>';
    mainContentArea.innerHTML = html;

    window._testimonialsData = items;

    document.getElementById('addTestBtn').addEventListener('click', () => {
        openTestimonialForm(null);
    });
}

function openTestimonialForm(item) {
    const isEdit = !!item;
    const form = `
        <form id="testForm" class="space-y-4">
            <div>
                <label class="block text-sm mb-1 text-slate-300">Review Screenshot (Portrait Recommended)</label>
                ${imageUploadField('test-review', isEdit ? item.imageUrl : '')}
            </div>
            <button type="submit" id="tSubmitBtn" class="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded-lg font-medium transition-colors">${isEdit ? 'Update Testimonial' : 'Save Testimonial'}</button>
        </form>
    `;
    showModal(isEdit ? 'Edit Testimonial' : 'Add Testimonial', form);

    document.getElementById('testForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('tSubmitBtn');
        const reviewUrl = document.getElementById('img-url-test-review').value;
        if (!reviewUrl) { alert('⚠️ প্রথমে একটি স্ক্রিনশট আপলোড করুন!'); return; }
        btn.disabled = true;
        btn.textContent = 'সেভ হচ্ছে...';
        try {
            const payload = { imageUrl: reviewUrl };
            const result = isEdit
                ? await apiRequest(`/admin/testimonials/${item._id}`, 'PUT', payload)
                : await apiRequest('/admin/testimonials', 'POST', payload);
            console.log('Testimonial saved:', result);
            closeModal();
            loadSection('testimonials');
        } catch(err) {
            btn.disabled = false;
            btn.textContent = isEdit ? 'Update Testimonial' : 'Save Testimonial';
            alert('❌ সেভ করতে সমস্যা: ' + err.message);
            console.error('Testimonial save error:', err);
        }
    });
}

// ─── Render Slider ─────────────────────────────────────────────────
async function renderSlider() {
    const items = await fetch(`${API_URL}/slider-images`).then(r => r.json());
    let html = renderHeader('Slider Images', 'Add Image', 'addSliderBtn');
    html += '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">';
    items.forEach(i => {
        html += `
            <div class="glass-panel rounded-xl overflow-hidden" data-id="${i._id}">
                <img src="${i.imageUrl}" alt="${i.altText}" class="w-full h-32 object-contain bg-slate-900/50 p-2"
                     onerror="this.parentElement.style.opacity='0.5'">
                <div class="p-3">
                    <p class="text-xs text-slate-400 truncate mb-2" title="${i.altText}">${i.altText}</p>
                    ${actionBtns(i._id, `/admin/slider-images/${i._id}`)}
                </div>
            </div>
        `;
    });
    if (items.length === 0) html += '<p class="text-slate-400 col-span-full text-center py-16">No slider images found.</p>';
    html += '</div>';
    mainContentArea.innerHTML = html;

    window._sliderData = items;

    document.getElementById('addSliderBtn').addEventListener('click', () => {
        openSliderForm(null);
    });
}

function openSliderForm(item) {
    const isEdit = !!item;
    const form = `
        <form id="sliderForm" class="space-y-4">
            <div>
                <label class="block text-sm mb-1 text-slate-300">Slider Image</label>
                ${imageUploadField('slider-img', isEdit ? item.imageUrl : '')}
            </div>
            <div><label class="block text-sm mb-1 text-slate-300">Name / Description</label><input type="text" id="sAlt" required value="${isEdit ? item.altText : ''}" placeholder="E.g., React.js, Google, Client Project" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"></div>
            <button type="submit" id="sSubmitBtn" class="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded-lg font-medium transition-colors">${isEdit ? 'Update Image' : 'Save Image'}</button>
        </form>
    `;
    showModal(isEdit ? 'Edit Slider Image' : 'Add Slider Image', form);

    document.getElementById('sliderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('sSubmitBtn');
        const imgUrl = document.getElementById('img-url-slider-img').value;
        if (!imgUrl) { alert('Please upload an image first!'); return; }
        btn.disabled = true;
        btn.textContent = 'Saving...';
        try {
            const payload = {
                imageUrl: imgUrl,
                altText: document.getElementById('sAlt').value
            };
            if (isEdit) {
                await apiRequest(`/admin/slider-images/${item._id}`, 'PUT', payload);
            } else {
                await apiRequest('/admin/slider-images', 'POST', payload);
            }
            closeModal();
            loadSection('slider');
        } catch(err) {
            btn.disabled = false;
            btn.textContent = isEdit ? 'Update Image' : 'Save Image';
            alert('Error: ' + err.message);
        }
    });
}

// ─── Render Settings ───────────────────────────────────────────────
async function renderSettings() {
    const settings = await fetch(`${API_URL}/settings`).then(r => r.json());
    let html = renderHeader('Site Settings', null, null);
    html += `
        <div class="glass-panel p-6 rounded-xl max-w-2xl">
            <form id="settingsForm" class="space-y-5">
                <div>
                    <label class="block text-sm font-medium text-slate-300 mb-1">Contact Email Address</label>
                    <input type="email" id="set-email" value="${settings.email || ''}" required 
                           class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-300 mb-1">WhatsApp Link</label>
                    <input type="url" id="set-wa" value="${settings.whatsapp || ''}" required 
                           class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500">
                    <p class="text-xs text-slate-500 mt-1">E.g., https://wa.me/+8801700000000</p>
                </div>
                <div id="settingsMessage" class="text-green-400 text-sm hidden bg-green-900/20 p-3 rounded-lg">✅ Settings saved successfully!</div>
                <button type="submit" class="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">Save Settings</button>
            </form>
        </div>
    `;
    mainContentArea.innerHTML = html;

    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            email: document.getElementById('set-email').value,
            whatsapp: document.getElementById('set-wa').value
        };
        await apiRequest('/admin/settings', 'POST', payload);
        const msg = document.getElementById('settingsMessage');
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 3000);
    });
}

// ─── Global Helpers ────────────────────────────────────────────────
window.deleteItem = async function (endpoint) {
    if (confirm('Are you sure you want to delete this item?')) {
        await apiRequest(endpoint, 'DELETE');
        loadSection(currentSection);
    }
};

window.editItem = function (id) {
    if (currentSection === 'projects') {
        const project = (window._projectsData || []).find(p => p._id === id);
        if (project) openProjectForm(project);
    } else if (currentSection === 'testimonials') {
        const item = (window._testimonialsData || []).find(t => t._id === id);
        if (item) openTestimonialForm(item);
    } else if (currentSection === 'slider') {
        const item = (window._sliderData || []).find(s => s._id === id);
        if (item) openSliderForm(item);
    }
};

// ─── File Upload Event Handlers ───────────────────────────────────
window.handleFileSelect = async function(event, fieldId) {
    const file = event.target.files[0];
    if (file) await processImageUpload(file, fieldId);
};

window.handleDrop = async function(event, fieldId) {
    event.preventDefault();
    const dropZone = document.getElementById('drop-' + fieldId);
    dropZone.classList.remove('drag-over');
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        await processImageUpload(file, fieldId);
    } else {
        alert('Please drop an image file.');
    }
};

async function processImageUpload(file, fieldId) {
    const statusEl = document.getElementById('upload-status-' + fieldId);
    const previewEl = document.getElementById('preview-' + fieldId);
    const urlInput = document.getElementById('img-url-' + fieldId);
    const dropZone = document.getElementById('drop-' + fieldId);

    if (!file) { console.error('No file provided to processImageUpload'); return; }

    console.log('Uploading file:', file.name, file.type, file.size);

    // Show uploading state
    statusEl.innerHTML = '<span class="text-yellow-400">⏳ আপলোড হচ্ছে...</span>';
    dropZone.style.opacity = '0.7';
    dropZone.style.pointerEvents = 'none';

    try {
        const url = await uploadImage(file);
        console.log('Upload success, URL:', url);
        urlInput.value = url;

        // Show preview
        if (previewEl && previewEl.tagName === 'IMG') {
            previewEl.src = url;
        } else if (previewEl) {
            const img = document.createElement('img');
            img.src = url;
            img.id = 'preview-' + fieldId;
            img.className = 'upload-preview';
            img.alt = 'preview';
            previewEl.replaceWith(img);
        }

        statusEl.innerHTML = `<span class="text-green-400">✅ আপলোড সফল: ${file.name}</span>`;
    } catch (err) {
        console.error('Upload error:', err);
        statusEl.innerHTML = `<span class="text-red-400">❌ আপলোড ব্যর্থ: ${err.message}</span>`;
        alert('ছবি আপলোড করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
        dropZone.style.opacity = '1';
        dropZone.style.pointerEvents = 'auto';
    }
}
