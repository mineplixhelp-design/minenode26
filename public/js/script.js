// Struktur Sidebar Menu menggunakan Clean Path URL
const sidebarMenu = [
  { id: "/", label: "Home", type: "single" },
  {
    id: "gameplay",
    label: "Panduan Gameplay",
    type: "dropdown",
    children: [
      { id: "/tutor/land", label: "Tutorial Land" },
      { id: "/tutor/eco", label: "Tutorial Economy" },
      { id: "/tutor/esentials", label: "Tutorial Home Teleport Rtp Warp Essentials" }
    ]
  },
  { id: "/rules", label: "Rules & Regulasi", type: "single" },
  { id: "/ecostats", label: "Economies and Stats Update", type: "single" },
  { id: "/ranksinfo", label: "Server Ranks Badge", type: "single" }
];

let activeTabIndex = 0;
let currentPageData = null;

function getCurrentPath() {
  const path = window.location.pathname;
  // Hapus trailing slash jika ada (kecuali untuk root "/")
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path === "" ? "/" : path;
}

function createLinkWrapper(element, link) {
  if (!link) return element;
  const anchor = document.createElement('a');
  anchor.className = 'clickable-node';
  if (link.startsWith('http://') || link.startsWith('https://')) {
    anchor.href = link;
    anchor.target = '_blank';
  } else {
    anchor.href = link;
  }
  anchor.appendChild(element);
  return anchor;
}

function initSidebarNav() {
  const navContainer = document.getElementById('sidebarNavContainer');
  if (!navContainer) return;
  navContainer.innerHTML = '';

  const currentPath = getCurrentPath();

  sidebarMenu.forEach(menu => {
    if (menu.type === "single") {
      const itemA = document.createElement('a');
      itemA.className = `nav-item ${menu.id === currentPath ? 'active' : ''}`;
      itemA.href = menu.id;
      itemA.innerHTML = `<span class="label">${menu.label}</span>`;
      navContainer.appendChild(itemA);
    } else if (menu.type === "dropdown") {
      const hasActiveChild = menu.children.some(child => child.id === currentPath);

      const dropDiv = document.createElement('div');
      dropDiv.className = `nav-item nav-dropdown ${hasActiveChild ? 'active' : ''}`;
      dropDiv.innerHTML = `<span class="label">${menu.label}</span><i class="fa-solid fa-chevron-down dropdown-arrow"></i>`;

      const subDiv = document.createElement('div');
      subDiv.className = 'submenu';

      menu.children.forEach(child => {
        const childA = document.createElement('a');
        childA.className = `nav-item ${child.id === currentPath ? 'active' : ''}`;
        childA.href = child.id;
        childA.innerHTML = `<span class="label">${child.label}</span>`;
        subDiv.appendChild(childA);
      });

      dropDiv.addEventListener('click', (e) => {
        e.preventDefault();
        dropDiv.classList.toggle('active');
      });

      navContainer.appendChild(dropDiv);
      navContainer.appendChild(subDiv);
    }
  });
}

async function loadPageData(jsonTarget) {
  try {
    // Mengarahkan fetch ke direktori ../public/json/
    const response = await fetch(`../public/json/${jsonTarget}.json`);
    if (!response.ok) throw new Error("Gagal memuat JSON");
    currentPageData = await response.json();
    activeTabIndex = 0;
    renderPage(currentPageData);
  } catch (err) {
    console.error("Error loading page data:", err);
    document.getElementById('contentBody').innerHTML = `<div class="callout-box callout-info">Gagal memuat konten dari ../public/json/${jsonTarget}.json</div>`;
  }
}

function renderPage(page) {
  const breadcrumbContainer = document.getElementById('breadcrumbContainer');
  if (breadcrumbContainer && page.breadcrumb) {
    breadcrumbContainer.innerHTML = page.breadcrumb.map((item, idx) => {
      return idx < page.breadcrumb.length - 1 ? `${item} <span>/</span> ` : item;
    }).join('');
  }

  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.innerText = page.title || "";

  const tabsContainer = document.getElementById('tabsContainer');
  if (tabsContainer) {
    tabsContainer.innerHTML = '';
    if (page.tabs) {
      page.tabs.forEach((tab, index) => {
        const tabEl = document.createElement('div');
        tabEl.className = `tab ${index === activeTabIndex ? 'active' : ''}`;
        tabEl.innerText = tab.label;
        tabEl.addEventListener('click', () => {
          activeTabIndex = index;
          renderPage(page);
        });
        tabsContainer.appendChild(tabEl);
      });
    }
  }

  if (page.tabs && page.tabs[activeTabIndex]) {
    renderTabContent(page.tabs[activeTabIndex]);
  }
}

function renderTabContent(tabData) {
  const contentBody = document.getElementById('contentBody');
  if (!contentBody) return;
  contentBody.innerHTML = '';

  if (!tabData || !tabData.sections) return;

  tabData.sections.forEach(sec => {
    if (sec.type === "stats_grid") {
      const gridDiv = document.createElement('div');
      gridDiv.className = 'info-stats-grid';
      sec.items.forEach(st => {
        const statNode = document.createElement('div');
        statNode.className = 'stat-item';
        statNode.innerHTML = `<i class="${st.icon}"></i><span>${st.text}</span>`;
        gridDiv.appendChild(createLinkWrapper(statNode, st.link));
      });
      contentBody.appendChild(gridDiv);
    } 
    else if (sec.type === "profile_card") {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<div class="section-title-bar"><h3>${sec.title}</h3></div>`;
      const listDiv = document.createElement('div');
      listDiv.className = 'staff-list';
      sec.profiles.forEach(p => {
        const profNode = document.createElement('div');
        profNode.className = 'staff-card';
        profNode.innerHTML = `
          <img src="${p.avatar}" alt="${p.name}" class="staff-avatar">
          <div class="staff-info">
            <h4>${p.name} ${p.badge ? `<span class="badge badge-primary">${p.badge}</span>` : ''}</h4>
            <p>${p.role}</p>
          </div>
        `;
        listDiv.appendChild(createLinkWrapper(profNode, p.link));
      });
      wrap.appendChild(listDiv);
      contentBody.appendChild(wrap);
    }
    else if (sec.type === "faq_accordion") {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<div class="section-title-bar"><h3>${sec.title}</h3></div>`;
      const accDiv = document.createElement('div');
      accDiv.className = 'accordion';

      sec.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `accordion-item ${item.active ? 'active' : ''}`;
        let chaptersHtml = item.chapters.map(ch => `<li class="chapter-item">${ch}</li>`).join('');

        itemDiv.innerHTML = `
          <div class="accordion-header">
            <div class="accordion-header-title">${item.title}</div>
            <div class="accordion-header-count">
              <span>${item.countText}</span>
              <i class="fa-solid fa-chevron-down chevron-icon"></i>
            </div>
          </div>
          <div class="accordion-content">
            <ul class="chapter-list">${chaptersHtml}</ul>
          </div>
        `;

        itemDiv.querySelector('.accordion-header').addEventListener('click', () => {
          const isActive = itemDiv.classList.contains('active');
          accDiv.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
          if (!isActive) itemDiv.classList.add('active');
        });

        accDiv.appendChild(itemDiv);
      });

      wrap.appendChild(accDiv);
      contentBody.appendChild(wrap);
    }
    else if (sec.type === "card") {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card-container';
      cardDiv.innerHTML = `
        <div class="section-title-bar">
          <h3>${sec.title}</h3>
          ${sec.desc ? `<p class="section-desc">${sec.desc}</p>` : ''}
        </div>
      `;
      if (sec.subcards) {
        sec.subcards.forEach(sc => {
          const subNode = document.createElement('div');
          subNode.className = 'subcard';
          subNode.innerHTML = `<h5>${sc.title}</h5><p>${sc.desc}</p>`;
          cardDiv.appendChild(createLinkWrapper(subNode, sc.link));
        });
      }
      contentBody.appendChild(createLinkWrapper(cardDiv, sec.link));
    }
    else if (sec.type === "grid_card") {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<div class="section-title-bar"><h3>${sec.title}</h3></div>`;
      const gridDiv = document.createElement('div');
      gridDiv.className = 'grid-card-container';
      sec.items.forEach(gi => {
        const gridItemNode = document.createElement('div');
        gridItemNode.className = 'grid-card-item';
        gridItemNode.innerHTML = `
          <h4 style="font-size:13px; font-weight:600;">${gi.title}</h4>
          <p style="font-size:12px; color:var(--text-muted);">${gi.desc}</p>
        `;
        gridDiv.appendChild(createLinkWrapper(gridItemNode, gi.link));
      });
      wrap.appendChild(gridDiv);
      contentBody.appendChild(wrap);
    }
    else if (sec.type === "bar_card") {
      const barDiv = document.createElement('div');
      barDiv.className = 'bar-card-clean';
      barDiv.innerHTML = `
        <span class="bar-card-title">${sec.title}</span>
        <span class="bar-card-value">${sec.value}</span>
      `;
      contentBody.appendChild(createLinkWrapper(barDiv, sec.link));
    }
    else if (sec.type === "callout") {
      const calloutDiv = document.createElement('div');
      calloutDiv.className = `callout-box callout-${sec.style || 'info'}`;
      calloutDiv.innerHTML = `
        <i class="${sec.icon || 'fa-solid fa-circle-info'}"></i>
        <div>
          ${sec.title ? `<strong style="display:block; margin-bottom:2px;">${sec.title}</strong>` : ''}
          <span>${sec.text}</span>
        </div>
      `;
      contentBody.appendChild(createLinkWrapper(calloutDiv, sec.link));
    }
    else if (sec.type === "commands") {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<div class="section-title-bar"><h3>${sec.title}</h3></div>`;
      const cmdList = document.createElement('div');
      cmdList.className = 'command-list';
      sec.items.forEach(cmd => {
        const cmdNode = document.createElement('div');
        cmdNode.className = 'command-item';
        cmdNode.innerHTML = `
          <div><salin>${cmd.command}</salin></div>
          <span class="command-desc">${cmd.desc}</span>
        `;
        cmdList.appendChild(createLinkWrapper(cmdNode, cmd.link));
      });
      wrap.appendChild(cmdList);
      contentBody.appendChild(wrap);
    }
    else if (sec.type === "economy_table") {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="section-title-bar">
          <h3>${sec.title}</h3>
          ${sec.desc ? `<p class="section-desc">${sec.desc}</p>` : ''}
        </div>
      `;
      const tableWrap = document.createElement('div');
      tableWrap.className = 'table-wrapper';
      const table = document.createElement('table');
      table.className = 'economy-table';

      let ths = sec.headers.map(h => `<th>${h}</th>`).join('');
      let trs = sec.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');

      table.innerHTML = `<thead><tr>${ths}</tr></thead><tbody>${trs}</tbody>`;
      tableWrap.appendChild(table);
      wrap.appendChild(tableWrap);
      contentBody.appendChild(wrap);
    }
  });

  bindCopyEvents();
}

function bindCopyEvents() {
  const salinElements = document.querySelectorAll('salin, .copy-inline');
  salinElements.forEach(el => {
    el.removeEventListener('click', handleCopy);
    el.addEventListener('click', handleCopy);
  });
}

function handleCopy(e) {
  e.stopPropagation();
  const textToCopy = e.currentTarget.innerText.trim();
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast(`Berhasil salin: "${textToCopy}"`);
  }).catch(() => {
    showToast("Gagal menyalin teks.");
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// Inisialisasi Event Listener Theme dan Sidebar Mobile
document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const body = document.body;
  const savedTheme = localStorage.getItem('theme') || 'dark';
  body.setAttribute('data-theme', savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = body.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      body.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  const sidebarToggle = document.getElementById('sidebarToggle');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.add('show');
      sidebarOverlay.classList.add('show');
    });
  }

  const closeSidebar = () => {
    sidebar.classList.remove('show');
    sidebarOverlay.classList.remove('show');
  };

  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  // Jalankan render sidebar
  initSidebarNav();

  // Memuat file JSON sesuai atribut `data-page-json` pada tag <body>
  const jsonTarget = body.getAttribute('data-page-json');
  if (jsonTarget) {
    loadPageData(jsonTarget);
  }
});
