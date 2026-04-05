(function(COPDApp) {
  'use strict';

  // Sanitize inputs
  const sanitize = str => typeof str === 'string' ? str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])) : str;

  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // State
  const state = {
    streak: 3,
    logs: [
      { date: 'Today • April 3, 2026', type: 'all', text: 'MRC Score: 1 | Peak Flow: 420 L/min<br><small>Symptoms: Mild shortness of breath during morning walk. Cough minimal.</small>' },
      { date: 'Yesterday • April 2, 2026', type: 'flare', text: 'MRC Score: 2 | Peak Flow: 395 L/min<br><small>Symptoms: Increased cough in evening. Used rescue inhaler once.</small>' },
      { date: 'April 1, 2026', type: 'peak', text: 'MRC Score: 1 | Peak Flow: 410 L/min<br><small>Symptoms: Good day. Completed breathing exercises.</small>' }
    ],
    breathTimer: null,
    breathInterval: null,
    currentBreath: 'pursed',
    profile: { baseline: 450 }
  };

  // Navigation
  function switchTab(tabId) {
    $$('.tab').forEach(t => t.classList.remove('active'));
    $$('.nav-item').forEach(n => n.classList.remove('active'));
    $(`${tabId}-tab`).classList.add('active');
    $(`[data-tab="${tabId}"]`).classList.add('active');
    localStorage.setItem('copd_current_tab', tabId);
  }

  // History Render
  function renderHistory(filter = 'all') {
    const list = $('historyList');
    list.innerHTML = '';
    const filtered = filter === 'all' ? state.logs : state.logs.filter(l => l.type === filter);
    if (filtered.length === 0) return list.innerHTML = '<p style="padding:10px;opacity:0.7;">No logs yet.</p>';
    filtered.forEach(log => {
      const div = document.createElement('div');
      div.className = `log-entry ${log.type === 'flare' ? 'flare' : ''}`;
      div.innerHTML = `<div class="log-date">${log.date}</div><div>${log.text}</div>`;
      list.appendChild(div);
    });
  }

  // Peak Flow
  function handlePeakFlow() {
    const val = parseFloat($('peakFlowInput').value);
    if (isNaN(val) || val < 100 || val > 1000) return alert('Enter valid reading (100-1000 L/min)');
    const ratio = val / state.profile.baseline;
    const zone = ratio >= 0.8 ? 'Good' : ratio >= 0.5 ? 'Caution' : 'Low';
    const banner = $('pfZoneBanner');
    banner.textContent = `${zone} Zone (${Math.round(ratio*100)}% of baseline)`;
    banner.style.background = ratio >= 0.8 ? '#28a745' : ratio >= 0.5 ? '#ffc107' : '#dc3545';
    banner.style.color = ratio >= 0.5 ? '#000' : '#fff';
    banner.style.display = 'block';
    
    state.logs.unshift({ date: new Date().toLocaleDateString(), type: 'peak', text: `Peak Flow: ${val} L/min (${zone})` });
    localStorage.setItem('copd_logs', JSON.stringify(state.logs));
    renderHistory('all');
    $('peakFlowInput').value = '';
  }

  // Breath Timer
  const patterns = { pursed: {in:4,out:4}, box: {in:4,hold:4,out:4}, '478': {in:4,hold:7,out:8}, diaphragmatic: {in:5,out:5} };
  function toggleBreath(start) {
    clearInterval(state.breathInterval);
    if (!start) { $('breathStart').disabled = false; $('breathStop').disabled = true; $('breathDisplay').innerHTML = 'Ready<br><small>Tap Start to begin</small>'; $('breathTimer').textContent = '00:00'; return; }
    
    const p = patterns[state.currentBreath];
    let step = 'Inhale', sec = p.in, total = 0;
    $('breathStart').disabled = true; $('breathStop').disabled = false;
    $('breathDisplay').textContent = `${step} (${sec}s)`;
    
    state.breathInterval = setInterval(() => {
      total++; $('breathTimer').textContent = `00:${String(total).padStart(2,'0')}`;
      sec--;
      if (sec < 0) {
        if (step === 'Inhale' && p.hold) { step = 'Hold'; sec = p.hold; }
        else if (step !== 'Exhale') { step = 'Exhale'; sec = p.out; }
        else { step = 'Inhale'; sec = p.in; }
      }
      $('breathDisplay').textContent = `${step} (${sec}s)`;
    }, 1000);
  }

  // Save Assessment
  function saveAssessment() {
    const mrc = $('mrcScore').value;
    const sev = $('symptomSeverity').value;
    const notes = sanitize($('warningSigns').value) || 'None';
    state.logs.unshift({ date: new Date().toLocaleDateString(), type: 'all', text: `MRC: ${mrc} | Severity: ${sev}/5<br><small>Notes: ${notes}</small>` });
    localStorage.setItem('copd_logs', JSON.stringify(state.logs));
    state.streak++;
    $('streakDisplay').textContent = `🔥 ${state.streak}-day streak!`;
    renderHistory('all');
    alert('✅ Assessment saved!');
  }

  // Init
  function init() {
    // Load saved
    const savedLogs = localStorage.getItem('copd_logs');
    if (savedLogs) { state.logs = JSON.parse(savedLogs); }
    renderHistory('all');

    // Tabs
    $$('.nav-item').forEach(b => b.addEventListener('click', e => { e.preventDefault(); switchTab(e.target.dataset.tab); }));
    $('viewHistoryBtn').addEventListener('click', () => switchTab('log'));

    // Assess
    $('symptomSeverity').addEventListener('input', e => $('severityVal').textContent = e.target.value);
    $('saveAssessment').addEventListener('click', saveAssessment);

    // Peak Flow
    $('pfSubmitBtn').addEventListener('click', handlePeakFlow);

    // Breath
    $$('.breath-btn').forEach(b => b.addEventListener('click', () => {
      $$('.breath-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.currentBreath = b.dataset.type;
      toggleBreath(false);
    }));
    $('breathStart').addEventListener('click', () => toggleBreath(true));
    $('breathStop').addEventListener('click', () => toggleBreath(false));

    // Filters
    $$('.filter').forEach(f => f.addEventListener('click', () => {
      $$('.filter').forEach(x => x.classList.remove('active'));
      f.classList.add('active');
      renderHistory(f.dataset.filter);
    }));

    // Modals
    const open = id => $(id).showModal();
    const close = id => $(id).close();
    $('emergencyBtn').addEventListener('click', () => open('#emergencyModal'));
    $('showDisclaimer').addEventListener('click', () => open('#disclaimerModal'));
    $('showPrivacy').addEventListener('click', () => open('#privacyModal'));
    $$('.close-modal').forEach(b => b.addEventListener('click', () => close('#' + b.dataset.modal)));
    $('closeEmergencySafe').addEventListener('click', () => close('#emergencyModal'));
    $('closeDisclaimer').addEventListener('click', () => close('#disclaimerModal'));
    $('closePrivacy').addEventListener('click', () => close('#privacyModal'));

    // Export
    $('exportJSON').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({logs: state.logs, streak: state.streak}, null, 2)], {type:'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'copd-backup.json'; a.click();
    });
    $('exportPDF').addEventListener('click', () => window.print());

    // Theme
    $('themeToggle').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('copd_theme', next);
    });
    document.documentElement.setAttribute('data-theme', localStorage.getItem('copd_theme') || 'light');

    // Reset
    $('resetDemo').addEventListener('click', () => {
      if(confirm('Reset all demo data?')) { localStorage.clear(); location.reload(); }
    });

    // PWA
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
