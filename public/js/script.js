document.addEventListener('DOMContentLoaded', () => {
  // Cache untuk menyimpan data JSON yang sudah pernah dimuat agar tidak fetch ulang
  const jsonCache = {};

  // 1. Pemetaan URL ke File JSON
  const routeMap = {
    '': 'home',
    'home': 'home',
    'land': 'tutorland',
    'tutorland': 'tutorland',
    'eco': 'tutoreco',
    'tutoreco': 'tutoreco',
    'essentials': 'tutoresentials',
    'tutoresentials': 'tutoresentials',
    'rules': 'rules',
    'statseco': 'statseco',
    'ranks': 'ranks'
  };

  function getJsonNameFromUrl() {
    const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return routeMap[rawPath] || rawPath;
  }

  // 2. Setup Sidebar Toggle (Buka & Tutup Menu Mobile)
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('active');
    if (sidebarOverlay) sidebarOverlay.classList.add('active');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }

  if (sidebarToggle) sidebarToggle.addEventListener('click', openSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  // 3. Initial Load & History Popstate
  let initialJson = getJsonNameFromUrl();
  document.body.setAttribute('data-page-json', initialJson);
  loadPageData(initialJson);

  window.addEventListener('popstate', () => {
    const currentJson = getJsonNameFromUrl();
    document.body.setAttribute('data-page-json', currentJson);
    loadPageData(currentJson);
  });

  // 4. Intersepsi Link Navigasi Internal
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.origin === window.location.origin && !link.getAttribute('target')) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http')) {
        e.preventDefault();
        closeSidebar(); // Otomatis tutup sidebar saat menu diklik di mobile
        
        window.history.pushState({}, '', href);
        const nextJson = getJsonNameFromUrl();
        document.body.setAttribute('data-page-json', nextJson);
        loadPageData(nextJson);
      }
    }
  });

  // 5. Load Data JSON dengan Caching & Transisi Cepat
  async function loadPageData(jsonName) {
    const contentBody = document.getElementById('contentBody');
    const pageTitle = document.getElementById('pageTitle');
    const breadcrumbContainer = document.getElementById('breadcrumbContainer');

    try {
      if (contentBody) {
        contentBody.style.opacity = '0.4'; // Transisi halus tanpa merusak layout
      }

      let data;
      // Gunakan cache jika data JSON sudah pernah didownload
      if (jsonCache[jsonName]) {
        data = jsonCache[jsonName];
      } else {
        const response = await fetch(`/json/${jsonName}.json`);
        if (!response.ok) throw new Error('File JSON tidak ditemukan');
        data = await response.json();
        jsonCache[jsonName] = data; // Simpan ke cache
      }

      // Update Header & Breadcrumb
      if (data.title) {
        document.title = `Mineplix - ${data.title}`;
        if (pageTitle) pageTitle.textContent = data.title;
      }
      if (breadcrumbContainer) {
        breadcrumbContainer.textContent = Array.isArray(data.breadcrumb) 
          ? data.breadcrumb.join(' / ') 
          : (data.breadcrumb || 'Home');
      }

      // Render Layout
      if (contentBody) {
        let htmlOutput = '';
        if (data.content) {
          htmlOutput = data.content;
        } else if (data.tabs && Array.isArray(data.tabs)) {
          data.tabs.forEach(tab => {
            if (tab.sections && Array.isArray(tab.sections)) {
              tab.sections.forEach(section => {
                htmlOutput += renderSection(section);
              });
            }
          });
        }
        contentBody.innerHTML = htmlOutput || '<p>Konten kosong.</p>';
        contentBody.style.opacity = '1';
      }

    } catch (error) {
      console.error('Error loading page JSON:', error);
      if (pageTitle) pageTitle.textContent = '404 - Not Found';
      if (contentBody) {
        contentBody.innerHTML = `
          <div style="text-align: center; padding: 40px 0;">
            <h2>Halaman Tidak Ditemukan</h2>
            <p>File <code>/json/${jsonName}.json</code> tidak ditemukan.</p>
          </div>
        `;
        contentBody.style.opacity = '1';
      }
    }
  }
});

// Helper Render Komponen
function renderSection(sec) {
  switch (sec.type) {
    case 'commands':
      return `
        <div class="section-block" style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">${sec.title || ''}</h3>
          <div class="commands-list">
            ${(sec.items || []).map(item => `
              <div class="command-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px 14px; margin-bottom:8px; border-radius:6px;">
                <code>${item.command}</code>
                <span style="opacity:0.8; font-size: 13px;">${item.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;

    case 'card':
      return `
        <div class="card-block" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:8px; margin-bottom:16px;">
          <h3 style="margin-bottom: 8px;">${sec.title || ''}</h3>
          <p style="opacity: 0.9; line-height: 1.5;">${sec.desc || ''}</p>
          ${sec.subcards ? `
            <div class="subcards-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-top:14px;">
              ${sec.subcards.map(sub => `
                <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:6px;">
                  <strong style="display:block; margin-bottom:4px;">${sub.title}</strong>
                  <span style="font-size:13px; opacity:0.8;">${sub.desc}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;

    case 'callout':
      return `
        <div class="callout-block ${sec.style || 'info'}" style="background:rgba(59,130,246,0.1); border-left:4px solid #3b82f6; padding:12px 16px; border-radius:4px; margin-bottom:16px;">
          <strong style="display:flex; align-items:center; gap:8px;">
            <i class="${sec.icon || 'fa-solid fa-info-circle'}"></i> ${sec.title || ''}
          </strong>
          <p style="margin-top:6px; opacity:0.9;">${sec.text || ''}</p>
        </div>
      `;

    case 'profile_card':
      return `
        <div class="profile-section" style="margin-bottom:20px;">
          <h3 style="margin-bottom:12px;">${sec.title || ''}</h3>
          <div class="profiles-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
            ${(sec.profiles || []).map(p => `
              <div class="profile-card" style="display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:8px;">
                <img src="${p.avatar}" alt="${p.name}" style="width:42px; height:42px; border-radius:50%;">
                <div>
                  <div style="font-weight:bold; font-size:14px;">${p.name} <span style="font-size:10px; background:#3b82f6; color:#fff; padding:2px 6px; border-radius:4px; margin-left:4px;">${p.badge}</span></div>
                  <div style="font-size:12px; opacity:0.7; margin-top:2px;">${p.role}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

    default:
      return '';
  }
}
