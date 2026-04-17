// Only load strictly from data.js. No localStorage caching to avoid mismatch bugs!
const data = window.templeData;

function init() {
  applyGlobalSettings();
  renderDeities();
  renderStory();
  renderPoojas();
  renderUlsavam();
  renderVidhana();
  renderGalleryTabs();
  renderTrustees();
  renderContacts();

  // Animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function applyGlobalSettings() {
  if (data.global && data.global.heroImage) {
    const heroBg = document.getElementById('heroBgImg');
    if(heroBg) heroBg.style.backgroundImage = `url(${data.global.heroImage})`;
  }

  if (data.global && data.global.notification && data.global.notification.enabled) {
    const modal = document.getElementById('notificationModal');
    const mTitle = document.getElementById('notifTitle');
    const mBody = document.getElementById('notifBody');
    if(modal && mTitle && mBody) {
      mTitle.innerText = data.global.notification.title;
      mBody.innerText = data.global.notification.text;
      setTimeout(() => modal.classList.add('active'), 800);
    }
  }
}

function renderDeities() {
  const grid = document.getElementById('deitiesGrid');
  if (!grid) return;
  grid.innerHTML = data.deities.map(d => `
    <div class="deity-card">
      <div class="deity-icon">${d.icon}</div>
      <div class="deity-name">${d.name}</div>
      ${d.main ? `<div class="deity-main">${d.main}</div>` : ''}
      <div class="deity-desc">${d.desc}</div>
    </div>
  `).join('');
}

function renderStory() {
  const container = document.getElementById('storyContent');
  if (!container) return;
  container.innerHTML = data.story.map(p => `<p>${p}</p>`).join('');
}

function renderPoojas() {
  const grid = document.getElementById('poojasGrid');
  if (!grid) return;
  grid.innerHTML = data.poojas.map(p => `
    <div class="pooja-card">
      <div class="pooja-name">${p.name}</div>
      <div class="pooja-desc">${p.desc}</div>
      <span class="pooja-benefit">✦ ${p.benefit}</span>
    </div>
  `).join('');
}

function renderUlsavam() {
  const title = document.getElementById('ulsavamTitle');
  const dateRange = document.getElementById('ulsavamDateRange');
  const grid = document.getElementById('ulsavamGrid');
  const ulsavamBanner = document.getElementById('ulsavamBanner');
  
  if (!title || !grid) return;

  title.innerText = `Ulsavam ${data.ulsavam.year}`;
  
  const startObj = new Date(data.ulsavam.startDate);
  const endObj = new Date(data.ulsavam.endDate);
  const options = { month: 'long', day: 'numeric' };
  dateRange.innerText = `${startObj.toLocaleDateString('en-US', options)} – ${endObj.toLocaleDateString('en-US', options)}, ${data.ulsavam.year}`;

  const now = new Date();
  const isActive = now >= startObj && now <= endObj;

  if (!isActive && ulsavamBanner) {
    ulsavamBanner.style.background = 'linear-gradient(135deg, #5C3D10, #2C1A00)';
    ulsavamBanner.innerHTML = `<span style="opacity:0.6">◈</span> Last Ulsavam: ${startObj.toLocaleDateString('en-US', options)}–${endObj.toLocaleDateString('en-US', { day: 'numeric' })}, ${data.ulsavam.year} &nbsp;·&nbsp; View Archive <span style="opacity:0.6">◈</span>`;
  }

  grid.innerHTML = data.ulsavam.days.map(d => {
    // Basic detection for "Today"
    const isToday = isActive && (now.toLocaleDateString() === new Date(`${d.date.split(',')[0]} ${data.ulsavam.year}`).toLocaleDateString());
    return `
      <div class="day-item">
        <div class="day-num"><div class="num">${d.day}</div><div class="label">Day</div></div>
        <div class="day-content">
          <div class="day-date">${d.date}</div>
          <div class="day-title">${d.title} ${isToday ? '<span class="active-badge">Today</span>' : ''}</div>
          <div class="day-details">${d.details}</div>
          ${d.programmes && d.programmes.length > 0 ? `
            <div class="programmes-list">
              ${d.programmes.map(p => `<div class="prog-item"><div class="prog-time">${p.time}</div><div class="prog-name">${p.name}</div></div>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderVidhana() {
  const grid = document.getElementById('vidhanaGrid');
  if (!grid) return;
  grid.innerHTML = data.vidhana.map(v => `
    <div class="ritual-step">
      <div>
        <div class="ritual-step-title">${v.title}</div>
        <div class="ritual-step-desc">${v.desc}</div>
      </div>
    </div>
  `).join('');
}





function renderGalleryTabs() {
  const container = document.getElementById('galleryTabs');
  if (!container || !data.gallery) return;

  // Use galleryAlbums order if defined, else fall back to object keys
  const albums = (data.galleryAlbums && data.galleryAlbums.length)
    ? data.galleryAlbums
    : Object.keys(data.gallery);

  container.innerHTML = albums.map((a, i) => `
    <button class="album-tab ${i === 0 ? 'active' : ''}" 
            data-album="${a}" 
            onclick="window.setAlbum(this)">${a}</button>
  `).join('');

  buildGallery();
}

window.setAlbum = function(el) {
  document.querySelectorAll('.album-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  buildGallery();
}

function buildGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const activeBtn = document.querySelector('.album-tab.active');
  if (!activeBtn) return;

  // Use data-album attribute to avoid innerText whitespace/case issues
  const albumName = activeBtn.dataset.album;
  const images = (data.gallery && data.gallery[albumName]) || [];

  grid.innerHTML = '';

  if (images.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:4rem; color:var(--muted); font-style:italic;">No photos uploaded for this album yet.</div>`;
    return;
  }

  images.forEach(img => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.innerHTML = `<img src="${img.url}" 
                          style="width:100%; height:100%; object-fit:cover;" 
                          alt="${img.label || ''}" 
                          title="${img.label || ''}">`;
    grid.appendChild(div);
  });
}











function renderTrustees() {
  const grid = document.getElementById('trusteesGrid');
  if (!grid) return;
  grid.innerHTML = data.trustees.map(t => `
    <div class="trustee-card">
      <div class="trustee-avatar">
        ${t.photo ? `<img src="${t.photo}" alt="${t.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : t.initials}
      </div>
      <div class="trustee-name">${t.name}</div>
      <div class="trustee-address">${t.address}</div>
    </div>
  `).join('');
}

function renderContacts() {
  const grid = document.getElementById('contactGrid');
  if (!grid) return;
  grid.innerHTML = data.contacts.map(c => `
    <div class="contact-card">
      <div class="contact-role">${c.role}</div>
      <div class="contact-name">${c.name}</div>
      <div class="contact-phone">${c.phone}</div>
    </div>
  `).join('');
}

window.toggleNav = function() {
  document.getElementById('navLinks').classList.toggle('open');
}
