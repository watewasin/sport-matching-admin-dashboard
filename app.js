/* ================================================================
   SportPlex Admin — App Logic
   ================================================================ */

'use strict';

// ═══════════════════════════════════════════
// DATA LAYER — Stadium configurations
// ═══════════════════════════════════════════
const SPORT_META = {
    football: {
        label: 'Football',
        icon: '⚽',
        color: '#22c55e',
        colorVar: '--football',
        courts: ['Pitch A', 'Pitch B', 'Pitch C'],
        ratePerHour: 800,
    },
    basketball: {
        label: 'Basketball',
        icon: '🏀',
        color: '#f97316',
        colorVar: '--basketball',
        courts: ['Court 1', 'Court 2'],
        ratePerHour: 600,
    },
    swimming: {
        label: 'Swimming',
        icon: '🏊',
        color: '#0ea5e9',
        colorVar: '--swimming',
        courts: ['Pool A', 'Pool B'],
        ratePerHour: 500,
    },
    tennis: {
        label: 'Tennis',
        icon: '🎾',
        color: '#a855f7',
        colorVar: '--tennis',
        courts: ['Court T1', 'Court T2', 'Court T3'],
        ratePerHour: 700,
    },
    badminton: {
        label: 'Badminton',
        icon: '🏸',
        color: '#ec4899',
        colorVar: '--badminton',
        courts: ['Hall A', 'Hall B', 'Hall C', 'Hall D'],
        ratePerHour: 350,
    },
};

const STADIUMS = {
    'STD-001': {
        id: 'STD-001',
        name: 'Pink Arena',
        sports: ['badminton'],
        password: 'admin123',
    },
    'STD-002': {
        id: 'STD-002',
        name: 'Metro Sports Complex',
        sports: ['football', 'basketball'],
        password: 'admin123',
    },
    'STD-003': {
        id: 'STD-003',
        name: 'Olympia Grand Stadium',
        sports: ['football', 'basketball', 'swimming', 'tennis', 'badminton'],
        password: 'admin123',
    },
};

// Occupancy data — populated dynamically from Firestore
const OCCUPANCY_DATA = {};

// Revenue data — populated dynamically from Firestore
const REVENUE_DATA = {};

// ══════════════════════════════════════════════════════
// FIREBASE FIRESTORE — Helper to check if DB is ready
// ══════════════════════════════════════════════════════
function isFirebaseReady() {
    return typeof window.db !== 'undefined';
}

// ── GET bookings for a specific date + sport ──
async function fetchBookingsForDate(dateStr, sport) {
    if (!isFirebaseReady()) {
        console.warn('⚠ Firebase not configured yet — using mock data');
        return getMockBookings(sport);
    }
    try {
        const snapshot = await window.db.collection('bookings')
            .where('date', '==', dateStr)
            .where('sport', '==', sport)
            .where('stadiumId', '==', currentStadium?.id || '')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.warn('⚠ Firestore fetch failed — using mock data:', err.message);
        return getMockBookings(sport);
    }
}

// ── Mock fallback (returns empty — Firestore is the real source now) ──
function getMockBookings(sport) {
    return []; // No demo data — connect Firebase to see real bookings
}

// Full bookings list for table
// Full bookings list for table — fetches real data from Firestore
async function generateAllBookings(sports) {
    const all = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (const sport of sports) {
        const bookings = await fetchBookingsForDate(todayStr, sport);
        bookings.forEach(b => {
            const m = SPORT_META[sport];
            const hours = b.endH && b.startH ? b.endH - b.startH : 1;
            all.push({
                id: b.id,
                name: b.name,
                sport,
                court: b.court || b.courtId,
                date: 'Today',
                time: b.time,
                status: b.status,
                amount: `฿${(m.ratePerHour * hours).toLocaleString()}`,
            });
        });
    }

    return all;
}

// ═══════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════
let currentStadium = null;
let activeSport = null;
let activeView = 'overview';
let calendarDate = new Date();
let selectedCalendarDate = new Date(); // tracks the clicked day
let revenueChart = null;
let revenueSportChart = null;
let revenuePeriod = 'week';

// ═══════════════════════════════════════════
// DOM HELPERS
// ═══════════════════════════════════════════
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const el = (tag, cls, html = '') => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
};

// ═══════════════════════════════════════════
// SCREEN SWITCHING
// ═══════════════════════════════════════════
function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    $('#' + id).classList.add('active');
}

// ═══════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════
function initLogin() {
    const form = $('#login-form');
    const errorEl = $('#login-error');
    const btnText = $('.btn-text', form);
    const btnSpinner = $('.btn-spinner', form);
    const eyeToggle = $('#eye-toggle');
    const pwInput = $('#password');
    const eyeShow = $('#eye-icon-show');
    const eyeHide = $('#eye-icon-hide');

    // Eye toggle
    eyeToggle.addEventListener('click', () => {
        if (pwInput.type === 'password') {
            pwInput.type = 'text';
            eyeShow.style.display = 'none';
            eyeHide.style.display = 'block';
        } else {
            pwInput.type = 'password';
            eyeShow.style.display = 'block';
            eyeHide.style.display = 'none';
        }
    });

    // Demo badge fill
    $$('.badge').forEach(badge => {
        badge.addEventListener('click', () => {
            const id = badge.textContent.split('·')[0].trim();
            $('#stadium-id').value = id;
            $('#password').value = 'admin123';
        });
    });

    // Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';
        const stadiumId = $('#stadium-id').value.trim().toUpperCase();
        const password = $('#password').value;

        // Fake loading
        btnText.style.display = 'none';
        btnSpinner.style.display = 'flex';
        form.querySelector('button[type=submit]').disabled = true;

        setTimeout(() => {
            const stadium = STADIUMS[stadiumId];
            if (!stadium || stadium.password !== password) {
                errorEl.style.display = 'flex';
                btnText.style.display = 'block';
                btnSpinner.style.display = 'none';
                form.querySelector('button[type=submit]').disabled = false;
                return;
            }
            currentStadium = stadium;
            loadDashboard(stadium);
            showScreen('screen-dashboard');
        }, 900);
    });
}

// ═══════════════════════════════════════════
// DASHBOARD BOOTSTRAP
// ═══════════════════════════════════════════
function loadDashboard(stadium) {
    activeSport = stadium.sports[0];
    applySportTheme(activeSport);

    // Header info
    $('#sidebar-stadium-name').textContent = stadium.name;
    $('#sidebar-user-name').textContent = stadium.id;
    $('#sidebar-avatar').textContent = stadium.name[0];
    $('#topbar-stadium-label').textContent = stadium.id + ' · ' + stadium.name;
    document.title = `${stadium.name} — SportPlex Admin`;

    // Topbar date
    const dateEl = $('#topbar-date');
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    buildSidebarSports(stadium.sports);
    buildSportSwitcher(stadium.sports);
    buildWalkInModal(stadium.sports);

    // Settings
    $('#settings-stadium-name').textContent = stadium.name;
    $('#settings-stadium-id').textContent = stadium.id;
    $('#settings-sports-list').innerHTML = stadium.sports.map(s => {
        const m = SPORT_META[s];
        return `<span class="settings-sport-pill" style="background:${m.color}20; color:${m.color}; border-color:${m.color}40">${m.icon} ${m.label}</span>`;
    }).join('');
    const totalCourts = stadium.sports.reduce((a, s) => a + SPORT_META[s].courts.length, 0);
    $('#settings-courts').textContent = totalCourts;

    renderOverview();
    initNav();
    initCalendar();
    initWalkInModal();
}

// ═══════════════════════════════════════════
// SIDEBAR SPORTS
// ═══════════════════════════════════════════
function buildSidebarSports(sports) {
    const nav = $('#sidebar-sports-nav');
    nav.innerHTML = '';
    sports.forEach(sport => {
        const m = SPORT_META[sport];
        const btn = el('button', 'sport-nav-item' + (sport === activeSport ? ' active' : ''));
        btn.setAttribute('data-sport', sport);
        btn.innerHTML = `<span class="sport-icon">${m.icon}</span><span>${m.label}</span>`;
        btn.addEventListener('click', () => {
            activeSport = sport;
            applySportTheme(sport);
            $$('.sport-nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            $$('.sport-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.sport === sport);
            });
            renderOverview();
        });
        nav.appendChild(btn);
    });
}

// ═══════════════════════════════════════════
// SPORT SWITCHER TABS
// ═══════════════════════════════════════════
function buildSportSwitcher(sports) {
    const switcher = $('#sport-switcher');
    const tabsEl = $('#sport-tabs');
    tabsEl.innerHTML = '';

    if (sports.length > 1) {
        switcher.style.display = 'block';
        sports.forEach(sport => {
            const m = SPORT_META[sport];
            const btn = el('button', 'sport-tab' + (sport === activeSport ? ' active' : ''));
            btn.setAttribute('data-sport', sport);
            btn.innerHTML = `<span class="tab-icon">${m.icon}</span>${m.label}`;
            btn.addEventListener('click', () => {
                activeSport = sport;
                applySportTheme(sport);
                $$('.sport-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                $$('.sport-nav-item').forEach(b => {
                    b.classList.toggle('active', b.dataset.sport === sport);
                });
                renderOverview();
            });
            tabsEl.appendChild(btn);
        });
    } else {
        switcher.style.display = 'none';
    }
}

// ═══════════════════════════════════════════
// NAV / VIEW SWITCHING
// ═══════════════════════════════════════════
function initNav() {
    $$('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const view = item.dataset.view;
            if (!view) return;
            switchView(view);
            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                $('#sidebar').classList.remove('open');
            }
        });
    });
    // Mobile toggle
    $('#menu-toggle').addEventListener('click', () => {
        $('#sidebar').classList.toggle('open');
    });
    $('#sidebar-close').addEventListener('click', () => {
        $('#sidebar').classList.remove('open');
    });

    $('#logout-btn').addEventListener('click', logOut);
}

function switchView(view) {
    activeView = view;
    // Deactivate all nav items
    $$('.sidebar-nav-item').forEach(i => {
        i.classList.toggle('sidebar-nav-item--active', i.dataset.view === view);
    });
    // Hide all views
    $$('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${view}`).classList.add('active');

    const labels = { overview: 'Overview', bookings: 'Bookings', revenue: 'Revenue', settings: 'Settings' };
    $('#topbar-page').textContent = labels[view] || view;

    if (view === 'bookings') { renderBookingsChart(); renderBookingsTable(); }
    if (view === 'revenue') renderRevenueView();
}

// ═══════════════════════════════════════════
// OVERVIEW RENDER
// ═══════════════════════════════════════════
function renderOverview() {
    const sport = activeSport;
    renderStats(sport);   // async — fires and updates in background
    renderDayChips();
    renderTimeline(sport);
    renderBookingsTable(); // async — fires and updates in background
}

// ── Stats ──
async function renderStats(sport) {
    const m = SPORT_META[sport];
    const courts = OCCUPANCY_DATA[sport] || [];
    const occupied = courts.filter(c => c.status === 'occupied').length;

    // Dynamic fetch for bookings count
    const todayStr = new Date().toISOString().split('T')[0];
    const todayData = await fetchBookingsForDate(todayStr, sport);
    const bookings = todayData.length;

    const weekRevenue = (REVENUE_DATA[sport]?.week || []).reduce((a, b) => a + b, 0);

    const statsData = [
        {
            label: 'Active Courts',
            value: `${occupied}/${courts.length}`,
            sub: 'Currently in use',
            icon: m.icon,
            color: 'green',
            change: '+0',
            dir: 'up',
        },
        {
            label: "Today's Bookings",
            value: bookings,
            sub: `${m.label} · All courts`,
            icon: '📅',
            color: 'indigo',
            change: '+2',
            dir: 'up',
        },
        {
            label: 'Weekly Revenue',
            value: `฿${(weekRevenue / 1000).toFixed(1)}k`,
            sub: 'This week',
            icon: '💰',
            color: 'orange',
            change: '+12%',
            dir: 'up',
        },
        {
            label: 'Utilisation',
            value: `${Math.round((occupied / courts.length) * 100)}%`,
            sub: 'Court usage rate',
            icon: '📊',
            color: 'sky',
            change: occupied > courts.length / 2 ? '+5%' : '-3%',
            dir: occupied > courts.length / 2 ? 'up' : 'down',
        },
    ];

    const row = $('#stats-row');
    row.innerHTML = '';
    statsData.forEach(s => {
        const card = el('div', 'stat-card');
        card.setAttribute('data-color', s.color);
        card.innerHTML = `
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
      <div class="stat-change ${s.dir}">${s.dir === 'up' ? '↑' : '↓'} ${s.change}</div>
      <div class="stat-icon">${s.icon}</div>
    `;
        row.appendChild(card);
    });
}

// ── Occupancy cards ──
function renderOccupancy(sport) {
    const courts = OCCUPANCY_DATA[sport] || [];
    const m = SPORT_META[sport];
    const grid = $('#occupancy-grid');
    grid.innerHTML = '';
    courts.forEach(c => {
        const card = el('div', `occupancy-card ${c.status}`);
        card.innerHTML = `
      <div class="occ-court">${c.court}</div>
      <div class="occ-status">
        <span class="occ-status-dot"></span>
        ${c.status.charAt(0).toUpperCase() + c.status.slice(1)}
      </div>
      <div class="occ-detail">${c.detail}</div>
      <div class="occ-sport-icon">${m.icon}</div>
    `;
        grid.appendChild(card);
    });
}

// ── Revenue chart ──
function renderRevenueChart(sport, period) {
    const data = REVENUE_DATA[sport]?.[period] || [];
    const m = SPORT_META[sport];
    const ctx = $('#revenue-chart').getContext('2d');

    const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const labels = period === 'week' ? weekLabels : monthLabels;

    const total = data.reduce((a, b) => a + b, 0);
    const prev = data.slice(0, -1).reduce((a, b) => a + b, 0);
    const lastVal = data[data.length - 1];
    const trendUp = total > prev;

    $('#revenue-total').textContent = `฿${total.toLocaleString()}`;
    $('#revenue-trend').innerHTML = `<span style="color:${trendUp ? '#16a34a' : '#dc2626'}">${trendUp ? '↑' : '↓'} ${Math.abs(Math.round(((lastVal - data[data.length - 2]) / (data[data.length - 2] || 1)) * 100))}%</span> vs previous period`;

    if (revenueChart) revenueChart.destroy();

    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: m.color + '25',
                borderColor: m.color,
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, tooltip: {
                    callbacks: {
                        label: (ctx) => `฿${ctx.raw.toLocaleString()}`,
                    },
                    backgroundColor: '#1e2130',
                    titleColor: '#e2e4f0',
                    bodyColor: '#9ba3b4',
                    borderColor: 'rgba(255,255,255,.08)',
                    borderWidth: 1,
                    padding: 10,
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
                y: {
                    grid: { color: 'rgba(0,0,0,.05)' },
                    ticks: { color: '#9ca3af', font: { size: 11 }, callback: v => `฿${(v / 1000).toFixed(0)}k` },
                    beginAtZero: true,
                },
            },
        },
    });
}

// Period toggle
document.addEventListener('DOMContentLoaded', () => {
    $$('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            revenuePeriod = btn.dataset.period;
            renderRevenueChart(activeSport, revenuePeriod);
        });
    });
});



// ── Bookings Time Slot Chart ──
let bookingsTimeChart = null;
function renderBookingsChart() {
    if (!currentStadium || !activeSport) return;
    const ctx = $('#bookings-time-chart');
    if (!ctx) return;

    const m = SPORT_META[activeSport];

    // Count bookings per hour slot (08:00 – 21:00) from TL_BOOKINGS
    const hourCounts = {};
    for (let h = TL_START_HOUR; h < TL_END_HOUR; h++) hourCounts[h] = 0;

    const sportBookings = TL_BOOKINGS[activeSport] || {};
    Object.values(sportBookings).forEach(courtArr => {
        courtArr.forEach(b => {
            for (let h = b.startH; h < b.endH; h++) {
                if (hourCounts[h] !== undefined) hourCounts[h]++;
            }
        });
    });

    const labels = Object.keys(hourCounts).map(h => `${String(h).padStart(2, '0')}:00`);
    const data = Object.values(hourCounts);

    if (bookingsTimeChart) bookingsTimeChart.destroy();

    bookingsTimeChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Total Bookings',
                data,
                backgroundColor: m.color + '30',
                borderColor: m.color,
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: ctx => `${ctx.raw} booking${ctx.raw !== 1 ? 's' : ''}` },
                    backgroundColor: '#1e2130',
                    titleColor: '#e2e4f0',
                    bodyColor: '#9ba3b4',
                    borderColor: 'rgba(255,255,255,.08)',
                    borderWidth: 1,
                    padding: 10,
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { size: 11 } },
                },
                y: {
                    grid: { color: 'rgba(0,0,0,.05)' },
                    ticks: { color: '#9ca3af', font: { size: 11 }, stepSize: 1, precision: 0 },
                    beginAtZero: true,
                },
            },
        },
    });
}

// ── Bookings table ──
async function renderBookingsTable() {
    if (!currentStadium) return;
    const all = await generateAllBookings(currentStadium.sports);
    const tbody = $('#bookings-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    all.forEach(b => {
        const m = SPORT_META[b.sport];
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td class="tbl-id">${b.id}</td>
      <td class="tbl-name">${b.name}</td>
      <td>
        <span class="tbl-sport-badge" style="background:${m.color}15; color:${m.color}; border: 1px solid ${m.color}30">
          ${m.icon} ${m.label}
        </span>
      </td>
      <td>${b.court}</td>
      <td>${b.date}</td>
      <td>${b.time}</td>
      <td><span class="booking-status ${b.status}">${b.status === 'walk-in' ? 'Walk-in' : b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span></td>
      <td style="font-weight:600; color:var(--text-primary)">${b.amount}</td>
    `;
        tbody.appendChild(tr);
    });
}

// ── Revenue view ──
function renderRevenueView() {
    if (!currentStadium) return;
    const sports = currentStadium.sports;

    // Stats for revenue view
    const statsRow = $('#revenue-stats-row');
    statsRow.innerHTML = '';
    let grandTotal = 0;
    sports.forEach(sport => {
        const m = SPORT_META[sport];
        const weekRev = (REVENUE_DATA[sport]?.week || []).reduce((a, b) => a + b, 0);
        grandTotal += weekRev;
        const card = el('div', 'stat-card');
        card.setAttribute('data-color', 'indigo');
        card.innerHTML = `
      <div class="stat-label">${m.label}</div>
      <div class="stat-value">฿${(weekRev / 1000).toFixed(1)}k</div>
      <div class="stat-sub">This week</div>
      <div class="stat-icon">${m.icon}</div>
    `;
        statsRow.appendChild(card);
    });

    // Revenue by sport chart
    const labels = sports.map(s => SPORT_META[s].label);
    const totals = sports.map(s => (REVENUE_DATA[s]?.week || []).reduce((a, b) => a + b, 0));
    const colors = sports.map(s => SPORT_META[s].color);

    const ctx = $('#revenue-sport-chart').getContext('2d');
    if (revenueSportChart) revenueSportChart.destroy();
    revenueSportChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Weekly Revenue (฿)',
                data: totals,
                backgroundColor: colors.map(c => c + '30'),
                borderColor: colors,
                borderWidth: 2.5,
                borderRadius: 8,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: ctx => `฿${ctx.raw.toLocaleString()}` },
                    backgroundColor: '#1e2130',
                    titleColor: '#e2e4f0',
                    bodyColor: '#9ba3b4',
                    borderColor: 'rgba(255,255,255,.08)',
                    borderWidth: 1,
                    padding: 10,
                },
            },
            scales: {
                x: {
                    grid: { color: 'rgba(0,0,0,.05)' },
                    ticks: { color: '#9ca3af', font: { size: 11 }, callback: v => `฿${(v / 1000).toFixed(0)}k` },
                    beginAtZero: true,
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#374151', font: { size: 13, weight: '600' } },
                },
            },
        },
    });
}

// ═══════════════════════════════════════════
// CALENDAR — Day Chips + Timeline
// ═══════════════════════════════════════════

// Timeline hours range
const TL_START_HOUR = 8;   // 08:00
const TL_END_HOUR = 21;  // 21:00
const TL_HOURS = Array.from({ length: TL_END_HOUR - TL_START_HOUR + 1 }, (_, i) => TL_START_HOUR + i);

// ── Timeline bookings: populated from Firestore on date selection ──
const TL_BOOKINGS = {};

// Days with bookings — populated dynamically from Firestore
const BOOKED_DAYS_SET = new Set();


// Picker state: what year is displayed inside the picker
let pickerYear = new Date().getFullYear();
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function initCalendar() {
    // ── prev/next shift by 7 days ──
    $('#cal-prev').addEventListener('click', () => {
        selectedCalendarDate.setDate(selectedCalendarDate.getDate() - 7);
        calendarDate = new Date(selectedCalendarDate);
        renderDayChips();
        renderTimeline(activeSport);
    });
    $('#cal-next').addEventListener('click', () => {
        selectedCalendarDate.setDate(selectedCalendarDate.getDate() + 7);
        calendarDate = new Date(selectedCalendarDate);
        renderDayChips();
        renderTimeline(activeSport);
    });

    // ── Today ──
    $('#cal-today-btn').addEventListener('click', () => {
        selectedCalendarDate = new Date();
        calendarDate = new Date();
        renderDayChips();
        renderTimeline(activeSport);
    });

    // ── Month picker toggle ──
    const monthBtn = $('#cal-month-label');
    const dropdown = $('#month-picker-dropdown');

    function openPicker() {
        pickerYear = selectedCalendarDate.getFullYear();
        renderMonthPicker();
        dropdown.classList.add('open');
        monthBtn.classList.add('open');
        monthBtn.setAttribute('aria-expanded', 'true');
    }
    function closePicker() {
        dropdown.classList.remove('open');
        monthBtn.classList.remove('open');
        monthBtn.setAttribute('aria-expanded', 'false');
    }

    monthBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.contains('open') ? closePicker() : openPicker();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!$('#month-picker-wrap').contains(e.target)) closePicker();
    });

    // Year prev/next inside picker
    $('#mp-year-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        pickerYear--;
        renderMonthPicker();
    });
    $('#mp-year-next').addEventListener('click', (e) => {
        e.stopPropagation();
        pickerYear++;
        renderMonthPicker();
    });

    renderDayChips();
    renderTimeline(activeSport);
}

// Render the 3×4 month grid inside the picker
function renderMonthPicker() {
    $('#mp-year-label').textContent = pickerYear;
    const grid = $('#mp-month-grid');
    grid.innerHTML = '';
    const currentMonth = selectedCalendarDate.getMonth();
    const currentYear = selectedCalendarDate.getFullYear();

    MONTH_NAMES.forEach((name, idx) => {
        const pill = el('button', 'mp-month-pill' + (idx === currentMonth && pickerYear === currentYear ? ' active' : ''), name);
        pill.addEventListener('click', (e) => {
            e.stopPropagation();
            // Jump to 1st of that month
            selectedCalendarDate = new Date(pickerYear, idx, 1);
            calendarDate = new Date(selectedCalendarDate);
            renderDayChips();
            renderTimeline(activeSport);
            // Close picker
            $('#month-picker-dropdown').classList.remove('open');
            $('#cal-month-label').classList.remove('open');
        });
        grid.appendChild(pill);
    });
}

// Build the day-chip row: 14 days centred on selectedCalendarDate
function renderDayChips() {
    const chips = $('#day-chips');
    const monthText = $('#cal-month-text');
    chips.innerHTML = '';

    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);

    const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const sel = selectedCalendarDate;
    const dateStr = sel.toDateString();
    const isToday = dateStr === today.toDateString();
    const isYesterday = dateStr === yesterday.toDateString();
    const isTomorrow = dateStr === tomorrow.toDateString();

    let dynamicLabel = '';
    if (isToday) dynamicLabel = 'Today';
    else if (isYesterday) dynamicLabel = 'Yesterday';
    else if (isTomorrow) dynamicLabel = 'Tomorrow';
    else {
        dynamicLabel = sel.getDate(); // "keep only the date"
    }

    // Update the button beside the month selector
    const todayBtn = $('#cal-today-btn');
    if (todayBtn) todayBtn.textContent = isToday || isYesterday || isTomorrow ? dynamicLabel : `Day ${dynamicLabel}`;

    // Update toolbar month label (keep this so they know what month they are in)
    monthText.textContent = sel.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Update the date bar above the timeline
    const dateBar = $('#cal-selected-date');
    if (dateBar) {
        const dayName = dayNamesLong[sel.getDay()];
        if (isToday || isYesterday || isTomorrow) {
            dateBar.textContent = `${dynamicLabel}, ${dayName} ${sel.getDate()}`;
        } else {
            dateBar.textContent = `${dayName} ${sel.getDate()}`;
        }
    }

    const startOffset = -3;
    const totalDays = 14;

    for (let i = startOffset; i < startOffset + totalDays; i++) {
        const d = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() + i);
        const dStr = d.toDateString();
        const dIsToday = dStr === today.toDateString();
        const dIsYesterday = dStr === yesterday.toDateString();
        const dIsTomorrow = dStr === tomorrow.toDateString();
        const dIsSelected = dStr === sel.toDateString();
        const hasBook = BOOKED_DAYS_SET.has(d.getDate());

        let dayLabel = '';
        if (dIsToday) dayLabel = 'Today';
        else if (dIsYesterday) dayLabel = 'Yesterday';
        else if (dIsTomorrow) dayLabel = 'Tomorrow';
        else {
            dayLabel = dayNamesShort[d.getDay()]; // Revert to short day name (e.g. "Mon")
        }

        // today-chip (amber) vs active (sport accent) vs plain
        let chipClass = 'day-chip';
        if (dIsToday && dIsSelected) chipClass += ' today-chip';
        else if (dIsSelected) chipClass += ' active';

        const chip = el('div', chipClass);
        chip.innerHTML = `
            <span class="day-chip-name">${dayLabel}</span>
            <span class="day-chip-num">${d.getDate()}</span>
            <span class="day-chip-dot ${hasBook ? '' : 'hidden'}"></span>
        `;
        chip.addEventListener('click', () => {
            selectedCalendarDate = new Date(d);
            renderDayChips();
            renderTimeline(activeSport);
        });
        chips.appendChild(chip);
    }

    requestAnimationFrame(() => {
        const activeChip = chips.querySelector('.today-chip, .active');
        if (activeChip) {
            activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    });
}

// Apply per-sport CSS-variable theme
function applySportTheme(sport) {
    document.body.dataset.sport = sport;
}

// Floating tooltip singleton
// ═══════════════════════════════════════════
// BOOKING STATE MACHINE
// ═══════════════════════════════════════════

// ── Runtime state store ──
// key: 'sport::court::startH'  |  value: state ID string
const bookingStates = {};
function bKey(sport, court, startH) { return `${sport}::${court}::${startH}`; }
function bGetState(sport, court, startH) { return bookingStates[bKey(sport, court, startH)] || 'pending'; }
function bSetState(sport, court, startH, newState) {
    bookingStates[bKey(sport, court, startH)] = newState;
}

// ── Hourly rates (THB) ──
const SPORT_RATES = { football: 1200, basketball: 800, swimming: 500, tennis: 700, badminton: 400 };

// ── Corner icon SVGs ──
const BLOCK_ICONS = {
    app: `<svg class="tl-source-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21
                 l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502
                 l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z"/>
          </svg>`,
    manual: `<svg class="tl-source-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z
                    M3 20a6 6 0 0112 0v1H3v-1z"/>
             </svg>`,
    verified: `<svg class="tl-source-icon tl-icon-verified" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                 <path stroke-linecap="round" stroke-linejoin="round"
                   d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
               </svg>`,
    dollar: `<svg class="tl-source-icon tl-icon-dollar" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2
                    m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1
                    m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
             </svg>`,
};

// ── Formal State Machine definition ──────────────────────────────
//
//  Flow A  (b.status === 'confirmed')   — User App Booking
//  ┌────────────┬────────────────────┬────────────────────────────┐
//  │  State     │  Visual            │  Action → Next State       │
//  ├────────────┼────────────────────┼────────────────────────────┤
//  │  pending   │  Gray  + App icon  │  "Check-in" → completed    │
//  │  completed │  Green + Verified  │  (terminal)                │
//  └────────────┴────────────────────┴────────────────────────────┘
//
//  Flow B  (b.status === 'walk-in')     — Admin / Walk-in
//  ┌────────────┬────────────────────┬────────────────────────────┐
//  │  State     │  Visual            │  Action → Next State       │
//  ├────────────┼────────────────────┼────────────────────────────┤
//  │  pending   │  Gray  + Manual    │  "Check-in" → unpaid       │
//  │  unpaid    │  Yellow + Dollar   │  "Mark as Paid" → completed│
//  │  completed │  Green + Verified  │  (terminal)                │
//  └────────────┴────────────────────┴────────────────────────────┘
//
const BOOKING_FLOWS = {
    confirmed: {                 // Flow A: User App Booking
        initial: 'pending',
        states: {
            pending: {
                cssClass: 'state-pending',
                icon: 'app',
                label: 'Pending',
                badgeCls: 'ap-source-app',
                badgeText: '📱 App Booking',
                actions: [
                    { id: 'checkin', label: '✓ Check-in', btnCls: 'ap-btn-confirm', next: 'completed' },
                ],
            },
            completed: {
                cssClass: 'state-complete',
                icon: 'verified',
                label: 'Completed',
                badgeCls: 'ap-source-app',
                badgeText: '📱 App Booking',
                actions: [],   // terminal
            },
        },
    },

    'walk-in': {                 // Flow B: Admin / Walk-in
        initial: 'pending',
        states: {
            pending: {
                cssClass: 'state-pending',
                icon: 'manual',
                label: 'Pending',
                badgeCls: 'ap-source-walkin',
                badgeText: '🚶 Walk-in',
                actions: [
                    { id: 'checkin', label: '✓ Check-in', btnCls: 'ap-btn-confirm', next: 'unpaid' },
                ],
            },
            unpaid: {
                cssClass: 'state-checked-in',   // yellow
                icon: 'dollar',
                label: 'Unpaid',
                badgeCls: 'ap-source-walkin',
                badgeText: '🚶 Walk-in',
                actions: [
                    { id: 'paid', label: '💰 Mark as Paid', btnCls: 'ap-btn-paid', next: 'completed' },
                ],
            },
            completed: {
                cssClass: 'state-complete',
                icon: 'verified',
                label: 'Paid & Complete',
                badgeCls: 'ap-source-walkin',
                badgeText: '🚶 Walk-in',
                actions: [],   // terminal
            },
        },
    },
};

// Helper: resolve current flow state definition (or null for non-lifecycle statuses)
function getFlowState(b, sport, court) {
    const flow = BOOKING_FLOWS[b.status];
    if (!flow) return null;

    // Default to bGetState for legacy mock data compatibility
    let stateId = bGetState(sport, court, b.startH);

    // Apply new payload logic if the objects have the new properties
    if (b.source === 'walk-in' || b.status === 'walk-in') {
        if (b.isPaid === true) {
            stateId = 'completed';
        } else if (b.currentStage === 'checked-in') {
            stateId = 'unpaid';
        } else if (b.currentStage === 'pending') {
            stateId = 'pending';
        }
    } else if (b.source === 'app' || b.status === 'confirmed') {
        if (b.currentStage === 'checked-in' || b.currentStage === 'completed') {
            stateId = 'completed';
        } else if (b.currentStage === 'pending') {
            stateId = 'pending';
        }
    }

    return { flow, stateId, stateDef: flow.states[stateId] || flow.states[flow.initial] };
}

// ─── Action Popover (singleton) ────────────────────────────────
let _popover = null;
function getPopover() {
    if (!_popover) {
        _popover = document.createElement('div');
        _popover.className = 'action-popover';
        _popover.id = 'action-popover';
        document.body.appendChild(_popover);
        document.addEventListener('click', (e) => {
            if (_popover && !_popover.contains(e.target) && !e.target.closest('.tl-booking')) {
                _popover.classList.remove('visible');
            }
        });
    }
    return _popover;
}

function showActionPopover(e, b, court, sport) {
    e.stopPropagation();
    const pop = getPopover();

    const m = SPORT_META[sport];
    const hours = b.endH - b.startH;
    const amount = hours * (SPORT_RATES[sport] || 600);
    const timeStr = `${String(b.startH).padStart(2, '0')}:00 – ${String(b.endH).padStart(2, '0')}:00`;

    // ── Resolve current state from the machine ──
    const resolved = getFlowState(b, sport, court);

    // (No special conflict case — the system guarantees no double-bookings)

    const { stateId, stateDef } = resolved;
    const isTerminal = stateDef.actions.length === 0;

    // ── Build action buttons from state machine ──
    let actionHTML = '';
    if (isTerminal) {
        actionHTML = `<div class="ap-complete-badge">✅ ${stateDef.label}</div>`;
    } else {
        // Show amount due if in unpaid state
        if (stateId === 'unpaid') {
            actionHTML += `
                <div class="ap-amount-row">
                    <span class="ap-amount-label">Amount Due</span>
                    <span class="ap-amount-value">฿${amount.toLocaleString()}</span>
                </div>
            `;
        }
        stateDef.actions.forEach(action => {
            actionHTML += `<button class="ap-btn ${action.btnCls}" data-action="${action.id}">${action.label}</button>`;
        });
    }

    pop.innerHTML = `
        <button class="ap-close" id="ap-close">✕</button>
        <div class="ap-header">
            <div>
                <div class="ap-title">${b.name}</div>
                <div class="ap-sub">${timeStr} · ${court} · <strong>${stateDef.label}</strong></div>
            </div>
            <span class="ap-source-badge ${stateDef.badgeCls}">${stateDef.badgeText}</span>
        </div>
        <div class="ap-phone">📞 ${b.phone || '—'}</div>
        ${actionHTML}
    `;

    _showPopoverAt(e, pop);

    // ── Wire close ──
    pop.querySelector('#ap-close').addEventListener('click', (ev) => {
        ev.stopPropagation(); pop.classList.remove('visible');
    });

    // ── Wire action buttons (drive transitions from BOOKING_FLOWS) ──
    pop.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            pop.classList.remove('visible');

            const actionId = btn.dataset.action;
            const action = stateDef.actions.find(a => a.id === actionId);
            if (!action) return;

            // Legacy local state
            bSetState(sport, court, b.startH, action.next);

            // ── MOCK BACKEND PATCH REQUEST ──
            let patchPayload = {};
            if (actionId === 'paid') {
                patchPayload = { isPaid: true, currentStage: 'completed' };
                // Update local obj
                b.isPaid = true;
                b.currentStage = 'completed';
            } else if (actionId === 'checkin') {
                patchPayload = { currentStage: 'checked-in' };
                // Update local obj
                b.currentStage = 'checked-in';
            }
            // ── FIRESTORE: Update booking state ──
            if (isFirebaseReady() && b.id) {
                window.db.collection('bookings').doc(b.id)
                    .update(patchPayload)
                    .catch(err => console.warn('Firestore update failed:', err.message));
            }

            // Toast wording based on destination state
            const toasts = {
                completed: b.status === 'walk-in'
                    ? `💰 Payment received · ฿${amount.toLocaleString()} · ${b.name} complete!`
                    : `✅ ${b.name} verified & complete`,
                unpaid: `⏳ ${b.name} checked in — awaiting payment (฿${amount.toLocaleString()})`,
            };
            showToast(toasts[action.next] || `${b.name} → ${action.next}`);
            renderTimeline(sport);
        });
    });
}

function _showPopoverAt(e, pop) {
    let x = e.clientX + 10, y = e.clientY + 10;
    if (x + 275 > window.innerWidth) x = e.clientX - 275;
    if (y + 300 > window.innerHeight) y = e.clientY - 300;
    pop.style.left = `${Math.max(8, x)}px`;
    pop.style.top = `${Math.max(8, y)}px`;
    pop.classList.add('visible');
}

// ─── Build landscape timeline grid ─────────────────────────────
function renderTimeline(sport) {
    const wrap = $('#timeline-inner');
    if (!wrap) return;

    // Preserve scroll position so re-renders don't jump back to 0,0
    const scrollWrap = wrap.parentElement;  // .timeline-wrap
    const savedScrollLeft = scrollWrap ? scrollWrap.scrollLeft : 0;
    const savedScrollTop = scrollWrap ? scrollWrap.scrollTop : 0;

    wrap.innerHTML = '';

    const m = SPORT_META[sport];
    const courts = m.courts;
    const sportBookings = TL_BOOKINGS[sport] || {};

    // ── Header row (hours) ──
    const header = el('div', 'tl-header');
    const courtCol = el('div', 'tl-court-col', 'Court');
    header.appendChild(courtCol);
    const hoursRow = el('div', 'tl-hours');
    TL_HOURS.forEach(h => {
        hoursRow.appendChild(el('div', 'tl-hour-cell', `${String(h).padStart(2, '0')}:00`));
    });
    header.appendChild(hoursRow);
    wrap.appendChild(header);

    // ── Court rows ──
    courts.forEach(court => {
        const row = el('div', 'tl-row');
        const label = el('div', 'tl-row-label', court);
        row.appendChild(label);

        const cells = el('div', 'tl-cells');
        TL_HOURS.forEach(() => cells.appendChild(el('div', 'tl-cell')));

        const bookings = sportBookings[court] || [];
        bookings.forEach(b => {
            const startH = Math.max(b.startH, TL_START_HOUR);
            const endH = Math.min(b.endH, TL_END_HOUR);
            if (startH >= endH) return;

            const totalSpan = TL_END_HOUR - TL_START_HOUR;
            const leftPct = ((startH - TL_START_HOUR) / totalSpan) * 100;
            const widthPct = ((endH - startH) / totalSpan) * 100;

            // ── Resolve visual from state machine ──
            const isReserved = b.status === 'reserved';
            const flowResolved = getFlowState(b, sport, court);

            let blockCls = 'tl-booking';
            let sourceIcon = '';

            if (isReserved) {
                blockCls += ' reserved';
            } else if (flowResolved) {
                // Lifecycle booking — class and icon come from BOOKING_FLOWS
                blockCls += ` ${flowResolved.stateDef.cssClass}`;
                sourceIcon = BLOCK_ICONS[flowResolved.stateDef.icon] || '';
            }

            const block = el('div', blockCls);
            block.style.left = `${leftPct}%`;
            block.style.width = `${widthPct}%`;

            block.innerHTML = `
                <div class="tl-booking-name">${m.icon} ${b.name}</div>
                <div class="tl-booking-time">${String(startH).padStart(2, '0')}:00 – ${String(endH).padStart(2, '0')}:00</div>
                ${sourceIcon}
            `;

            // Open-match counter badge
            if (b.openMatch) {
                block.appendChild(el('div', 'tl-match-badge', b.openMatch));
            }

            // Click → popover only for lifecycle bookings
            if (flowResolved) {
                block.addEventListener('click', (e) => showActionPopover(e, b, court, sport));
            }

            cells.appendChild(block);
        });

        row.appendChild(cells);
        wrap.appendChild(row);
    });

    // Restore scroll position after DOM update
    if (scrollWrap) {
        requestAnimationFrame(() => {
            scrollWrap.scrollLeft = savedScrollLeft;
            scrollWrap.scrollTop = savedScrollTop;
        });
    }
}

// Called from renderOverview / sport switcher — pass new sport
function refreshCalendarForSport(sport) {
    renderTimeline(sport);
}

// ═══════════════════════════════════════════
// WALK-IN MODAL
// ═══════════════════════════════════════════
function buildWalkInModal(sports) {
    const sportSel = $('#walkin-sport');
    sportSel.innerHTML = '';
    sports.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = `${SPORT_META[s].icon} ${SPORT_META[s].label}`;
        sportSel.appendChild(o);
    });

    // Populate court on sport change
    function updateCourts() {
        const sport = sportSel.value;
        const courtSel = $('#walkin-court');
        courtSel.innerHTML = SPORT_META[sport].courts.map(c => `<option>${c}</option>`).join('');
    }
    updateCourts();
    sportSel.addEventListener('change', updateCourts);

    // Set default date to today
    const today = new Date();
    $('#walkin-date').value = today.toISOString().split('T')[0];
}

function initWalkInModal() {
    const overlay = $('#modal-overlay');
    const form = $('#walkin-form');

    function openModal() {
        overlay.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        checkAvailability();
    }
    function closeModal() {
        overlay.classList.remove('modal-open');
        document.body.style.overflow = '';
        form.reset();
        const ind = $('#avail-indicator');
        if (ind) ind.className = 'avail-indicator avail-unknown';
    }

    // Live availability check
    function checkAvailability() {
        const ind = $('#avail-indicator');
        if (!ind) return;
        const sport = $('#walkin-sport').value;
        const court = $('#walkin-court').value;
        const time = $('#walkin-time').value;
        if (!sport || !court || !time) {
            ind.className = 'avail-indicator avail-unknown';
            ind.textContent = '— Select sport, court and time to check availability';
            return;
        }
        // Parse hour from selected slot e.g. "09:00 – 10:00"
        const slotStart = parseInt(time.split(':')[0]);
        const bookings = (TL_BOOKINGS[sport] && TL_BOOKINGS[sport][court]) || [];
        const conflict = bookings.find(b => slotStart >= b.startH && slotStart < b.endH);
        if (conflict) {
            ind.className = 'avail-indicator avail-conflict';
            ind.textContent = `⚠ Conflict — ${court} is booked by "${conflict.name}" at this time`;
        } else {
            ind.className = 'avail-indicator avail-free';
            ind.textContent = `✓ Available — ${court} is free for this slot`;
        }
    }

    $('#add-walkin-btn').addEventListener('click', openModal);
    const btn2 = $('#add-walkin-btn-2');
    if (btn2) btn2.addEventListener('click', openModal);
    $('#modal-close').addEventListener('click', closeModal);
    $('#modal-cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    // Re-check availability when sport/court/time changes
    ['#walkin-sport', '#walkin-court', '#walkin-time'].forEach(sel => {
        const el_ = $(sel);
        if (el_) el_.addEventListener('change', checkAvailability);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#walkin-name').value.trim();
        const phone = $('#walkin-phone') ? $('#walkin-phone').value.trim() : '';
        const sport = $('#walkin-sport').value;
        const court = $('#walkin-court').value;
        const time = $('#walkin-time').value;   // e.g. "09:00 – 10:00"
        const ind = $('#avail-indicator');

        if (ind && ind.classList.contains('avail-conflict')) {
            showToast('⚠ Cannot book — conflict detected! Please choose another slot.');
            return;
        }

        // ── Parse start/end hours from the time slot string ──
        const parts = time.split('–').map(s => s.trim());          // ["09:00", "10:00"]
        const startH = parseInt(parts[0]);                          // 9
        const endH = parts[1] ? parseInt(parts[1]) : startH + 1;  // 10

        const newBooking = {
            id: `BK-${Math.floor(Date.now() / 1000)}`,
            startH,
            endH,
            name: name || 'Walk-in',
            phone: phone || '—',
            status: 'walk-in',
            source: 'walk-in',
            currentStage: 'pending',
            courtId: court,
            stadiumId: currentStadium ? currentStadium.id : 'unknown',
            price: (endH - startH) * (SPORT_RATES[sport] || 600),
            isPaid: false,
            date: selectedCalendarDate.toISOString().split('T')[0]
        };

        // ── FIRESTORE: Save new booking ──
        if (isFirebaseReady()) {
            window.db.collection('bookings').add(newBooking)
                .catch(err => console.warn('Firestore add failed:', err.message));
        }

        // ── Also inject locally so timeline updates instantly (optimistic UI) ──
        if (!TL_BOOKINGS[sport]) TL_BOOKINGS[sport] = {};
        if (!TL_BOOKINGS[sport][court]) TL_BOOKINGS[sport][court] = [];

        TL_BOOKINGS[sport][court].push(newBooking);


        closeModal();
        showToast(`✅ Booked! ${SPORT_META[sport].icon} ${name} · ${court} · ${time}`);

        // Re-render timeline if the booking is for the currently viewed sport
        if (sport === activeSport) {
            renderTimeline(sport);
        }
    });
}

// ═══════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════
function showToast(msg, duration = 4000) {
    const toast = $('#toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.classList.remove('exiting');
    if (toast._timer) clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.add('exiting');
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, duration);
}

// ═══════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════
function initNotifications() {
    const notifBtn = $('#notif-btn');
    const notifDropdown = $('#notif-dropdown');

    if (!notifBtn || !notifDropdown) return;

    function toggleDropdown(e) {
        e.stopPropagation();
        const isOpen = notifDropdown.classList.contains('show');

        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    function openDropdown() {
        notifDropdown.classList.add('show');
        notifBtn.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
        notifDropdown.classList.remove('show');
        notifBtn.setAttribute('aria-expanded', 'false');
    }

    notifBtn.addEventListener('click', toggleDropdown);

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
            closeDropdown();
        }
    });

    // Mark all as read mock
    const markReadBtn = $('.notif-mark-read');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.notif-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
            const badge = $('.notif-badge');
            if (badge) badge.style.display = 'none';
        });
    }

    // View all notifications mock
    const viewAllBtn = document.querySelector('.notif-footer a');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeDropdown();
            showToast('The "All Notifications" view is under construction!');
        });
    }
}

// ═══════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════
function logOut() {
    currentStadium = null;
    activeSport = null;
    activeView = 'overview';
    if (revenueChart) { revenueChart.destroy(); revenueChart = null; }
    if (revenueSportChart) { revenueSportChart.destroy(); revenueSportChart = null; }
    $('#login-form').reset();
    $('#login-error').style.display = 'none';
    showScreen('screen-login');
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initNotifications();
    showScreen('screen-login');
});
