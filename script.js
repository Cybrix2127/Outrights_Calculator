
// Utility function to get element by ID
const el = (id) => document.getElementById(id);

// API Base URL - empty string uses relative URLs (works on any host including Render)
const API_BASE = '';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// App initialization
function initializeApp() {
  setupTabNavigation();
  setupDarkMode();
  setupSidebarToggle();
  setupComparisonTabs();
  setupInputControls();
  setupMobileMenu();
  loadCasesFromStorage(true);
  updateStats();
  loadSampleData();
}

// Load sample/default data
function loadSampleData() {
  const effrInput = el('effr');
  if (effrInput && (!effrInput.value || effrInput.value === '')) {
    effrInput.value = '5.25%';
  }
}

// TAB NAVIGATION
function setupTabNavigation() {
  document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = item.getAttribute('data-tab');
      showTab(tabName);

      // Update active nav item
      document.querySelectorAll('.nav-item[data-tab]').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Close sidebar on mobile when tab is clicked
      if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar-nav');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
      }
    });
  });
}

function showTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

  // Show selected tab
  const selectedTab = el(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');

    // Re-render charts if switching to analytics tab
    if (tabName === 'analytics') {
      setTimeout(() => {
        if (window.currentResults) {
          renderCharts(window.currentResults);
        }
      }, 100);
    }

    // Load cases when switching to cases or comparison tabs
    if (tabName === 'cases' || tabName === 'comparison') {
      loadCasesFromStorage();
    }
  }
}

// DARK MODE
function setupDarkMode() {
  const darkModeBtn = el('toggle-dark');
  const isDarkMode = localStorage.getItem('darkMode') === 'true';

  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    updateDarkModeIcon(true);
  }

  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isNowDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isNowDark);
      updateDarkModeIcon(isNowDark);

      // Re-render charts with proper colors
      if (window.currentResults) {
        setTimeout(() => renderCharts(window.currentResults), 100);
      }
    });
  }
}

function updateDarkModeIcon(isDark) {
  const darkModeBtn = el('toggle-dark');
  if (!darkModeBtn) return;
  const icon = darkModeBtn.querySelector('i');
  const label = darkModeBtn.querySelector('span');
  if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  if (label) label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

// SIDEBAR TOGGLE
function setupSidebarToggle() {
  const toggleNav = el('toggle-nav');
  const sidebarNav = document.querySelector('.sidebar-nav');

  if (toggleNav) {
    toggleNav.addEventListener('click', () => {
      if (sidebarNav) {
        if (window.innerWidth <= 768) {
          // Mobile: toggle open/close
          sidebarNav.classList.toggle('open');
          const overlay = document.querySelector('.sidebar-overlay');
          if (overlay) overlay.classList.toggle('active');
        } else {
          // Desktop: toggle collapsed/expanded
          sidebarNav.classList.toggle('collapsed');
          document.body.classList.toggle('sidebar-collapsed');
          localStorage.setItem('sidebarCollapsed', sidebarNav.classList.contains('collapsed'));
        }
      }
    });
  }

  // Restore sidebar state
  const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (isCollapsed && window.innerWidth > 768 && sidebarNav) {
    sidebarNav.classList.add('collapsed');
    document.body.classList.add('sidebar-collapsed');
  }
}

// MOBILE MENU
function setupMobileMenu() {
  const mobileToggle = el('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar-nav');
  const overlay = document.querySelector('.sidebar-overlay');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      if (sidebar) sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

// COMPARISON TAB SWITCHING
function setupComparisonTabs() {
  document.querySelectorAll('.comparison-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const comparison = btn.getAttribute('data-comparison');

      // Update active button
      document.querySelectorAll('.comparison-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show/hide views
      document.querySelectorAll('.comparison-view').forEach(view => {
        view.style.display = 'none';
      });
      const view = document.getElementById(`${comparison}-comparison`);
      if (view) view.style.display = 'block';
    });
  });
}

// INPUT CONTROLS - Using event delegation to avoid double-binding
function setupInputControls() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.bp-decr, .bp-incr');
    if (!btn) return;

    const controlGroup = btn.closest('.input-with-controls');
    if (!controlGroup) return;

    const input = controlGroup.querySelector('.bp-input, .form-input');
    if (!input) return;

    const isDecrement = btn.classList.contains('bp-decr');
    const isEffr = input.id === 'effr';

    // EFFR adjusts by 0.25%, others by 1 bps
    const delta = isEffr ? (isDecrement ? -0.25 : 0.25) : (isDecrement ? -1 : 1);
    adjustValue(input, delta);
  });
}

function adjustValue(input, delta) {
  let currentStr = input.value || '0';
  // Strip % and bps suffixes for numeric parsing
  let numStr = currentStr.replace(/%$/i, '').replace(/bps$/i, '');
  let currentValue = parseFloat(numStr) || 0;
  let newValue = currentValue + delta;

  // Preserve the suffix
  if (currentStr.endsWith('%')) {
    input.value = newValue.toFixed(2) + '%';
  } else if (currentStr.toLowerCase().endsWith('bps')) {
    input.value = Math.round(newValue) + 'bps';
  } else {
    input.value = newValue % 1 === 0 ? String(newValue) : newValue.toFixed(2);
  }

  input.dispatchEvent(new Event('change'));
}

// COMPUTE RESULTS - Call backend API
// The backend expects: effr as percent string, meetings as bps strings, me/qe/ye as bps numbers
el('compute')?.addEventListener('click', computeAndRender);

async function computeAndRender() {
  try {
    // Show loading state
    const computeBtn = el('compute');
    const originalText = computeBtn.innerHTML;
    computeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Computing...';
    computeBtn.disabled = true;

    // Send raw values directly - let the backend parse them
    const effrVal = el('effr').value || '5.25%';
    const meVal = el('me').value || '0';
    const qeVal = el('qe').value || '0';
    const yeVal = el('ye').value || '0';

    // Collect FOMC meeting values as-is
    const meetings = {};
    document.querySelectorAll('[data-date]').forEach(input => {
      const dateStr = input.getAttribute('data-date');
      meetings[dateStr] = input.value || '0';
    });

    const payload = {
      effr: effrVal,
      me: meVal,
      qe: qeVal,
      ye: yeVal,
      meetings: meetings
    };

    console.log('Sending payload:', payload);

    const response = await fetch(`${API_BASE}/api/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      throw new Error(errBody?.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      showNotification(`Error: ${data.error || 'Unknown error'}`, 'error');
      return;
    }

    // Transform results for display
    const results = data.data.map(r => ({
      month: r.month,
      rate: r.avg_rate.toFixed(4),
      outright: r.outright.toFixed(4),
      spread: '0.0000'
    }));

    // Calculate 1M spreads (difference between consecutive month outrights)
    for (let i = 0; i < results.length - 1; i++) {
      const currentOut = parseFloat(results[i].outright);
      const nextOut = parseFloat(results[i + 1].outright);
      results[i].spread = (currentOut - nextOut).toFixed(4);
    }
    if (results.length > 0) {
      results[results.length - 1].spread = 'N/A';
    }

    window.currentResults = results;
    renderTable(results);
    renderCharts(results);
    updateStats();
    showNotification('Results computed successfully!', 'success');
  } catch (error) {
    console.error('Compute error:', error);
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    const computeBtn = el('compute');
    computeBtn.innerHTML = '<i class="fas fa-calculator"></i> Compute Results';
    computeBtn.disabled = false;
  }
}

// RENDER TABLE
function renderTable(results) {
  const tableEl = el('table');
  if (!tableEl) return;

  const tbody = tableEl.querySelector('tbody');
  tbody.innerHTML = '';

  results.forEach((row, idx) => {
    const tr = document.createElement('tr');
    const spreadVal = parseFloat(row.spread);
    let spreadClass = '';
    if (!isNaN(spreadVal)) {
      spreadClass = spreadVal > 0 ? 'spread-positive' : spreadVal < 0 ? 'spread-negative' : '';
    }

    tr.innerHTML = `
      <td class="month-cell">${row.month}</td>
      <td>${row.rate}%</td>
      <td class="outright-cell">${row.outright}</td>
      <td class="${spreadClass}">${row.spread}</td>
    `;
    tbody.appendChild(tr);
  });
}

// RENDER CHARTS
function renderCharts(results) {
  if (!results || results.length === 0) return;

  const months = results.map(r => r.month.replace(' 2026', ''));
  const outrights = results.map(r => parseFloat(r.outright));
  const spreads = results.map(r => {
    const v = parseFloat(r.spread);
    return isNaN(v) ? 0 : v;
  });

  const isDark = document.body.classList.contains('dark-mode');
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const textColor = isDark ? '#c9d1d9' : '#666';
  const accentColor = isDark ? '#58a6ff' : '#0052cc';
  const accentBg = isDark ? 'rgba(88, 166, 255, 0.15)' : 'rgba(0, 82, 204, 0.1)';

  // Destroy existing charts if they exist
  if (window.outrightChart) window.outrightChart.destroy();
  if (window.spreadChart) window.spreadChart.destroy();

  // Outrights Chart
  const outCtx = el('outrights-chart');
  if (outCtx) {
    window.outrightChart = new Chart(outCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Outrights',
          data: outrights,
          borderColor: accentColor,
          backgroundColor: accentBg,
          borderWidth: 2.5,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: accentColor,
          pointBorderColor: isDark ? '#161b22' : '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#21262d' : '#fff',
            titleColor: isDark ? '#e6edf3' : '#1a1a1a',
            bodyColor: isDark ? '#c9d1d9' : '#404040',
            borderColor: isDark ? '#30363d' : '#d0d7de',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (ctx) => `Outright: ${ctx.parsed.y.toFixed(4)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 11 } }
          }
        }
      }
    });
  }

  // Spreads Chart
  const spreadCtx = el('spreads-chart');
  if (spreadCtx) {
    const barColors = spreads.map(s => s >= 0
      ? (isDark ? 'rgba(88, 166, 255, 0.7)' : 'rgba(0, 82, 204, 0.7)')
      : (isDark ? 'rgba(248, 81, 73, 0.7)' : 'rgba(209, 36, 47, 0.7)')
    );
    const barBorders = spreads.map(s => s >= 0
      ? (isDark ? '#58a6ff' : '#0052cc')
      : (isDark ? '#f85149' : '#d1242f')
    );

    window.spreadChart = new Chart(spreadCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: '1M Spreads',
          data: spreads,
          backgroundColor: barColors,
          borderColor: barBorders,
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#21262d' : '#fff',
            titleColor: isDark ? '#e6edf3' : '#1a1a1a',
            bodyColor: isDark ? '#c9d1d9' : '#404040',
            borderColor: isDark ? '#30363d' : '#d0d7de',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (ctx) => `Spread: ${ctx.parsed.y.toFixed(4)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 11 } }
          }
        }
      }
    });
  }
}

// SAVE CASE
el('save-case')?.addEventListener('click', saveCaseHandler);

async function saveCaseHandler() {
  const caseName = prompt('Enter case name:', `Case_${new Date().toLocaleDateString()}`);

  if (!caseName || caseName.trim() === '') return;

  try {
    const saveBtn = el('save-case');
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    // Send raw values - let backend parse
    const payload = {
      name: caseName.trim(),
      effr: el('effr').value || '5.25%',
      me: el('me').value || '0',
      qe: el('qe').value || '0',
      ye: el('ye').value || '0',
      meetings: {}
    };

    document.querySelectorAll('[data-date]').forEach(input => {
      const dateStr = input.getAttribute('data-date');
      payload.meetings[dateStr] = input.value || '0';
    });

    const response = await fetch(`${API_BASE}/api/save-case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (!data.success) {
      showNotification(`Error: ${data.error || 'Failed to save case'}`, 'error');
      return;
    }

    loadCasesFromStorage();
    showNotification(`Case "${caseName}" saved successfully!`, 'success');
  } catch (error) {
    console.error('Save error:', error);
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    const saveBtn = el('save-case');
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Case';
    saveBtn.disabled = false;
  }
}

// UPDATE CASE
el('update-case')?.addEventListener('click', async () => {
  if (!window.currentCaseId && window.currentCaseId !== 0) {
    showNotification('No case loaded', 'warning');
    return;
  }

  try {
    const updateBtn = el('update-case');
    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    updateBtn.disabled = true;

    const payload = {
      effr: el('effr').value || '5.25%',
      me: el('me').value || '0',
      qe: el('qe').value || '0',
      ye: el('ye').value || '0',
      meetings: {}
    };

    document.querySelectorAll('[data-date]').forEach(input => {
      const dateStr = input.getAttribute('data-date');
      payload.meetings[dateStr] = input.value || '0';
    });

    const response = await fetch(`${API_BASE}/api/update-case/${window.currentCaseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success) {
      loadCasesFromStorage();
      showNotification('Case updated successfully!', 'success');
    } else {
      showNotification(`Error: ${data.error}`, 'error');
    }
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    const updateBtn = el('update-case');
    updateBtn.innerHTML = '<i class="fas fa-edit"></i> Update';
    updateBtn.disabled = false;
  }
});

// RESET inputs
el('reset-inputs')?.addEventListener('click', () => {
  el('effr').value = '5.25%';
  el('me').value = '0';
  el('qe').value = '0';
  el('ye').value = '0';
  document.querySelectorAll('[data-date]').forEach(input => {
    input.value = '0';
  });
  window.currentCaseId = null;
  el('update-case').disabled = true;
  showNotification('Inputs reset to defaults', 'info');
});

// LOAD CASES FROM API
async function loadCasesFromStorage(autoLoadLatest = false) {
  try {
    const response = await fetch(`${API_BASE}/api/list-cases`);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.success) {
      window.allCases = data.cases || [];
    } else {
      window.allCases = [];
    }
  } catch (error) {
    console.error('Error loading cases:', error);
    window.allCases = [];
  }

  renderCaseList(window.allCases);
  renderCaseCheckboxes(window.allCases);
  updateStats();

  // Auto-load the most recent saved case on startup
  if (autoLoadLatest && window.allCases.length > 0) {
    const latestCase = window.allCases[window.allCases.length - 1];
    await loadCase(latestCase.id);
  }
}

function renderCaseList(cases) {
  const caseList = el('case-list');
  if (!caseList) return;

  caseList.innerHTML = '';

  if (!cases || cases.length === 0) {
    caseList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p>No saved cases yet</p>
        <span>Use the Calculator tab to create and save cases</span>
      </div>`;
    return;
  }

  cases.forEach(caseData => {
    const div = document.createElement('div');
    div.className = 'case-item';
    const createdDate = caseData.created ? new Date(caseData.created).toLocaleString() : 'Unknown';
    div.innerHTML = `
      <div class="case-item-info">
        <strong>${escapeHtml(caseData.name || 'Unnamed')}</strong>
        <span class="case-date">${createdDate}</span>
      </div>
      <div class="case-item-actions">
        <button class="btn btn-small btn-primary load-case" data-id="${caseData.id}">
          <i class="fas fa-upload"></i> Load
        </button>
        <button class="btn btn-small btn-danger delete-case" data-id="${caseData.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    caseList.appendChild(div);
  });

  // Setup load/delete handlers
  document.querySelectorAll('.load-case').forEach(btn => {
    btn.addEventListener('click', () => loadCase(btn.getAttribute('data-id')));
  });

  document.querySelectorAll('.delete-case').forEach(btn => {
    btn.addEventListener('click', () => deleteCase(btn.getAttribute('data-id')));
  });
}

async function loadCase(caseId) {
  try {
    const response = await fetch(`${API_BASE}/api/get-case/${caseId}`);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (!data.success) {
      showNotification('Case not found', 'error');
      return;
    }

    const caseData = data.case;
    const inputs = caseData.inputs || {};

    // Set values directly as strings (backend stored raw strings)
    el('effr').value = inputs.effr || '5.25%';
    el('me').value = inputs.me || '0';
    el('qe').value = inputs.qe || '0';
    el('ye').value = inputs.ye || '0';

    const meetings = inputs.meetings || {};
    document.querySelectorAll('[data-date]').forEach(inp => {
      const date = inp.getAttribute('data-date');
      inp.value = meetings[date] !== undefined ? String(meetings[date]) : '0';
    });

    window.currentCaseId = parseInt(caseId);
    el('update-case').disabled = false;

    if (caseData.results && Array.isArray(caseData.results) && caseData.results.length > 0) {
      const results = caseData.results.map(r => ({
        month: r.month,
        rate: parseFloat(r.avg_rate).toFixed(4),
        outright: parseFloat(r.outright).toFixed(4),
        spread: '0.0000'
      }));

      for (let i = 0; i < results.length - 1; i++) {
        const currentOut = parseFloat(results[i].outright);
        const nextOut = parseFloat(results[i + 1].outright);
        results[i].spread = (currentOut - nextOut).toFixed(4);
      }
      if (results.length > 0) {
        results[results.length - 1].spread = 'N/A';
      }

      renderTable(results);
      renderCharts(results);
      window.currentResults = results;
    }

    // Switch to calculator tab
    showTab('calculator');
    document.querySelectorAll('.nav-item[data-tab]').forEach(nav => {
      nav.classList.toggle('active', nav.getAttribute('data-tab') === 'calculator');
    });

    showNotification(`Case "${escapeHtml(caseData.name)}" loaded!`, 'success');
  } catch (error) {
    console.error('Load error:', error);
    showNotification(`Error: ${error.message}`, 'error');
  }
}

async function deleteCase(caseId) {
  if (!confirm('Are you sure you want to delete this case?')) return;

  try {
    const response = await fetch(`${API_BASE}/api/delete-case/${caseId}`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.success) {
      if (window.currentCaseId === parseInt(caseId)) {
        window.currentCaseId = null;
        el('update-case').disabled = true;
      }
      loadCasesFromStorage();
      showNotification('Case deleted!', 'success');
    } else {
      showNotification(`Error: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Delete error:', error);
    showNotification(`Error: ${error.message}`, 'error');
  }
}

function renderCaseCheckboxes(cases) {
  const checkboxList = el('case-checkboxes');
  if (!checkboxList) return;

  checkboxList.innerHTML = '';

  if (!cases || cases.length === 0) {
    checkboxList.innerHTML = `
      <div class="empty-state-sm">
        <p>No cases available for comparison</p>
      </div>`;
    return;
  }

  cases.forEach(caseData => {
    const label = document.createElement('label');
    label.className = 'checkbox-item';
    label.innerHTML = `
      <input type="checkbox" value="${caseData.id}">
      <span class="checkbox-label">${escapeHtml(caseData.name || 'Unnamed')}</span>
    `;
    checkboxList.appendChild(label);
  });
}

// COMPARISON - needs full case data
el('compare-cases')?.addEventListener('click', async () => {
  const selectedIds = Array.from(document.querySelectorAll('#case-checkboxes input:checked')).map(cb => cb.value);

  if (selectedIds.length < 2) {
    showNotification('Select at least 2 cases to compare', 'warning');
    return;
  }

  // Fetch full case data for each selected case
  try {
    const casePromises = selectedIds.map(id =>
      fetch(`${API_BASE}/api/get-case/${id}`)
        .then(r => r.json())
        .then(d => d.success ? d.case : null)
    );

    const fullCases = (await Promise.all(casePromises)).filter(c => c !== null);

    if (fullCases.length < 2) {
      showNotification('Could not load enough case data for comparison', 'error');
      return;
    }

    renderComparisonTable(fullCases);
    const compPanel = el('comparison');
    if (compPanel) compPanel.style.display = 'block';
  } catch (error) {
    console.error('Comparison error:', error);
    showNotification(`Error loading cases: ${error.message}`, 'error');
  }
});

function renderComparisonTable(selectedCases) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Outrights comparison
  const outHeader = el('comparison-header');
  const outBody = el('comparison-body');

  if (outHeader) {
    outHeader.innerHTML = '<th>Month</th>' + selectedCases.map(c => `<th>${escapeHtml(c.name || 'Unnamed')}</th>`).join('');
  }

  if (outBody) {
    outBody.innerHTML = '';

    months.forEach((month, idx) => {
      const tr = document.createElement('tr');
      let html = `<td>${month}</td>`;
      selectedCases.forEach(caseData => {
        const value = caseData.results && caseData.results[idx]
          ? parseFloat(caseData.results[idx].outright).toFixed(4)
          : '-';
        html += `<td>${value}</td>`;
      });
      tr.innerHTML = html;
      outBody.appendChild(tr);
    });
  }

  // Spreads comparison
  const spreadHeader = el('comparison-spreads-header');
  const spreadBody = el('comparison-spreads-body');

  if (spreadHeader) {
    spreadHeader.innerHTML = '<th>Month</th>' + selectedCases.map(c => `<th>${escapeHtml(c.name || 'Unnamed')}</th>`).join('');
  }

  if (spreadBody) {
    spreadBody.innerHTML = '';

    months.forEach((month, idx) => {
      const tr = document.createElement('tr');
      let html = `<td>${month}</td>`;
      selectedCases.forEach(caseData => {
        let spread = '-';
        if (caseData.results && idx < caseData.results.length - 1) {
          const current = parseFloat(caseData.results[idx].outright);
          const next = parseFloat(caseData.results[idx + 1].outright);
          spread = (current - next).toFixed(4);
        }
        html += `<td>${spread}</td>`;
      });
      tr.innerHTML = html;
      spreadBody.appendChild(tr);
    });
  }
}

// UPDATE STATS
function updateStats() {
  const effrEl = el('stat-effr');
  const casesEl = el('stat-cases');
  const updatedEl = el('stat-updated');

  if (effrEl) effrEl.textContent = el('effr')?.value || '5.25%';
  if (casesEl) casesEl.textContent = (window.allCases || []).length;
  if (updatedEl) {
    const now = new Date();
    updatedEl.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// DOWNLOAD FUNCTIONS
el('download')?.addEventListener('click', downloadCSV);
el('download-excel')?.addEventListener('click', downloadExcel);

function downloadCSV() {
  if (!window.currentResults || window.currentResults.length === 0) {
    showNotification('No results to download. Compute first.', 'warning');
    return;
  }

  const headers = ['Month', 'Rate (%)', 'Outright', '1M Spread'];
  const rows = window.currentResults.map(r => [r.month, r.rate, r.outright, r.spread]);

  let csv = headers.join(',') + '\n';
  rows.forEach(row => csv += row.join(',') + '\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `outrights_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showNotification('CSV downloaded!', 'success');
}

async function downloadExcel() {
  try {
    if (!window.currentResults || window.currentResults.length === 0) {
      showNotification('No results to download. Compute first.', 'warning');
      return;
    }

    const response = await fetch(`${API_BASE}/api/download-excel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: window.currentResults })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      throw new Error(errBody?.error || `HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `outrights_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Excel file downloaded!', 'success');
  } catch (error) {
    console.error('Download error:', error);
    showNotification(`Error: ${error.message}`, 'error');
  }
}

// NOTIFICATION with type support
function showNotification(message, type = 'info') {
  // Remove any existing notifications
  const existingNotif = document.querySelector('.notification-toast');
  if (existingNotif) existingNotif.remove();

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  const colors = {
    success: 'linear-gradient(135deg, #1a7f16 0%, #2ea043 100%)',
    error: 'linear-gradient(135deg, #d1242f 0%, #e34c26 100%)',
    warning: 'linear-gradient(135deg, #9e6a03 0%, #d29922 100%)',
    info: 'linear-gradient(135deg, #0052cc 0%, #0969da 100%)'
  };

  const notification = document.createElement('div');
  notification.className = 'notification-toast';
  notification.innerHTML = `
    <i class="fas ${icons[type] || icons.info}"></i>
    <span>${escapeHtml(message)}</span>
    <button class="notif-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 14px 20px;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    animation: slideIn 0.3s ease;
    max-width: 420px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 500;
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      if (notification.parentElement) notification.remove();
    }, 300);
  }, 3500);
}

// UTILITY: Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(420px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(420px); opacity: 0; }
  }
  .notif-close {
    background: none;
    border: none;
    color: rgba(255,255,255,0.8);
    cursor: pointer;
    padding: 4px;
    font-size: 14px;
    margin-left: auto;
  }
  .notif-close:hover {
    color: #fff;
  }
`;
document.head.appendChild(style);

// Responsive sidebar on resize
window.addEventListener('resize', () => {
  const sidebar = document.querySelector('.sidebar-nav');
  const overlay = document.querySelector('.sidebar-overlay');
  if (window.innerWidth > 768) {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }
});

console.log('2026 Outrights Calculator initialized');
