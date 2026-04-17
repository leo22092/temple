// Admin Logic
// Prevent state corruption and deeply merge to retain new schema defaults:
let state;
try {
  const localStr = localStorage.getItem('templeData');
  if (localStr) {
    const parsed = JSON.parse(localStr);
    state = Object.assign(JSON.parse(JSON.stringify(window.templeData)), parsed);
  } else {
    state = JSON.parse(JSON.stringify(window.templeData));
  }
} catch (e) {
  state = JSON.parse(JSON.stringify(window.templeData));
}
if(!state.global) state.global = { heroImage: null, notification: {enabled:false, title:"", text:""} };

let currentTab = 'trustees';

// Expose functions globally to ensure inline onClick handlers work
window.switchTab = function(tab, element) {
  currentTab = tab;
  document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
  // Safe way to add active class
  if (element && element.classList) {
    element.classList.add('active');
  } else {
    // Fallback if element not passed
    document.querySelectorAll('.menu-item').forEach(el => {
      if(el.innerText.toLowerCase().includes(tab)) el.classList.add('active');
    });
  }
  document.getElementById('pageTitle').innerText = tab.charAt(0).toUpperCase() + tab.slice(1);
  render();
}

window.quietSave = function() {
  try { localStorage.setItem('templeData', JSON.stringify(state)); } catch(e) {}
}

window.saveLocal = function() {
  try {
    localStorage.setItem('templeData', JSON.stringify(state));
    alert('Changes applied locally. Refresh the temple-website (index.html) to see changes!');
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
      alert('ERROR: Storage Full! Uploaded photos are too large. Please delete some large photo uploads, export your data, or use Image URLs (Google Drive) instead of direct uploading.');
    } else {
      alert('Error saving: ' + e.message);
    }
  }
}

window.exportDataJS = function() {
  const content = `window.templeData = ${JSON.stringify(state, null, 2)};`;
  const blob = new Blob([content], { type: "text/javascript" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data.js";
  a.click();
}

window.render = function() {
  const area = document.getElementById('contentArea');
  if (currentTab === 'trustees') renderTrustees(area);
  else if (currentTab === 'poojas') renderPoojas(area);
  else if (currentTab === 'contacts') renderContacts(area);
  else if (currentTab === 'story') renderStory(area);
  else if (currentTab === 'gallery') window.renderGallery(area);
  else if (currentTab === 'ulsavam') renderUlsavam(area);
}

// ----------------- GALLERY -----------------
window.renderGallery = function(area) {
  if (!state.gallery) state.gallery = {"Ulsavam 2026": []};
  const albums = Object.keys(state.gallery);
  
  let html = `<div class="card"><h3>Manage Gallery & Archives</h3>
    <div class="form-group flex-row">
      <div style="flex:1"><label>Select Album</label><select id="g_album" onchange="window.renderGalleryGrid()">`;
  albums.forEach(a => { html += `<option value="${a}">${a}</option>`; });
  html += `</select></div>
      <button class="btn-secondary" style="margin-top:20px;" onclick="window.addGalleryArchive()">+ Create New Archive Album</button>
    </div>`;
  html += `
    <div class="form-group">
      <label>Add new photo</label>
      <div style="display:flex; gap:10px; margin-bottom:8px;">
        <input type="text" id="g_url" placeholder="Paste Image URL (Google Drive, Imgur, etc.)" style="flex:1;">
        <button class="btn-secondary" onclick="window.addPhotoUrl()">Add URL Link</button>
      </div>
      <p style="font-size:11px; color:#3498db; margin-top:4px;">(Photos are stored globally as links. This prevents storage limits!)</p>
    </div>
  </div>
  <div id="g_grid" class="grid-list" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));"></div>
  `;
  area.innerHTML = html;
  // Let the DOM update first, then render grid
  setTimeout(window.renderGalleryGrid, 10);
}

window.parseImageUrl = function(url) {
  const driveMatch = url.match(new RegExp('/file/d/([a-zA-Z0-9_-]+)'));
  if (driveMatch) return 'https://drive.google.com/uc?id=' + driveMatch[1];
  const driveOpenMatch = url.match(new RegExp('id=([a-zA-Z0-9_-]+)'));
  if (url.includes('drive.google.com') && driveOpenMatch) return 'https://drive.google.com/uc?id=' + driveOpenMatch[1];
  return url;
}

window.addPhotoUrl = function() {
  const album = document.getElementById('g_album').value;
  let url = document.getElementById('g_url').value.trim();
  if (url) {
    url = window.parseImageUrl(url);
    if(!state.gallery[album]) state.gallery[album] = [];
    state.gallery[album].push({ url: url, label: "" });
    window.quietSave();
    window.renderGalleryGrid();
  }
}

window.renderGalleryGrid = function() {
  const album = document.getElementById('g_album').value;
  const grid = document.getElementById('g_grid');
  if(!grid) return;
  const images = state.gallery[album] || [];
  let html = '';
  images.forEach((img, index) => {
    html += `
      <div class="card" style="padding:0.5rem;text-align:center;">
        <img src="${img.url}" style="width:100%; height:120px; object-fit:cover; border-radius:4px;">
        <input type="text" value="${img.label || ''}" placeholder="Caption" onchange="window.updateGalleryLabel('${album}', ${index}, this.value)" style="box-sizing:border-box; width:100%; margin: 5px 0;">
        <button class="btn-danger" style="padding: 4px; width:100%;" onclick="window.deletePhoto('${album}', ${index})">Delete</button>
      </div>`;
  });
  grid.innerHTML = html;
}

// File uploads removed in favor of purely URLs to prevent Base64 cache inflation

window.updateGalleryLabel = function(album, index, val) {
  state.gallery[album][index].label = val;
  window.quietSave();
}

window.deletePhoto = function(album, index) {
  if(confirm("Delete photo?")) {
    state.gallery[album].splice(index, 1);
    window.quietSave();
    window.renderGalleryGrid();
  }
}

window.addGalleryArchive = function() {
  const name = prompt("Enter new Archive/Album name (e.g. Ulsavam 2023):");
  if(name && !state.gallery[name]) {
    state.gallery[name] = [];
    window.quietSave();
    window.renderGallery();
  } else if (name) {
    alert("Album already exists!");
  }
}

// ----------------- TRUSTEES -----------------
function renderTrustees(area) {
  let html = `<button onclick="window.addTrustee()" style="margin-bottom:1rem;">+ Add New Trustee</button><div class="grid-list">`;
  state.trustees.forEach((t, i) => {
    html += `
    <div class="card">
      <div class="flex-row">
        <div>
          <strong>${t.name}</strong> <span style="color:#888;">(${t.initials})</span>
          <p style="margin:4px 0;font-size:0.9rem;">${t.address}</p>
        </div>
        ${t.photo ? `<img src="${t.photo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">` : ''}
        <div>
          <button class="btn-secondary" onclick="window.editTrustee(${i})">Edit</button>
          <button class="btn-danger" onclick="window.deleteTrustee(${i})">Delete</button>
        </div>
      </div>
    </div>`;
  });
  area.innerHTML = html + "</div>";
}

window.addTrustee = function() {
  const name = prompt("Enter Trustee Name:");
  if(name) {
    state.trustees.push({name, initials: name.substring(0,2).toUpperCase(), photo: null, address: ""});
    window.quietSave();
    render();
  }
}

window.deleteTrustee = function(i) {
  if(confirm("Delete trustee?")) { state.trustees.splice(i, 1); window.quietSave(); render(); }
}

window.editTrustee = function(i) {
  const t = state.trustees[i];
  const area = document.getElementById('contentArea');
  area.innerHTML = `
    <div class="card">
      <h3>Edit Trustee</h3>
      <div class="form-group"><label>Name</label><input type="text" id="t_name" value="${t.name}"></div>
      <div class="form-group"><label>Initials (Fallback avatar)</label><input type="text" id="t_initials" value="${t.initials}"></div>
      <div class="form-group"><label>Address</label><textarea id="t_address">${t.address}</textarea></div>
      <div class="form-group">
        <label>Photo URL</label>
        <div style="display:flex; gap:10px; margin-bottom:8px;">
          <input type="text" id="t_photo_url" placeholder="Paste Image URL (G-Drive, Imgur)" style="flex:1;" value="${t.photo && t.photo.startsWith('http') ? t.photo : ''}">
        </div>
        ${t.photo ? `<img src="${t.photo}" style="max-height:80px; margin-top:10px;">` : ''}
      </div>
      <button onclick="window.saveTrustee(${i})">Save details</button>
      <button class="btn-secondary" onclick="render()">Cancel</button>
    </div>
  `;
}

window.saveTrustee = function(i) {
  state.trustees[i].name = document.getElementById('t_name').value;
  state.trustees[i].initials = document.getElementById('t_initials').value;
  state.trustees[i].address = document.getElementById('t_address').value;
  
  const urlInput = document.getElementById('t_photo_url').value.trim();
  if (urlInput) {
    state.trustees[i].photo = window.parseImageUrl(urlInput);
  } else {
    state.trustees[i].photo = null;
  }
  
  window.quietSave();
  render();
}

// ----------------- STORY -----------------
function renderStory(area) {
  let html = `<div class="card"><h3>Temple History</h3><p>Edit the paragraphs below.</p>
    <textarea id="storyText" style="height:250px">${state.story.join('\\n\\n')}</textarea>
    <br><br><button onclick="window.saveStory()">Save Story</button></div>`;
  area.innerHTML = html;
}

window.saveStory = function() {
  state.story = document.getElementById('storyText').value.split('\\n\\n');
  window.quietSave();
  alert("Story saved!"); 
  render();
}

// ----------------- POOJAS -----------------
function renderPoojas(area) {
  let html = `<button onclick="window.addPooja()" style="margin-bottom:1rem;">+ Add New Pooja</button><div class="grid-list">`;
  state.poojas.forEach((p, i) => {
    html += `
    <div class="card">
      <div class="form-group"><label>Name</label><input type="text" id="p_name_${i}" value="${p.name}"></div>
      <div class="form-group"><label>Benefit</label><input type="text" id="p_benefit_${i}" value="${p.benefit}"></div>
      <div class="form-group"><label>Description</label><textarea id="p_desc_${i}">${p.desc}</textarea></div>
      <button class="btn-danger" onclick="window.deletePooja(${i})">Delete</button>
    </div>`;
  });
  area.innerHTML = html + "</div><br><button onclick='window.savePoojas()'>Save Poojas</button>";
}

window.addPooja = function() { 
  state.poojas.push({name:"New Pooja", benefit:"Benefit", desc:"Desc"}); 
  window.quietSave();
  render(); 
}

window.deletePooja = function(index) { 
  if(confirm("Delete Pooja?")){ state.poojas.splice(index, 1); window.quietSave(); render(); } 
}

window.savePoojas = function() {
  state.poojas.forEach((p, i) => {
    p.name = document.getElementById('p_name_'+i).value;
    p.benefit = document.getElementById('p_benefit_'+i).value;
    p.desc = document.getElementById('p_desc_'+i).value;
  });
  window.quietSave();
  alert("Poojas saved!");
}

// ----------------- CONTACTS & GLOBAL -----------------
function renderContacts(area) {
  let html = `<div class="card"><h3>Global Settings</h3>
    <div class="form-group">
      <label>Homepage Hero Image URL (Leaves as solid color if empty)</label>
      <input type="text" id="g_hero_url" placeholder="Paste Hero Image URL (Google Drive etc.)" value="${state.global.heroImage || ''}" onchange="window.saveHeroUrl()">
      ${state.global.heroImage ? `<img src="${state.global.heroImage}" style="max-height:100px; margin-top:10px; border-radius:4px;"> <br><button class="btn-danger" onclick="state.global.heroImage=null; window.quietSave(); render()">Remove Image</button>` : ''}
    </div>
    <div class="form-group" style="margin-top:1.5rem; border-top:1px solid #ddd; padding-top:1.5rem;">
      <label>Homepage Notification Modal / Pop-up</label>
      <label style="display:flex; align-items:center; gap:8px;"><input type="checkbox" id="g_notif_enabled" ${state.global.notification.enabled ? 'checked' : ''} style="width:auto;"> Enable Popup</label>
      <input type="text" id="g_notif_title" value="${state.global.notification.title}" placeholder="Announcement Title" style="margin-top:10px;">
      <textarea id="g_notif_text" style="height:80px; margin-top:10px;" placeholder="Message...">${state.global.notification.text}</textarea>
    </div>
    <button onclick="window.saveGlobalSettings()">Save Global Settings</button>
  </div>`;
  
  html += `<h3>Temple Contacts</h3><button onclick="window.addContact()" style="margin-bottom:1rem;">+ Add Contact</button><div class="grid-list">`;
  state.contacts.forEach((c, i) => {
    html += `
    <div class="card flex-row">
      <div style="flex:1"><label style="font-size:0.8rem">Role</label><input type="text" id="c_role_${i}" value="${c.role}" style="width:100%"></div>
      <div style="flex:1"><label style="font-size:0.8rem">Name</label><input type="text" id="c_name_${i}" value="${c.name}" style="width:100%"></div>
      <div style="flex:1"><label style="font-size:0.8rem">Phone</label><input type="text" id="c_phone_${i}" value="${c.phone}" style="width:100%"></div>
      <div><br><button class="btn-danger" onclick="window.deleteContact(${i})">X</button></div>
    </div>`;
  });
  area.innerHTML = html + "</div><br><button onclick='window.saveContacts()'>Save Contacts</button>";
}

// Removed file upload for Hero banner to force URL links
window.saveHeroUrl = function() {
  const url = document.getElementById('g_hero_url').value.trim();
  if(url) {
    state.global.heroImage = window.parseImageUrl(url);
  } else {
    state.global.heroImage = null;
  }
  window.quietSave();
  render();
}

window.saveGlobalSettings = function() {
  state.global.notification.enabled = document.getElementById('g_notif_enabled').checked;
  state.global.notification.title = document.getElementById('g_notif_title').value;
  state.global.notification.text = document.getElementById('g_notif_text').value;
  window.quietSave();
  alert("Global settings saved!");
}

window.addContact = function() { 
  state.contacts.push({role:"Role", name:"Name", phone:"Phone"}); 
  window.quietSave();
  render(); 
}

window.deleteContact = function(i) { 
  if(confirm("Delete Contact?")){ state.contacts.splice(i, 1); window.quietSave(); render(); } 
}

window.saveContacts = function() {
  state.contacts.forEach((c, i) => {
    c.role = document.getElementById('c_role_'+i).value;
    c.name = document.getElementById('c_name_'+i).value;
    c.phone = document.getElementById('c_phone_'+i).value;
  });
  window.quietSave();
  alert("Contacts saved!");
}

// ----------------- ULSAVAM -----------------
function renderUlsavam(area) {
  let html = `
    <div class="card">
      <div class="flex-row">
        <div><label>Year</label><input type="text" id="u_year" value="${state.ulsavam.year}"></div>
        <div><label>Start (YYYY-MM-DD)</label><input type="date" id="u_start" value="${state.ulsavam.startDate}"></div>
        <div><label>End (YYYY-MM-DD)</label><input type="date" id="u_end" value="${state.ulsavam.endDate}"></div>
      </div>
      <br><button onclick="window.saveUlsavamInfo()">Update Event Info</button>
    </div>
    <h3>Ulsavam Days</h3>
    <div class="grid-list">
  `;
  state.ulsavam.days.forEach((d, i) => {
    html += `
    <div class="card">
      <div class="flex-row">
        <div><strong>Day ${d.day}: ${d.date}</strong> - ${d.title}</div>
        <button onclick="window.editUlsavamDay(${i})">Edit Day</button>
      </div>
    </div>`;
  });
  area.innerHTML = html + "</div>";
}

window.saveUlsavamInfo = function() {
  state.ulsavam.year = document.getElementById('u_year').value;
  state.ulsavam.startDate = document.getElementById('u_start').value;
  state.ulsavam.endDate = document.getElementById('u_end').value;
  window.quietSave();
  alert("Ulsavam Global Info saved!");
}

window.editUlsavamDay = function(i) {
  const d = state.ulsavam.days[i];
  const area = document.getElementById('contentArea');
  
  const progStr = d.programmes ? d.programmes.map(p => p.time + " " + p.name).join("\\n") : "";

  area.innerHTML = `
    <div class="card">
      <h3>Edit Day ${d.day}</h3>
      <div class="form-group"><label>Date String (e.g. April 10, Wednesday)</label><input type="text" id="d_date" value="${d.date}"></div>
      <div class="form-group"><label>Title</label><input type="text" id="d_title" value="${d.title}"></div>
      <div class="form-group"><label>Details</label><textarea id="d_details" style="height:80px;">${d.details}</textarea></div>
      <div class="form-group">
         <label>Timetable / Programmes (One per line, e.g. "09:30 Dhwajarohanam")</label>
         <textarea id="d_progs" style="height:120px">${progStr}</textarea>
      </div>
      <button onclick="window.saveUlsavamDay(${i})">Save Day Details</button>
      <button class="btn-secondary" onclick="render()">Back</button>
    </div>
  `;
}

window.saveUlsavamDay = function(i) {
  state.ulsavam.days[i].date = document.getElementById('d_date').value;
  state.ulsavam.days[i].title = document.getElementById('d_title').value;
  state.ulsavam.days[i].details = document.getElementById('d_details').value;
  
  const progs = document.getElementById('d_progs').value.split('\\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const space = line.indexOf(' ');
      if (space > 0) return { time: line.substring(0, space), name: line.substring(space+1) };
      return { time: "", name: line };
  });
  state.ulsavam.days[i].programmes = progs;
  
  window.quietSave();
  render();
}

// Initial render
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { render(); });
} else {
  render();
}
