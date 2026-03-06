import { GoogleGenAI } from "@google/genai";

// State Management
let resumeData = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  objective: '',
  experience: [],
  education: [],
  skills: '',
  photo: null
};

let currentTemplate = 'template-classic';
let isPremium = false;

// DOM Elements
const landingPage = document.getElementById('landingPage');
const builderSection = document.getElementById('builderSection');
const startBtns = document.querySelectorAll('.start-btn');
const startBuilderBtn = document.getElementById('startBuilderBtn');
const backToLanding = document.getElementById('backToLanding');
const previewContainer = document.getElementById('previewContainer');
const resumePreview = document.getElementById('resume-preview');
const templateBtns = document.querySelectorAll('.template-btn');
const darkModeToggle = document.getElementById('darkModeToggle');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const removePhotoBtn = document.getElementById('removePhotoBtn');
const photoSuggestions = document.getElementById('photoSuggestions');
const suggestionsList = document.getElementById('suggestionsList');
const prevPhotoContainer = document.getElementById('prev-photo-container');

// Initialize
function init() {
  loadFromLocalStorage();
  setupEventListeners();
  updatePreview();
}

function setupEventListeners() {
  // Navigation
  startBtns.forEach(btn => btn.addEventListener('click', showBuilder));
  startBuilderBtn.addEventListener('click', showBuilder);
  backToLanding.addEventListener('click', showLanding);

  // Form Inputs
  const inputs = ['fullName', 'email', 'phone', 'address', 'linkedin', 'objective', 'skills'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', (e) => {
      resumeData[id] = e.target.value;
      updatePreview();
    });
  });

  // Dynamic Sections
  document.getElementById('addExperienceBtn').addEventListener('click', () => addDynamicItem('experience'));
  document.getElementById('addEducationBtn').addEventListener('click', () => addDynamicItem('education'));

  // Template Switcher
  templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const template = `template-${btn.dataset.template}`;
      
      // All templates are free as per requirements
      currentTemplate = template;
      
      // Update UI
      templateBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update Preview Class
      resumePreview.className = currentTemplate;
      
      updatePreview();
      saveToLocalStorage();
    });
  });

  // AI Improve
  document.getElementById('improveObjectiveBtn').addEventListener('click', improveObjective);
  document.getElementById('improveSkillsBtn').addEventListener('click', improveSkills);

  // PDF Download
  document.getElementById('downloadPdfBtn').addEventListener('click', downloadPdf);
  if (document.getElementById('downloadPdfBtnMobile')) {
    document.getElementById('downloadPdfBtnMobile').addEventListener('click', downloadPdf);
  }

  // Payment
  document.getElementById('buyPremiumBtn').addEventListener('click', handlePayment);

  // Dark Mode
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    darkModeToggle.innerText = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
  });

  // Save Draft
  document.getElementById('saveDraftBtn').addEventListener('click', () => {
    saveToLocalStorage();
    alert('Draft saved successfully!');
  });

  // Photo Upload
  photoInput.addEventListener('change', handlePhotoUpload);
  removePhotoBtn.addEventListener('click', removePhoto);
}

function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const imgData = event.target.result;
    resumeData.photo = imgData;
    
    // Process image for suggestions
    const img = new Image();
    img.onload = () => {
      const orientation = img.width > img.height ? 'landscape' : 'portrait';
      showPhotoSuggestions(orientation);
      updatePreview();
      saveToLocalStorage();
    };
    img.src = imgData;
    
    // Update UI
    photoPreview.innerHTML = `<img src="${imgData}" alt="Profile">`;
    removePhotoBtn.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function removePhoto() {
  resumeData.photo = null;
  photoPreview.innerHTML = '<span>No Photo</span>';
  removePhotoBtn.style.display = 'none';
  photoSuggestions.style.display = 'none';
  photoInput.value = '';
  updatePreview();
  saveToLocalStorage();
}

function showPhotoSuggestions(orientation) {
  photoSuggestions.style.display = 'block';
  suggestionsList.innerHTML = '';
  
  const suggestions = [
    "Use a clear, professional background",
    "Wear formal or business-casual attire",
    "Maintain a neutral or friendly expression",
    "Avoid sunglasses, hats, or casual selfies",
    "Ensure good lighting on your face"
  ];

  if (orientation === 'landscape') {
    suggestions.unshift("Your photo is landscape. A portrait or square crop works best for resumes.");
  }

  suggestions.forEach(text => {
    const li = document.createElement('li');
    li.innerText = text;
    suggestionsList.appendChild(li);
  });
}

function showBuilder() {
  landingPage.style.display = 'none';
  builderSection.style.display = 'grid';
  window.scrollTo(0, 0);
}

function showLanding() {
  landingPage.style.display = 'block';
  builderSection.style.display = 'none';
}

function addDynamicItem(type) {
  const item = type === 'experience' 
    ? { title: '', company: '', date: '', description: '', id: Date.now() }
    : { degree: '', school: '', date: '', id: Date.now() };
  
  resumeData[type].push(item);
  renderDynamicSection(type);
  updatePreview();
}

function renderDynamicSection(type) {
  const container = document.getElementById(`${type}Container`);
  container.innerHTML = '';

  resumeData[type].forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    
    if (type === 'experience') {
      div.innerHTML = `
        <span class="remove-btn" onclick="window.removeItem('${type}', ${index})">✕</span>
        <div class="form-group">
          <input type="text" class="form-control" placeholder="Job Title" value="${item.title}" oninput="window.updateItem('${type}', ${index}, 'title', this.value)">
        </div>
        <div class="form-group">
          <input type="text" class="form-control" placeholder="Company" value="${item.company}" oninput="window.updateItem('${type}', ${index}, 'company', this.value)">
        </div>
        <div class="form-group">
          <input type="text" class="form-control" placeholder="Date (e.g. 2020 - Present)" value="${item.date}" oninput="window.updateItem('${type}', ${index}, 'date', this.value)">
        </div>
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="margin: 0; font-size: 12px;">Description</label>
            <button id="improveExpBtn-${index}" class="btn btn-outline btn-small" onclick="window.improveExperience(${index})">✨ AI Improve</button>
          </div>
          <textarea class="form-control" rows="4" placeholder="Description" oninput="window.updateItem('${type}', ${index}, 'description', this.value)">${item.description}</textarea>
        </div>
      `;
    } else {
      div.innerHTML = `
        <span class="remove-btn" onclick="window.removeItem('${type}', ${index})">✕</span>
        <div class="form-group">
          <input type="text" class="form-control" placeholder="Degree" value="${item.degree}" oninput="window.updateItem('${type}', ${index}, 'degree', this.value)">
        </div>
        <div class="form-group">
          <input type="text" class="form-control" placeholder="School" value="${item.school}" oninput="window.updateItem('${type}', ${index}, 'school', this.value)">
        </div>
        <div class="form-group">
          <input type="text" class="form-control" placeholder="Date" value="${item.date}" oninput="window.updateItem('${type}', ${index}, 'date', this.value)">
        </div>
      `;
    }
    container.appendChild(div);
  });
}

// Global window functions for dynamic items
window.updateItem = (type, index, field, value) => {
  resumeData[type][index][field] = value;
  updatePreview();
};

window.removeItem = (type, index) => {
  resumeData[type].splice(index, 1);
  renderDynamicSection(type);
  updatePreview();
};

window.improveExperience = async (index) => {
  const exp = resumeData.experience[index];
  if (!exp.description && !exp.title && !exp.company) return alert('Please enter some details first');

  const btn = document.getElementById(`improveExpBtn-${index}`);
  const originalText = btn.innerText;
  btn.innerText = 'Improving...';
  btn.disabled = true;

  const content = `Company: ${exp.company || 'N/A'}\nRole: ${exp.title || 'N/A'}\nDuration: ${exp.date || 'N/A'}\nDescription: ${exp.description || ''}`;
  const prompt = `
    You are an expert HR resume consultant.
    Rewrite the following work experience professionally:
    - Use bullet points
    - Add measurable impact
    - Use action verbs
    - Make it ATS optimized
    - Keep it realistic

    User Input:
    ${content}

    Return improved bullet points only.
  `;

  try {
    const res = await fetch('/api/ai-improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (!res.ok) throw new Error('Backend API failed');
    
    const data = await res.json();
    if (data.text) {
      resumeData.experience[index].description = data.text;
      renderDynamicSection('experience');
      updatePreview();
    } else {
      throw new Error('No text returned from AI');
    }
  } catch (error) {
    console.error("AI Improvement Error:", error);
    alert('AI Improvement failed. Please check your connection and try again.');
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
};

function updatePreview() {
  // Update Photo
  if (resumeData.photo) {
    prevPhotoContainer.style.display = 'block';
    prevPhotoContainer.innerHTML = `<img src="${resumeData.photo}" alt="Profile">`;
    
    // Apply template-specific photo classes
    prevPhotoContainer.className = 'prev-photo-container'; // Reset
    if (currentTemplate === 'template-classic') prevPhotoContainer.classList.add('photo-circle');
    if (currentTemplate === 'template-modern') prevPhotoContainer.classList.add('photo-circle');
    if (currentTemplate === 'template-minimal') prevPhotoContainer.classList.add('photo-circle', 'photo-small');
    if (currentTemplate === 'template-creative') prevPhotoContainer.classList.add('photo-rectangle');
    if (currentTemplate === 'template-executive') prevPhotoContainer.classList.add('photo-square');
    if (currentTemplate === 'template-compact') prevPhotoContainer.classList.add('photo-circle', 'photo-small');
  } else {
    prevPhotoContainer.style.display = 'none';
    prevPhotoContainer.innerHTML = '';
  }

  // Update Header
  document.getElementById('prev-name').innerText = resumeData.fullName || 'Your Name';
  const contactParts = [resumeData.email, resumeData.phone, resumeData.address, resumeData.linkedin].filter(Boolean);
  document.getElementById('prev-contact').innerText = contactParts.join(' | ') || 'Email | Phone | Address';

  // Update Objective
  const objSection = document.getElementById('prev-objective-section');
  if (resumeData.objective) {
    objSection.style.display = 'block';
    document.getElementById('prev-objective').innerText = resumeData.objective;
  } else {
    objSection.style.display = 'none';
  }

  // Update Experience
  const expSection = document.getElementById('prev-experience-section');
  const expList = document.getElementById('prev-experience-list');
  if (resumeData.experience.length > 0) {
    expSection.style.display = 'block';
    expList.innerHTML = resumeData.experience.map(exp => `
      <div class="resume-item">
        <div class="resume-item-header">
          <span class="resume-item-title">${exp.title || 'Job Title'}</span>
          <span class="resume-item-date">${exp.date || ''}</span>
        </div>
        <div class="resume-item-subtitle">${exp.company || 'Company Name'}</div>
        <p style="white-space: pre-line;">${exp.description || ''}</p>
      </div>
    `).join('');
  } else {
    expSection.style.display = 'none';
  }

  // Update Education
  const eduSection = document.getElementById('prev-education-section');
  const eduList = document.getElementById('prev-education-list');
  if (resumeData.education.length > 0) {
    eduSection.style.display = 'block';
    eduList.innerHTML = resumeData.education.map(edu => `
      <div class="resume-item">
        <div class="resume-item-header">
          <span class="resume-item-title">${edu.degree || 'Degree'}</span>
          <span class="resume-item-date">${edu.date || ''}</span>
        </div>
        <div class="resume-item-subtitle">${edu.school || 'University'}</div>
      </div>
    `).join('');
  } else {
    eduSection.style.display = 'none';
  }

  // Update Skills
  const skillSection = document.getElementById('prev-skills-section');
  if (resumeData.skills) {
    skillSection.style.display = 'block';
    document.getElementById('prev-skills').innerText = resumeData.skills;
  } else {
    skillSection.style.display = 'none';
  }

  // Handle Watermark
  const existingWatermark = resumePreview.querySelector('.watermark');
  if (existingWatermark) existingWatermark.remove();
  
  if (!isPremium) {
    const watermark = document.createElement('div');
    watermark.className = 'watermark';
    watermark.innerText = 'Built with ResumeMint 3.0';
    resumePreview.appendChild(watermark);
  }
}

async function improveObjective() {
  const objective = resumeData.objective;
  if (!objective) return alert('Please enter some text first');

  const btn = document.getElementById('improveObjectiveBtn');
  btn.innerText = 'Improving...';
  btn.disabled = true;

  const prompt = `
    You are a professional resume writer.
    Improve the following career objective to make it:
    - Professional
    - ATS-friendly
    - Impactful
    - Concise (3-4 lines)
    - Industry relevant

    User Input:
    "${objective}"

    Return only the improved version.
  `;

  try {
    const res = await fetch('/api/ai-improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (!res.ok) throw new Error('Backend API failed');
    
    const data = await res.json();
    if (data.text) {
      resumeData.objective = data.text;
      document.getElementById('objective').value = data.text;
      updatePreview();
    } else {
      throw new Error('No text returned from AI');
    }
  } catch (error) {
    console.error("AI Improvement Error:", error);
    alert('AI Improvement failed. Please check your connection and try again.');
  } finally {
    btn.innerText = '✨ AI Improve';
    btn.disabled = false;
  }
}

async function improveSkills() {
  const skills = resumeData.skills;
  if (!skills) return alert('Please enter some skills first');

  const btn = document.getElementById('improveSkillsBtn');
  btn.innerText = 'Improving...';
  btn.disabled = true;

  const prompt = `
    You are a professional resume writer.
    Improve the following skills list to make it:
    - Professional and categorized (if applicable)
    - ATS-friendly
    - Consistent in formatting
    - Industry relevant

    User Input:
    "${skills}"

    Return only the improved version as a comma-separated list or neatly categorized text.
  `;

  try {
    const res = await fetch('/api/ai-improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (!res.ok) throw new Error('Backend API failed');
    
    const data = await res.json();
    if (data.text) {
      resumeData.skills = data.text;
      document.getElementById('skills').value = data.text;
      updatePreview();
    } else {
      throw new Error('No text returned from AI');
    }
  } catch (error) {
    console.error("AI Improvement Error:", error);
    alert('AI Improvement failed. Please check your connection and try again.');
  } finally {
    btn.innerText = '✨ AI Improve';
    btn.disabled = false;
  }
}

async function downloadPdf() {
  const btn = document.getElementById('downloadPdfBtn');
  const mobileBtn = document.getElementById('downloadPdfBtnMobile');
  
  const originalBtnText = btn.innerText;
  const originalMobileBtnText = mobileBtn ? mobileBtn.innerText : '';
  
  btn.innerText = 'Generating...';
  if (mobileBtn) mobileBtn.innerText = 'Generating...';
  btn.disabled = true;
  if (mobileBtn) mobileBtn.disabled = true;

  // 1. Add export class to body to force A4 dimensions and hide UI
  document.body.classList.add('exporting-pdf');
  
  const element = document.getElementById('resume-preview');
  const filename = `Resume_${resumeData.fullName.replace(/\s+/g, '_') || 'Mint'}.pdf`;

  // 2. Configure html2pdf options
  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: { 
      scale: 3, // High quality scale as requested
      useCORS: true, 
      letterRendering: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794, // Approx 210mm in px at 96dpi, ensures consistent rendering
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true
    }
  };

  try {
    // 3. Generate PDF using html2pdf
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('PDF Error:', error);
    alert('PDF Generation failed: ' + error.message);
  } finally {
    // 4. Cleanup: Remove export class and restore UI
    document.body.classList.remove('exporting-pdf');
    
    btn.innerText = originalBtnText;
    if (mobileBtn) mobileBtn.innerText = originalMobileBtnText;
    btn.disabled = false;
    if (mobileBtn) mobileBtn.disabled = false;
    
    // Trigger a resize to fix any layout issues caused by the temporary class
    window.dispatchEvent(new Event('resize'));
  }
}

async function handlePayment() {
  try {
    const response = await fetch('/api/create-order', { method: 'POST' });
    const order = await response.json();

    const options = {
      key: "rzp_test_placeholder", // Replace with real key in production
      amount: order.amount,
      currency: "INR",
      name: "ResumeMint 3.0",
      description: "Premium Plan Upgrade",
      order_id: order.id,
      handler: async function (response) {
        const verifyRes = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status === 'success') {
          isPremium = true;
          localStorage.setItem('isPremium', 'true');
          alert('Congratulations! You are now a Premium member.');
          updatePreview();
        }
      },
      prefill: {
        name: resumeData.fullName,
        email: resumeData.email,
        contact: resumeData.phone
      },
      theme: { color: "#2563eb" }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    alert('Payment initialization failed.');
  }
}

function saveToLocalStorage() {
  localStorage.setItem('resumeData', JSON.stringify(resumeData));
  localStorage.setItem('currentTemplate', currentTemplate);
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('resumeData');
  if (saved) {
    resumeData = JSON.parse(saved);
    // Update form fields
    Object.keys(resumeData).forEach(key => {
      const el = document.getElementById(key);
      if (el && typeof resumeData[key] === 'string') {
        el.value = resumeData[key];
      }
    });
    renderDynamicSection('experience');
    renderDynamicSection('education');

    // Update Photo UI
    if (resumeData.photo) {
      photoPreview.innerHTML = `<img src="${resumeData.photo}" alt="Profile">`;
      removePhotoBtn.style.display = 'block';
    }
  }
  
  const savedTemplate = localStorage.getItem('currentTemplate');
  if (savedTemplate) {
    currentTemplate = savedTemplate;
    resumePreview.className = currentTemplate;
    // Update active button
    templateBtns.forEach(btn => {
      if (`template-${btn.dataset.template}` === currentTemplate) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  const savedPremium = localStorage.getItem('isPremium');
  if (savedPremium === 'true') {
    isPremium = true;
  }
}

init();
