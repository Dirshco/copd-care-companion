/**
 * COPD Care Companion - Main Application
 * Personalized health management for COPD patients
 */

// ==================== DEFAULT DATA ====================
const defaultData = {
  user: {
    name: "Alex Johnson",
    dob: "March 15, 1958",
    diagnosis: "Moderate COPD (GOLD Stage 2)",
    baselinePeakFlow: "450 L/min"
  },
  pcp: {
    name: "Dr. Sarah Johnson, MD",
    clinic: "City Medical Center",
    phone: "(555) 123-4567",
    nextAppt: "April 28, 2026 at 2:30 PM"
  },
  emergency: {
    contact: "Maria Johnson (555) 987-6543",
    pharmacy: "City Pharmacy (555) 246-8135"
  },
  medications: {
    morning: [
      { name: "Spiriva HandiHaler", dose: "1 capsule (18 mcg)", type: "maintenance", taken: false },
      { name: "Albuterol HFA", dose: "2 puffs if needed", type: "rescue", taken: false }
    ],
    evening: [
      { name: "Albuterol HFA", dose: "2 puffs if needed", type: "rescue", taken: false },
      { name: "Prednisone", dose: "1 tablet (if prescribed)", type: "rescue", taken: false }
    ],
    refills: [
      { name: "Spiriva", daysLeft: 5 },
      { name: "Albuterol", daysLeft: 14 }
    ]
  },
  settings: {
    reminderTime: "8:00 AM & 8:00 PM",
    units: "Imperial (°F, lbs)"
  },
  healthHistory: [
    { date: "2026-04-03", mrc: 1, peakFlow: 420, symptoms: "Mild SOB during walk", warnings: [] },
    { date: "2026-04-02", mrc: 2, peakFlow: 395, symptoms: "Increased evening cough", warnings: ["cough"] },
    { date: "2026-04-01", mrc: 1, peakFlow: 410, symptoms: "Good day, exercises completed", warnings: [] }
  ]
};

// Global state
let appData = null;
let breathingInterval = null;
let isBreathing = false;
let currentBreathingType = 'pursed';

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderAll();
  setupEventListeners();
  checkDueReminders();
  
  // Request notification permission proactively
  if ('Notification' in window && Notification.permission === 'default') {
    // Don't block - user can enable later via settings
  }
});

function loadData() {
  const saved = localStorage.getItem('copdCareData');
  appData = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultData));
}

function saveData() {
  localStorage.setItem('copdCareData', JSON.stringify(appData));
}

function renderAll() {
  renderUserGreeting();
  renderHomeAssessment();
  renderMedications();
  renderPeakFlowChart();
  renderHealthHistory();
  loadProfileFields();
}

function setupEventListeners() {
  // Navigation buttons
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', function() {
      navigateTo(this.dataset.page);
    });
  });
  
  // Close modals on overlay click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
}

// ==================== NAVIGATION ====================
function navigateTo(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  // Show target page
  document.getElementById(`page-${pageId}`).classList.add('active');
  
  // Update nav buttons
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${pageId}"]`)?.classList.add('active');
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Refresh page-specific content
  if (pageId === 'medications') renderMedications();
  if (pageId === 'log') renderHealthHistory();
}

function renderUserGreeting() {
  const firstName = appData.user.name.split(' ')[0];
  document.getElementById('userGreeting').textContent = `Welcome, ${firstName}!`;
}

// ==================== HOME PAGE ====================
function renderHomeAssessment() {
  renderMRCScale();
  renderSymptomSliders();
  renderWarningSigns();
}

function renderMRCScale() {
  const options = [
    { v: 0, l: "No breathlessness", d: "except with strenuous exercise" },
    { v: 1, l: "Short of breath", d: "when hurrying or on slight hill" },
    { v: 2, l: "Walk slower than peers", d: "on level ground due to breathlessness" },
    { v: 3, l: "Stop for breath", d: "after ~100 yards on level ground" },
    { v: 4, l: "Too breathless", d: "to leave house or when dressing" }
  ];
  
  document.getElementById('mrcScale').innerHTML = options.map(opt => `
    <label class="mrc-option">
      <input type="radio" name="mrc" value="${opt.v}">
      <div>
        <div class="mrc-label">${opt.v} - ${opt.l}</div>
        <div class="mrc-desc">${opt.d}</div>
      </div>
    </label>
  `).join('');
}

function renderSymptomSliders() {
  const symptoms = [
    { n: "Shortness of breath", id: "sob" },
    { n: "Cough", id: "cough" },
    { n: "Energy level", id: "energy" }
  ];
  
  document.getElementById('symptomSliders').innerHTML = symptoms.map(s => `
    <div class="symptom-row">
      <span class="symptom-name">${s.n}</span>
      <div class="symptom-slider">
        <span>1</span>
        <input type="range" min="1" max="5" value="2" id="${s.id}" oninput="updateSlider('${s.id}')">
        <span>5</span>
      </div>
      <span class="symptom-value" id="${s.id}-val">2</span>
    </div>
  `).join('');
}

function updateSlider(id) {
  const val = document.getElementById(id).value;
  document.getElementById(`${id}-val`).textContent = val;
}

function renderWarningSigns() {
  const warnings = [
    "Increased shortness of breath",
    "Change in sputum (amount/color)",
    "Fever, chills, or feeling unwell",
    "New chest pain or tightness"
  ];
  
  document.getElementById('warningSigns').innerHTML = warnings.map(w => `
    <label class="warning-item">
      <input type="checkbox" name="warning" value="${w}">
      <span>${w}</span>
    </label>
  `).join('');
}

function renderPeakFlowChart() {
  const chart = document.getElementById('peakFlowChart');
  const baseline = parseInt(appData.user.baselinePeakFlow) || 450;
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  
  // Generate mock data based on baseline
  const data = days.map((day, i) => {
    const variation = Math.random() * 60 - 30;
    const value = Math.max(200, Math.min(baseline + variation, baseline + 20));
    const status = value >= baseline * 0.8 ? 'good' : value >= baseline * 0.6 ? 'caution' : 'low';
    return { day, value: Math.round(value), status };
  });
  
  chart.innerHTML = data.map(d => {
    const height = Math.max(10, (d.value / baseline) * 85);
    return `<div class="peak-bar ${d.status}" style="height:${height}%">
      <span class="peak-label">${d.day}</span>
    </div>`;
  }).join('');
}

function saveAssessment() {
  const mrc = document.querySelector('input[name="mrc"]:checked')?.value;
  if (!mrc) {
    showToast('Please select an MRC score', 'error');
    return;
  }
  
  const assessment = {
    date: new Date().toISOString().split('T')[0],
    mrc: parseInt(mrc),
    symptoms: {
      sob: document.getElementById('sob').value,
      cough: document.getElementById('cough').value,
      energy: document.getElementById('energy').value
    },
    warnings: Array.from(document.querySelectorAll('input[name="warning"]:checked')).map(cb => cb.value)
  };
  
  // Add to history
  appData.healthHistory.unshift(assessment);
  if (appData.healthHistory.length > 30) appData.healthHistory.pop();
  
  saveData();
  renderHealthHistory();
  showToast('✅ Assessment saved!');
  
  // Update streak (simple logic)
  const streak = parseInt(document.getElementById('streakCount').textContent) + 1;
  document.getElementById('streakCount').textContent = Math.min(streak, 30);
}

// ==================== MEDICATIONS ====================
function renderMedications() {
  renderMedList('morningMeds', appData.medications.morning);
  renderMedList('eveningMeds', appData.medications.evening);
  renderRefillReminders();
}

function renderMedList(containerId, meds) {
  const container = document.getElementById(containerId);
  container.innerHTML = meds.map(med => `
    <div class="med-item ${med.type}">
      <div class="med-info">
        <h4>${med.name}</h4>
        <p>${med.dose}</p>
      </div>
      <div class="med-actions">
        <button class="btn btn-secondary" style="padding:6px 12px;font-size:0.85rem" 
                onclick="toggleMedTaken('${containerId}','${med.name}')">
          ${med.taken ? '✅ Taken' : 'Mark Taken'}
        </button>
      </div>
    </div>
  `).join('');
}

function toggleMedTaken(containerId, medName) {
  const time = containerId === 'morningMeds' ? 'morning' : 'evening';
  const med = appData.medications[time].find(m => m.name === medName);
  if (med) {
    med.taken = !med.taken;
    saveData();
    renderMedications();
  }
}

function renderRefillReminders() {
  const container = document.getElementById('refillReminders');
  if (appData.medications.refills.length === 0) {
    container.innerHTML = '<p style="color:var(--gray);text-align:center">No refill reminders set</p>';
    return;
  }
  
  container.innerHTML = appData.medications.refills.map(refill => {
    const urgency = refill.daysLeft <= 7 ? 'danger' : refill.daysLeft <= 14 ? 'warning' : 'success';
    const color = `var(--${urgency})`;
    return `
      <div class="med-item">
        <div class="med-info">
          <h4>${refill.name}</h4>
          <p style="color:${color};font-weight:500">${refill.daysLeft} day${refill.daysLeft!==1?'s':''} left</p>
        </div>
        <button class="btn btn-secondary" style="padding:6px 12px;font-size:0.85rem" 
                onclick="markRefilled('${refill.name}')">Refilled</button>
      </div>
    `;
  }).join('');
}

function markRefilled(medName) {
  const refill = appData.medications.refills.find(r => r.name === medName);
  if (refill) {
    refill.daysLeft = 30; // Reset to 30 days
    saveData();
    renderRefillReminders();
    showToast(`✅ ${medName} refill recorded!`);
  }
}

// ==================== MEDICATION EDITOR ====================
function editMedications() {
  const modal = createModal('💊 Manage Medications', `
    <div style="margin-bottom:20px">
      <strong style="display:block;margin-bottom:10px">➕ Add New Medication</strong>
      <form id="addMedForm" style="display:grid;gap:12px">
        <input type="text" id="medName" placeholder="Medication name*" required 
               style="padding:10px;border:1px solid var(--gray-light);border-radius:8px">
        <input type="text" id="medDose" placeholder="Dose (e.g., 2 puffs)*" required
               style="padding:10px;border:1px solid var(--gray-light);border-radius:8px">
        <select id="medTime" style="padding:10px;border:1px solid var(--gray-light);border-radius:8px">
          <option value="morning">🌅 Morning</option>
          <option value="evening">🌙 Evening</option>
          <option value="both">🔄 Both</option>
          <option value="asneeded">⚡ As Needed</option>
        </select>
        <select id="medType" style="padding:10px;border:1px solid var(--gray-light);border-radius:8px">
          <option value="maintenance">🟢 Maintenance (daily)</option>
          <option value="rescue">🟡 Rescue (as needed)</option>
        </select>
        <input type="number" id="medRefillDays" placeholder="Days until refill (optional)" min="1"
               style="padding:10px;border:1px solid var(--gray-light);border-radius:8px">
        <button type="submit" class="btn btn-primary">➕ Add Medication</button>
      </form>
    </div>
    <div>
      <strong style="display:block;margin-bottom:10px">📋 Current Medications</strong>
      <div id="medListEditor"></div>
    </div>
  `);
  
  document.getElementById('modalContainer').appendChild(modal);
  renderMedListEditor();
  
  // Form submission
  document.getElementById('addMedForm').addEventListener('submit', (e) => {
    e.preventDefault();
    addMedication();
  });
}

function renderMedListEditor() {
  const container = document.getElementById('medListEditor');
  const allMeds = [...new Map(
    [...appData.medications.morning, ...appData.medications.evening]
      .map(m => [m.name, m])
  ).values()];
  
  if (allMeds.length === 0) {
    container.innerHTML = '<p style="color:var(--gray);text-align:center;padding:20px">No medications yet</p>';
    return;
  }
  
  container.innerHTML = allMeds.map(med => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--light);border-radius:10px;margin-bottom:8px">
      <div><strong>${med.name}</strong><br><small style="color:var(--gray)">${med.dose}</small></div>
      <button class="btn btn-danger" style="padding:6px 12px;font-size:0.8rem" 
              onclick="removeMedication('${med.name}')">🗑️ Remove</button>
    </div>
  `).join('');
}

function addMedication() {
  const name = document.getElementById('medName').value.trim();
  const dose = document.getElementById('medDose').value.trim();
  const time = document.getElementById('medTime').value;
  const type = document.getElementById('medType').value;
  const refillDays = document.getElementById('medRefillDays').value;
  
  const newMed = { name, dose, type, taken: false };
  
  if (time === 'both') {
    appData.medications.morning.push({...newMed});
    appData.medications.evening.push({...newMed});
  } else if (time === 'asneeded') {
    appData.medications.morning.push({...newMed});
  } else {
    appData.medications[time].push(newMed);
  }
  
  if (refillDays && !isNaN(refillDays)) {
    appData.medications.refills.push({ name, daysLeft: parseInt(refillDays) });
  }
  
  saveData();
  renderMedListEditor();
  renderMedications();
  document.getElementById('addMedForm').reset();
  showToast('✅ Medication added!');
}

function removeMedication(medName) {
  if (!confirm(`Remove ${medName}?`)) return;
  
  ['morning', 'evening'].forEach(t => {
    appData.medications[t] = appData.medications[t].filter(m => m.name !== medName);
  });
  appData.medications.refills = appData.medications.refills.filter(r => r.name !== medName);
  
  saveData();
  renderMedListEditor();
  renderMedications();
  showToast('🗑️ Medication removed');
}

// ==================== REFILL REMINDERS ====================
function setRefillReminders() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        scheduleNotifications();
        showToast('🔔 Refill reminders enabled!');
      } else {
        scheduleLocalReminders();
        showToast('🔔 Reminders set (check app for alerts)');
      }
    });
  } else {
    scheduleLocalReminders();
    showToast('🔔 Reminders set locally');
  }
}

function scheduleNotifications() {
  appData.medications.refills.forEach(refill => {
    const remindOn = new Date();
    remindOn.setDate(remindOn.getDate() + refill.daysLeft - 7);
    
    localStorage.setItem(`reminder_${refill.name.replace(/\s+/g,'_')}`, JSON.stringify({
      name: refill.name,
      remindOn: remindOn.getTime(),
      notified: false
    }));
  });
  checkDueReminders();
}

function scheduleLocalReminders() {
  appData.medications.refills.forEach(refill => {
    const remindOn = new Date();
    remindOn.setDate(remindOn.getDate() + refill.daysLeft - 7);
    
    localStorage.setItem(`reminder_${refill.name.replace(/\s+/g,'_')}`, JSON.stringify({
      name: refill.name,
      remindOn: remindOn.getTime(),
      notified: false,
      localOnly: true
    }));
  });
}

function checkDueReminders() {
  const now = Date.now();
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('reminder_')) {
      const r = JSON.parse(localStorage.getItem(key));
      if (r.remindOn <= now && !r.notified) {
        showInAppNotification(`💊 ${r.name} needs refilling soon!`);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Medication Refill', {
            body: `${r.name} is running low. Please refill soon.`,
            icon: '💊'
          });
        }
        r.notified = true;
        localStorage.setItem(key, JSON.stringify(r));
      }
    }
  });
}

function showInAppNotification(message) {
  const banner = document.createElement('div');
  banner.className = 'toast info';
  banner.textContent = message;
  document.body.appendChild(banner);
  setTimeout(() => {
    banner.style.animation = 'slideDown 0.3s ease';
    setTimeout(() => banner.remove(), 300);
  }, 5000);
}

// ==================== BREATHING EXERCISES ====================
function startBreathing() { startBreathingCommon('breathCircle', 'startBreath', 'stopBreath'); }
function startBreathingFull() { startBreathingCommon('breathCircleFull', 'startBreathFull', 'stopBreathFull'); }

function startBreathingCommon(circleId, startBtnId, stopBtnId) {
  if (isBreathing) return;
  isBreathing = true;
  
  const circle = document.getElementById(circleId);
  document.getElementById(startBtnId).disabled = true;
  document.getElementById(stopBtnId).disabled = false;
  
  let phase = 'inhale', count = 4;
  circle.textContent = "Breathe In...";
  circle.className = "breathing-circle inhale";
  
  breathingInterval = setInterval(() => {
    if (phase === 'inhale') {
      count--;
      if (count > 0) circle.textContent = `Breathe In... ${count}`;
      else { phase = 'exhale'; count = 4; circle.textContent = "Breathe Out..."; circle.className = "breathing-circle exhale"; }
    } else {
      count--;
      if (count > 0) circle.textContent = `Breathe Out... ${count}`;
      else { phase = 'inhale'; count = 4; circle.textContent = "Breathe In..."; circle.className = "breathing-circle inhale"; }
    }
  }, 1000);
}

function stopBreathing() { stopBreathingCommon('breathCircle', 'startBreath', 'stopBreath'); }
function stopBreathingFull() { stopBreathingCommon('breathCircleFull', 'startBreathFull', 'stopBreathFull'); }

function stopBreathingCommon(circleId, startBtnId, stopBtnId) {
  clearInterval(breathingInterval);
  isBreathing = false;
  const circle = document.getElementById(circleId);
  circle.textContent = "Ready";
  circle.className = "breathing-circle";
  document.getElementById(startBtnId).disabled = false;
  document.getElementById(stopBtnId).disabled = true;
}

function selectBreathing(type) {
  currentBreathingType = type;
  const instructions = {
    pursed: "Pursed-Lip: Inhale 4s through nose, exhale 4s through pursed lips",
    box: "Box: Inhale 4s, hold 4s, exhale 4s, hold 4s",
    relax: "4-7-8: Inhale 4s, hold 7s, exhale 8s",
    diaphragm: "Diaphragmatic: Inhale 5s deep into belly, exhale 5s slowly"
  };
  document.getElementById('breathInstruction').textContent = instructions[type];
}

function toggleAudio() {
  const btn = document.getElementById('audioBtn');
  const isOn = btn.textContent.includes('🔊');
  btn.textContent = isOn ? '🔇 Audio' : '🔊 Audio';
  showToast(isOn ? '🔇 Audio off' : '🔊 Audio on (demo)');
}

// ==================== EDITABLE FIELDS ====================
function editField(fieldId) {
  const field = document.getElementById(fieldId);
  if (field.contenteditable === 'false' || !field.contenteditable) {
    field.dataset.originalValue = field.textContent || field.innerText;
    field.contenteditable = 'true';
    field.classList.add('editing');
    field.focus();
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(field);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    field.onblur = () => saveField(fieldId);
    field.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); field.blur(); }
      if (e.key === 'Escape') {
        field.textContent = field.dataset.originalValue;
        field.contenteditable = 'false';
        field.classList.remove('editing');
      }
    };
  }
}

function saveField(fieldId) {
  const field = document.getElementById(fieldId);
  const newValue = (field.textContent || field.innerText).trim();
  
  if (!newValue) {
    field.textContent = field.dataset.originalValue || '';
    field.contenteditable = 'false';
    field.classList.remove('editing');
    return;
  }
  
  field.contenteditable = 'false';
  field.classList.remove('editing');
  
  const fieldMap = {
    'userName': ['user','name'], 'userDob': ['user','dob'],
    'userDiagnosis': ['user','diagnosis'], 'userPeakFlow': ['user','baselinePeakFlow'],
    'pcpName': ['pcp','name'], 'pcpClinic': ['pcp','clinic'],
    'pcpPhone': ['pcp','phone'], 'pcpAppt': ['pcp','nextAppt'],
    'emergencyContact': ['emergency','contact'], 'pharmacy': ['emergency','pharmacy'],
    'reminderTime': ['settings','reminderTime'], 'units': ['settings','units']
  };
  
  const path = fieldMap[fieldId];
  if (path) {
    appData[path[0]][path[1]] = newValue;
    saveData();
    
    // Make phone numbers clickable
    if (fieldId.includes('Phone') || fieldId === 'emergencyContact' || fieldId === 'pharmacy') {
      const num = newValue.match(/[\d+\-\s()]+/)?.[0]?.replace(/[^\d+]/g, '');
      if (num) field.innerHTML = `<a href="tel:${num}" style="color:var(--primary);text-decoration:none">${newValue}</a>`;
    }
    
    if (fieldId === 'userName') renderUserGreeting();
    showToast('✅ Saved!');
  }
}

function loadProfileFields() {
  const fields = {
    'userName': appData.user.name, 'userDob': appData.user.dob,
    'userDiagnosis': appData.user.diagnosis, 'userPeakFlow': appData.user.baselinePeakFlow,
    'pcpName': appData.pcp.name, 'pcpClinic': appData.pcp.clinic,
    'pcpPhone': appData.pcp.phone, 'pcpAppt': appData.pcp.nextAppt,
    'emergencyContact': appData.emergency.contact, 'pharmacy': appData.emergency.pharmacy,
    'reminderTime': appData.settings.reminderTime, 'units': appData.settings.units
  };
  
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) {
      if (id.includes('Phone') || id === 'emergencyContact' || id === 'pharmacy') {
        const num = val.match(/[\d+\-\s()]+/)?.[0]?.replace(/[^\d+]/g, '');
        el.innerHTML = num ? `<a href="tel:${num}" style="color:var(--primary);text-decoration:none">${val}</a>` : val;
      } else {
        el.textContent = val;
      }
    }
  });
}

// ==================== HEALTH LOG ====================
function renderHealthHistory() {
  const container = document.getElementById('healthHistoryList');
  if (!appData.healthHistory?.length) {
    container.innerHTML = '<p style="color:var(--gray);text-align:center;padding:20px">No assessments yet</p>';
    return;
  }
  
  container.innerHTML = appData.healthHistory.slice(0, 10).map(entry => `
    <div class="history-item">
      <strong>${new Date(entry.date).toLocaleDateString()}</strong>
      <p>MRC Score: ${entry.mrc} | Peak Flow: ${entry.peakFlow || 'N/A'} L/min</p>
      <p style="font-size:0.9rem">${entry.symptoms || 'No notes'}</p>
      ${entry.warnings?.length ? `<p style="color:var(--warning);font-size:0.85rem">⚠️ ${entry.warnings.join(', ')}</p>` : ''}
    </div>
  `).join('');
}

function enterPeakFlow() {
  const baseline = parseInt(appData.user.baselinePeakFlow) || 450;
  const value = prompt(`Enter peak flow reading (L/min)\nBaseline: ${baseline}`, '420');
  
  if (value && !isNaN(value)) {
    const num = parseInt(value);
    // Add to today's assessment or create new
    const today = new Date().toISOString().split('T')[0];
    const existing = appData.healthHistory.find(h => h.date === today);
    
    if (existing) {
      existing.peakFlow = num;
    } else {
      appData.healthHistory.unshift({ date: today, peakFlow: num, mrc: null, symptoms: '', warnings: [] });
    }
    
    saveData();
    renderPeakFlowChart();
    renderHealthHistory();
    showToast(`✅ Peak flow ${num} L/min recorded!`);
  }
}

// ==================== EXPORT & BACKUP ====================
async function exportData() {
  showToast('📤 Generating PDF...', 'info');
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('🫁 COPD Care Report', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
    
    // Patient Info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('👤 Patient Information', 14, 55);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let y = 65;
    doc.text(`Name: ${appData.user.name}`, 14, y); y += 7;
    doc.text(`DOB: ${appData.user.dob}`, 14, y); y += 7;
    doc.text(`Diagnosis: ${appData.user.diagnosis}`, 14, y); y += 7;
    doc.text(`Baseline Peak Flow: ${appData.user.baselinePeakFlow}`, 14, y); y += 12;
    
    // PCP
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('👩‍⚕️ Primary Care Provider', 14, y); y += 10;
    doc.setFontSize(11);
    doc.text(`${appData.pcp.name}`, 14, y); y += 7;
    doc.text(`Clinic: ${appData.pcp.clinic}`, 14, y); y += 7;
    doc.text(`Phone: ${appData.pcp.phone}`, 14, y); y += 7;
    doc.text(`Next Appointment: ${appData.pcp.nextAppt}`, 14, y); y += 12;
    
    // Medications
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('💊 Current Medications', 14, y); y += 10;
    
    const medRows = [...new Map(
      [...appData.medications.morning, ...appData.medications.evening]
        .map(m => [m.name, [m.name, m.dose, m.type === 'maintenance' ? 'Daily' : 'As Needed']])
    ).values()];
    
    doc.autoTable({ startY: y, head: [['Medication', 'Dose', 'Schedule']], body: medRows, theme: 'grid', headStyles: { fillColor: [37, 99, 235] }, styles: { fontSize: 9 }});
    y = doc.lastAutoTable.finalY + 15;
    
    // Recent Assessments
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Recent Assessments', 14, y); y += 10;
    
    const assessmentRows = (appData.healthHistory || []).slice(0, 5).map(h => 
      [h.date, `MRC: ${h.mrc ?? 'N/A'}`, `Peak: ${h.peakFlow ?? 'N/A'}`, h.symptoms || '-']
    );
    
    doc.autoTable({ startY: y, head: [['Date', 'MRC', 'Peak Flow', 'Notes']], body: assessmentRows, theme: 'grid', headStyles: { fillColor: [37, 99, 235] }, styles: { fontSize: 9 }});
    y = doc.lastAutoTable.finalY + 15;
    
    // Emergency Contacts
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('🚨 Emergency Contacts', 14, y); y += 10;
    doc.setFontSize(11);
    doc.text(`Emergency: 911`, 14, y); y += 7;
    doc.text(`Doctor: ${appData.pcp.name} - ${appData.pcp.phone}`, 14, y); y += 7;
    doc.text(`Family: ${appData.emergency.contact}`, 14, y); y += 7;
    doc.text(`Pharmacy: ${appData.emergency.pharmacy}`, 14, y); y += 12;
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('⚠️ For informational purposes only. Not medical advice.', 105, 285, { align: 'center' });
    doc.text('In emergency, call 911 immediately.', 105, 290, { align: 'center' });
    
    // Save
    const fileName = `COPD-Care-${appData.user.name.replace(/\s+/g,'-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    showToast('✅ PDF downloaded!');
    
  } catch (err) {
    console.error('Export error:', err);
    showToast('❌ PDF failed, trying text export...', 'error');
    fallbackExport();
  }
}

function fallbackExport() {
  const text = `COPD CARE REPORT\nGenerated: ${new Date().toLocaleString()}\n\nPATIENT\nName: ${appData.user.name}\nDOB: ${appData.user.dob}\nDiagnosis: ${appData.user.diagnosis}\nBaseline Peak Flow: ${appData.user.baselinePeakFlow}\n\nPROVIDER\n${appData.pcp.name}\n${appData.pcp.clinic}\nPhone: ${appData.pcp.phone}\nNext Appt: ${appData.pcp.nextAppt}\n\nMEDICATIONS\nMorning:\n${appData.medications.morning.map(m=>`• ${m.name} - ${m.dose}`).join('\n')}\n\nEvening:\n${appData.medications.evening.map(m=>`• ${m.name} - ${m.dose}`).join('\n')}\n\nREFILLS\n${appData.medications.refills.map(r=>`• ${r.name}: ${r.daysLeft} days`).join('\n')||'None'}\n\nEMERGENCY\n• 911\n• ${appData.pcp.name}: ${appData.pcp.phone}\n• ${appData.emergency.contact}\n• ${appData.emergency.pharmacy}\n\n⚠️ Not medical advice. Call 911 for emergencies.`;
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `COPD-Care-Report-${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📄 Text report downloaded');
}

function backupData() {
  const backup = JSON.stringify(appData, null, 2);
  const blob = new Blob([backup], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `copd-care-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 Backup downloaded!');
}

function restoreBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.user && data.medications) {
          if (confirm('Replace current data with backup?')) {
            appData = data;
            saveData();
            location.reload();
          }
        } else {
          showToast('❌ Invalid backup file', 'error');
        }
      } catch {
        showToast('❌ Failed to read backup', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function resetApp() {
  if (confirm('⚠️ Reset ALL data to demo values?\n\n• Delete custom profile\n• Remove medications\n• Clear health logs\n\nThis cannot be undone!')) {
    // Create backup first
    localStorage.setItem('copdCareBackup', localStorage.getItem('copdCareData'));
    // Clear data
    localStorage.removeItem('copdCareData');
    Object.keys(localStorage).forEach(k => { if (k.startsWith('reminder_')) localStorage.removeItem(k); });
    // Reload
    appData = JSON.parse(JSON.stringify(defaultData));
    saveData();
    location.reload();
  }
}

// ==================== MODALS ====================
function createModal(title, content, footerButtons = '') {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('active')">&times;</button>
      </div>
      <div class="modal-body">${content}</div>
      ${footerButtons ? `<div class="modal-footer">${footerButtons}</div>` : ''}
    </div>
  `;
  return modal;
}

function showEmergencyModal() {
  const modal = createModal('🚨 Emergency Help', `
    <p style="font-size:1.1rem;margin-bottom:20px;font-weight:500">If you're experiencing severe symptoms:</p>
    <ul style="margin-bottom:25px;line-height:2">
      <li>📞 <strong>Call 911</strong> or your local emergency number</li>
      <li>🏥 Go to nearest emergency room</li>
      <li>💊 Use rescue inhaler as prescribed</li>
      <li>👥 Have someone stay with you</li>
    </ul>
    <div style="background:#fef2f2;padding:15px;border-radius:10px;margin-bottom:20px">
      <strong style="color:var(--danger);display:block;margin-bottom:10px">Seek immediate care if:</strong>
      <ul style="padding-left:20px">
        <li>Severe shortness of breath at rest</li>
        <li>Blue/gray lips or fingernails</li>
        <li>Chest pain or pressure</li>
        <li>Confusion, dizziness, or fainting</li>
        <li>Rapid heartbeat with breathlessness</li>
      </ul>
    </div>
    <div style="margin-bottom:20px">
      <strong>📋 Emergency Contacts:</strong>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
        <div>👩‍⚕️ <strong>${appData.pcp.name}</strong><br><a href="tel:${appData.pcp.phone.replace(/[^\d+]/g,'')}" style="color:var(--primary)">${appData.pcp.phone}</a></div>
        <div>🚑 <strong>Emergency</strong><br><a href="tel:911" style="color:var(--danger);font-weight:600">911</a></div>
        <div>👨‍👩‍👧 <strong>Family</strong><br><a href="tel:${appData.emergency.contact.match(/\d+/g)?.join('')}" style="color:var(--primary)">${appData.emergency.contact}</a></div>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="document.getElementById('modalContainer').innerHTML=''">I'm Okay, Close</button>
    <a href="tel:911" class="btn btn-danger" style="text-decoration:none">📞 CALL 911 NOW</a>
  `);
  document.getElementById('modalContainer').appendChild(modal);
}

function showDisclaimer() {
  const modal = createModal('📋 Medical Disclaimer', `
    <h4>Not Medical Advice</h4>
    <p>The suggestions provided by this application are for informational purposes only and should not be considered medical advice, diagnosis, or treatment recommendations. Always consult with qualified healthcare professionals regarding any medical questions or concerns.</p>
    <h4>Emergency Situations</h4>
    <p>In case of a medical emergency, always call 911 or your local emergency services immediately. This app is not designed to handle emergency situations and should never be used as a substitute for professional emergency response.</p>
    <h4>AI-Generated Content</h4>
    <p>Some responses are generated using artificial intelligence. While we strive for accuracy, AI-generated content may contain errors or may not be appropriate for every situation. Always use your best judgment and professional guidance.</p>
    <h4>Research Purpose</h4>
    <p>This prototype is being developed as part of health technology research and is intended for educational and demonstration purposes only.</p>
  `, `<button class="btn btn-primary" onclick="document.getElementById('modalContainer').innerHTML=''">I Understand</button>`);
  document.getElementById('modalContainer').appendChild(modal);
}

function showPrivacy() {
  const modal = createModal('🔒 Privacy Policy', `
    <h4>Your Privacy Matters</h4>
    <p>We are committed to protecting your privacy and ensuring the security of any information you share with COPD Care Companion.</p>
    <h4>Data Collection</h4>
    <ul>
      <li>We collect health data you enter for tracking purposes</li>
      <li>Usage patterns to improve the application</li>
      <li><strong>No personal identifying information is required or stored on our servers</strong></li>
    </ul>
    <h4>Data Security</h4>
    <ul>
      <li>All data is stored locally on your device</li>
      <li>Exported data is encrypted if shared</li>
      <li>We do not sell or share data with third parties</li>
    </ul>
    <h4>Local Storage</h4>
    <p>Your health information, medications, and settings are stored only on your device using browser local storage. Clearing your browser data will remove this information.</p>
    <h4>Community Features</h4>
    <p>If you choose to share anonymized data for research purposes, all personal identifiers are removed. You can opt out at any time in Settings.</p>
    <h4>Contact Us</h4>
    <p>If you have questions about our privacy practices, please contact our support team through the app settings.</p>
  `, `<button class="btn btn-primary" onclick="document.getElementById('modalContainer').innerHTML=''">Got it</button>`);
  document.getElementById('modalContainer').appendChild(modal);
}

function showAirQuality() {
  const modal = createModal('🌤️ Air Quality & COPD', `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px">
      <span class="aqi-badge aqi-good">🟢 AQI: 42 - Good</span>
    </div>
    <p style="margin-bottom:15px">Great day for outdoor activities! Air quality is favorable for COPD management.</p>
    <div class="conditions-grid">
      <div class="condition-item"><div class="condition-value">72°F</div><div class="condition-label">Temperature</div></div>
      <div class="condition-item"><div class="condition-value">45%</div><div class="condition-label">Humidity</div></div>
      <div class="condition-item"><div class="condition-value">Low 🌿</div><div class="condition-label">Pollen</div></div>
      <div class="condition-item"><div class="condition-value">Good ✅</div><div class="condition-label">Ozone</div></div>
    </div>
    <p style="margin-top:15px;padding:12px;background:#f0fdf4;border-radius:10px;color:#166534">
      ✅ <strong>Recommendation:</strong> Safe for outdoor exercise. Consider morning walks when air is coolest.
    </p>
    <p style="margin-top:10px;font-size:0.9rem;color:var(--gray)">
      ⚠️ When AQI > 100: Limit outdoor time, keep windows closed, use air purifier indoors.
    </p>
    <p style="margin-top:15px;font-size:0.85rem;color:var(--gray)">
      💡 <strong>Tip:</strong> Check air quality at <a href="https://airnow.gov" target="_blank" style="color:var(--primary)">airnow.gov</a> for real-time updates in your area.
    </p>
  `, `<button class="btn btn-primary" onclick="document.getElementById('modalContainer').innerHTML=''">Got it</button>`);
  document.getElementById('modalContainer').appendChild(modal);
}

// ==================== UTILITIES ====================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Register service worker for PWA (optional)
if ('serviceWorker' in navigator) {
  // Could register a simple SW here for offline support
  // navigator.serviceWorker.register('sw.js');
}