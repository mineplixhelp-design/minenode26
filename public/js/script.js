document.addEventListener('DOMContentLoaded', () => {
  // 1. Pemetaan URL ke Nama File JSON
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

  // 2. Fungsi Ekstrak Route dari URL
  function getJsonNameFromUrl() {
    const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return routeMap[rawPath] || rawPath;
  }

  // 3. Inisialisasi Halaman Pertama Kali
  let initialJson = getJsonNameFromUrl();
  document.body.setAttribute('data-page-json', initialJson);
  loadPageData(initialJson);

  // 4. Handle Tombol Back/Forward Browser (Popstate)
  window.addEventListener('popstate', () => {
    const currentJson = getJsonNameFromUrl();
    document.body.setAttribute('data-page-json', currentJson);
    loadPageData(currentJson);
  });

  // 5. Intersepsi Klik Link Internal (Agar Navigasi Tanpa Reload)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.origin === window.location.origin && !link.getAttribute('target')) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http')) {
        e.preventDefault();
        window.history.pushState({}, '', href);
        
        const nextJson = getJsonNameFromUrl();
        document.body.setAttribute('data-page-json', nextJson);
        loadPageData(nextJson);
      }
    }
  });
});

// 6. Fungsi Fetch & Render Data JSON
async function loadPageData(jsonName) {
  const contentBody = document.getElementById('contentBody');
  const pageTitle = document.getElementById('pageTitle');
  const breadcrumbContainer = document.getElementById('breadcrumbContainer');

  try {
    if (contentBody) {
      contentBody.innerHTML = '<div style="text-align:center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat konten...</div>';
    }

    // Fetch file JSON dari public/json/[jsonName].json
    const response = await fetch(`/json/${jsonName}.json`);

    if (!response.ok) {
      throw new Error(`File /json/${jsonName}.json tidak ditemukan (${response.status})`);
    }

    const data = await response.json();

    // Set Judul Tab Browser & Title Halaman
    if (data.title) {
      document.title = `Mineplix - ${data.title}`;
      if (pageTitle) pageTitle.textContent = data.title;
    }

    // Set Breadcrumb
    if (breadcrumbContainer) {
      breadcrumbContainer.textContent = data.breadcrumb || `Home / ${data.title || jsonName}`;
    }

    // Render Konten Utama
    if (contentBody) {
      contentBody.innerHTML = data.content || '<p>Konten kosong.</p>';
    }

  } catch (error) {
    console.error('Error loading page JSON:', error);
    if (pageTitle) pageTitle.textContent = '404 - Not Found';
    if (breadcrumbContainer) breadcrumbContainer.textContent = 'Error';
    if (contentBody) {
      contentBody.innerHTML = `
        <div style="text-align: center; padding: 40px 0;">
          <h2>Halaman Tidak Ditemukan</h2>
          <p>File JSON <code>/json/${jsonName}.json</code> belum dibuat atau bermasalah.</p>
        </div>
      `;
    }
  }
}
