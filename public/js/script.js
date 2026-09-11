document.addEventListener('DOMContentLoaded', () => {
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

  let initialJson = getJsonNameFromUrl();
  document.body.setAttribute('data-page-json', initialJson);
  loadPageData(initialJson);

  window.addEventListener('popstate', () => {
    const currentJson = getJsonNameFromUrl();
    document.body.setAttribute('data-page-json', currentJson);
    loadPageData(currentJson);
  });
});

async function loadPageData(jsonName) {
  const contentBody = document.getElementById('contentBody');
  const pageTitle = document.getElementById('pageTitle');
  const breadcrumbContainer = document.getElementById('breadcrumbContainer');

  try {
    if (contentBody) {
      contentBody.innerHTML = '<div style="text-align:center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat konten...</div>';
    }

    const response = await fetch(`/json/${jsonName}.json`);
    if (!response.ok) throw new Error(`File JSON tidak ditemukan`);

    const data = await response.json();

    // Set Meta & Header
    if (data.title) {
      document.title = `Mineplix - ${data.title}`;
      if (pageTitle) pageTitle.textContent = data.title;
    }
    if (breadcrumbContainer) {
      breadcrumbContainer.textContent = Array.isArray(data.breadcrumb) ? data.breadcrumb.join(' / ') : (data.breadcrumb || 'Home');
    }

    // Dynamic Render Engine
    if (contentBody) {
      let htmlOutput = '';

      // 1. Jika pakai format lama (HTML string)
      if (data.content) {
        htmlOutput = data.content;
      } 
      // 2. Jika pakai format baru (Tabs & Sections array)
      else if (data.tabs && Array.isArray(data.tabs)) {
        data.tabs.forEach(tab => {
          if (tab.sections && Array.isArray(tab.sections)) {
            tab.sections.forEach(section => {
              htmlOutput += renderSection(section);
            });
          }
        });
      }

      contentBody.innerHTML = htmlOutput || '<p>Konten kosong.</p>';
    }

  } catch (error) {
    console.error('Error loading page JSON:', error);
    if (pageTitle) pageTitle.textContent = '404 - Not Found';
    if (contentBody) {
      contentBody.innerHTML = `
        <div style="text-align: center; padding: 40px 0;">
          <h2>Halaman Tidak Ditemukan</h2>
          <p>File <code>/json/${jsonName}.json</code> belum siap atau bermasalah.</p>
        </div>
      `;
    }
  }
}

// Helper untuk merender komponen section dari JSON
function renderSection(sec) {
  switch (sec.type) {
    case 'commands':
      return `
        <div class="section-block">
          <h3>${sec.title || ''}</h3>
          <div class="commands-list">
            ${(sec.items || []).map(item => `
              <div class="command-item" style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; margin-bottom:8px; border-radius:6px;">
                <code>${item.command}</code>
                <span style="opacity:0.8;">${item.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;

    case 'card':
      return `
        <div class="card-block" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); padding:16px; border-radius:8px; margin-bottom:16px;">
          <h3>${sec.title || ''}</h3>
          <p>${sec.desc || ''}</p>
          ${sec.subcards ? `
            <div class="subcards-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-top:12px;">
              ${sec.subcards.map(sub => `
                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:6px;">
                  <strong>${sub.title}</strong>
                  <p style="font-size:13px; margin-top:4px;">${sub.desc}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;

    case 'callout':
      return `
        <div class="callout-block ${sec.style || 'info'}" style="background:rgba(59,130,246,0.1); border-left:4px solid #3b82f6; padding:12px; border-radius:4px; margin-bottom:16px;">
          <strong><i class="${sec.icon || 'fa-solid fa-info-circle'}"></i> ${sec.title || ''}</strong>
          <p style="margin-top:4px;">${sec.text || ''}</p>
        </div>
      `;

    case 'profile_card':
      return `
        <div class="profile-section" style="margin-bottom:16px;">
          <h3>${sec.title || ''}</h3>
          <div class="profiles-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-top:10px;">
            ${(sec.profiles || []).map(p => `
              <div class="profile-card" style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
                <img src="${p.avatar}" alt="${p.name}" style="width:40px; height:40px; border-radius:50%;">
                <div>
                  <div style="font-weight:bold;">${p.name} <span style="font-size:10px; background:#3b82f6; padding:2px 6px; border-radius:4px;">${p.badge}</span></div>
                  <div style="font-size:12px; opacity:0.7;">${p.role}</div>
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
