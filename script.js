const API_BASE = 'https://shipment-tracker-enis.onrender.com/api/shipments';
let allShipments = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 5;
let currentRole = 'admin';

function handleRoleChange() {
  currentRole = document.getElementById('roleToggle').value;
  renderPaginatedShipments();
}

// ✅ Declare autoRefreshInterval globally
let autoRefreshInterval = null;

window.onload = async function () {
  await fetchShipments();
  document.getElementById('searchInput').addEventListener('input', filterShipments);
  document.getElementById('statusFilter').addEventListener('change', filterShipments);
  document.getElementById('sortBy').addEventListener('change', filterShipments);
  document.getElementById('pagination')?.addEventListener('click', handlePageChange);

  // ✅ Auto-Refresh Toggle Setup
  document.getElementById('autoRefreshToggle').addEventListener('change', function (e) {
    if (e.target.checked) {
      autoRefreshInterval = setInterval(() => {
        fetchShipments();
      }, 10000); // every 10 seconds
      showToast('Auto-refresh enabled', 'success');
    } else {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
      showToast('Auto-refresh disabled', 'success');
    }
  });
};


async function fetchShipments() {
  try {
    const res = await fetch(API_BASE);
    allShipments = await res.json();
    renderPaginatedShipments();
  } catch (err) {
    showToast('Failed to fetch shipments', 'error');
  }
}

// ✅ Geocoding helper function
async function getCoordinates(location) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  }
  throw new Error('Geocoding failed');
}


function sortShipments(list) {
  const sortBy = document.getElementById('sortBy').value;
  return [...list].sort((a, b) => {
    switch (sortBy) {
      case 'eta':
        return new Date(a.currentETA) - new Date(b.currentETA);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'shipmentId':
        return a.shipmentId.localeCompare(b.shipmentId);
      case 'location':
        return a.currentLocation.localeCompare(b.currentLocation);
      default:
        return 0;
    }
  });
}

function renderPaginatedShipments(filteredList = null) {
  let list = filteredList || allShipments;
  list = sortShipments(list);

  // 🔽 Update shipment count
  const countText = filteredList
    ? `Showing ${list.length} of ${allShipments.length} shipments`
    : `Total Shipments: ${list.length}`;
  document.getElementById('shipment-count').textContent = countText;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = list.slice(start, start + ITEMS_PER_PAGE);

  renderShipments(paginated);
  updatePaginationControls(list);
}


function updatePaginationControls(list) {
  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;

  paginationContainer.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = (i === currentPage) ? 'active' : '';
    btn.dataset.page = i;
    paginationContainer.appendChild(btn);
  }
}

function handlePageChange(e) {
  if (e.target.tagName === 'BUTTON') {
    currentPage = Number(e.target.dataset.page);
    renderPaginatedShipments();
  }
}

function filterShipments() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;

  const filtered = allShipments.filter(s =>
    s.shipmentId.toLowerCase().includes(query) &&
    (status === '' || s.status === status)
  );

  currentPage = 1;
  renderPaginatedShipments(filtered);
}

// ... keep your existing renderShipments, createShipment, updateLocation,
// deleteShipment, trackRoute, enableEdit, cancelEdit, saveEdit, showToast functions unchanged


function renderPaginatedShipments(filteredList = null) {
  let list = filteredList || allShipments;
  list = sortShipments(list);

  // 🔽 Update shipment count
  const countText = filteredList
    ? `Showing ${list.length} of ${allShipments.length} shipments`
    : `Total Shipments: ${list.length}`;
  document.getElementById('shipment-count').textContent = countText;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = list.slice(start, start + ITEMS_PER_PAGE);

  renderShipments(paginated);
  updatePaginationControls(list);
}


function updatePaginationControls(list) {
  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;

  paginationContainer.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = (i === currentPage) ? 'active' : '';
    btn.dataset.page = i;
    paginationContainer.appendChild(btn);
  }
}

function handlePageChange(e) {
  if (e.target.tagName === 'BUTTON') {
    currentPage = Number(e.target.dataset.page);
    renderPaginatedShipments();
  }
}

async function renderShipments(shipments) {
  const container = document.getElementById('shipments');
  container.innerHTML = '';

  for (const shipment of shipments) {
    const card = document.createElement('div');
    card.className = 'shipment-card';

    let routeData = [];
    try {
      const res = await fetch(`${API_BASE}/${shipment._id}/track`);
      routeData = await res.json();
    } catch (err) {
      console.error('Error loading route:', err);
    }

    const routeHTML = routeData
      .map(loc => `<li>${loc.location} <small>(${new Date(loc.timestamp).toLocaleString()})</small></li>`)
      .join('');

    const mapId = `map-${shipment._id}`;

    const progressHTML = `
      <div class="progress-container">
        <div class="progress-step ${shipment.status === 'Ordered' || shipment.status === 'In Transit' || shipment.status === 'Delivered' ? 'completed' : ''}">
          <span>Ordered</span>
        </div>
        <div class="progress-step ${shipment.status === 'In Transit' || shipment.status === 'Delivered' ? 'active' : ''}">
          <span>In Transit</span>
        </div>
        <div class="progress-step ${shipment.status === 'Delivered' ? 'completed' : ''}">
          <span>Delivered</span>
        </div>
      </div>
    `;

    const adminControls = `
      <button class="admin-only" onclick="trackRoute('${shipment._id}')">📍 Track Route</button>
      <input class="admin-only" id="update-${shipment._id}" placeholder="New Location" />
      <button class="admin-only" onclick="updateLocation('${shipment._id}')">Update Location</button>
      <button class="admin-only" onclick="deleteShipment('${shipment._id}')">Delete</button>

      <button class="admin-only" onclick="enableEdit('${shipment._id}')">✏️ Edit</button>
      <button class="admin-only" onclick="saveEdit('${shipment._id}')" style="display:none" id="save-${shipment._id}">📅 Save</button>
      <button class="admin-only" onclick="cancelEdit('${shipment._id}')" style="display:none" id="cancel-${shipment._id}">❌ Cancel</button>

      <div id="edit-mode-${shipment._id}" class="edit-mode admin-only" style="display:none; margin-top:10px;">
        <label>Container: <input type="text" id="edit-container-${shipment._id}" value="${shipment.containerId}" /></label><br/>
        <label>Location: <input type="text" id="edit-location-${shipment._id}" value="${shipment.currentLocation}" /></label><br/>
        <label>Status: 
          <select id="edit-status-${shipment._id}">
            <option ${shipment.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
            <option ${shipment.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          </select>
        </label><br/>
        <label>ETA: 
          <input type="datetime-local" id="edit-eta-${shipment._id}" 
            value="${new Date(shipment.currentETA).toISOString().slice(0, 16)}" />
        </label>
      </div>
    `;

    card.innerHTML = `
      <details>
        <summary>
          <strong>ID:</strong> ${shipment.shipmentId} — 
          <strong>Status:</strong> <span class="status-${shipment.status.replace(/\s+/g, '-').toLowerCase()}">${shipment.status}</span>
        </summary>
        <p><strong>Container:</strong> ${shipment.containerId}</p>
        <p><strong>Location:</strong> ${shipment.currentLocation}</p>
        <p><strong>ETA:</strong> ${new Date(shipment.currentETA).toLocaleString()}</p>

        ${progressHTML}

        ${adminControls}

        <div style="margin-top:10px;">
          <strong>📌 Route History</strong>
          <ul>${routeHTML}</ul>
        </div>

        <div id="${mapId}" style="height: 200px; margin-top: 10px;"></div>
      </details>
    `;

    container.appendChild(card);

    // 🌍 Load map
    try {
      const coordsList = [];

      for (const point of routeData) {
        const coords = await getCoordinates(point.location);
        coordsList.push([coords.lat, coords.lon]);
      }

      if (coordsList.length > 0) {
        const map = L.map(mapId).setView(coordsList[coordsList.length - 1], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        coordsList.forEach(([lat, lon], i) => {
          L.marker([lat, lon], {
            icon: i === coordsList.length - 1
              ? L.icon({
                  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  iconSize: [32, 32],
                  iconAnchor: [16, 32]
                })
              : undefined
          }).addTo(map).bindPopup(routeData[i].location);
        });

        L.polyline(coordsList, { color: 'blue' }).addTo(map);
      }
    } catch (err) {
      console.warn(`Map load failed for ${shipment.shipmentId}: ${err.message}`);
    }
  }

  // Hide or show admin-only elements
  handleRoleChange();
}


async function createShipment() {
  const shipment = {
    shipmentId: document.getElementById('shipmentId').value,
    containerId: document.getElementById('containerId').value,
    currentLocation: document.getElementById('currentLocation').value,
    currentETA: document.getElementById('currentETA').value,
    status: document.getElementById('status').value
  };

  console.log('Sending shipment data:', shipment); // 👈 Add this

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shipment)
    });

    if (!res.ok) throw new Error();
    await fetchShipments();
    showToast('Shipment created successfully', 'success');
    document.querySelectorAll('#shipment-form input').forEach(i => (i.value = ''));
  } catch (err) {
    showToast('Error creating shipment', 'error');
  }
}



async function updateLocation(id) {
  const newLocation = document.getElementById(`update-${id}`).value;
  if (!newLocation) return showToast('Please enter a new location', 'error');

  try {
    const res = await fetch(`${API_BASE}/${id}/track`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: newLocation })
    });

    if (!res.ok) throw new Error();
    await fetchShipments();
    showToast('Location updated successfully', 'success');
  } catch (err) {
    showToast('Error updating location', 'error');
  }
}

async function deleteShipment(id) {
  if (!confirm('Are you sure you want to delete this shipment?')) return;

  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    await fetchShipments();
    showToast('Shipment deleted', 'success');
  } catch (err) {
    showToast('Error deleting shipment', 'error');
  }
}

async function trackRoute(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}/track`);
    const data = await res.json();

    if (!Array.isArray(data)) throw new Error('Invalid response');
    showToast('Route loaded. See history below.', 'success');
  } catch (err) {
    showToast('Failed to fetch route', 'error');
  }
}

function filterShipments() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;

  const filtered = allShipments.filter(s =>
    s.shipmentId.toLowerCase().includes(query) &&
    (status === '' || s.status === status)
  );

  currentPage = 1;
  renderPaginatedShipments(filtered);
}

function enableEdit(id) {
  document.getElementById(`edit-mode-${id}`).style.display = 'block';
  document.getElementById(`save-${id}`).style.display = 'inline-block';
  document.getElementById(`cancel-${id}`).style.display = 'inline-block';
}

function cancelEdit(id) {
  document.getElementById(`edit-mode-${id}`).style.display = 'none';
  document.getElementById(`save-${id}`).style.display = 'none';
  document.getElementById(`cancel-${id}`).style.display = 'none';
}

async function saveEdit(id) {
  const updated = {
    containerId: document.getElementById(`edit-container-${id}`).value,
    currentLocation: document.getElementById(`edit-location-${id}`).value,
    status: document.getElementById(`edit-status-${id}`).value,
    currentETA: document.getElementById(`edit-eta-${id}`).value
  };

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    if (!res.ok) throw new Error('Failed to update shipment');
    await fetchShipments();
    showToast('Shipment updated successfully', 'success');
  } catch (err) {
    showToast('Error updating shipment', 'error');
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}
// ✅ CSV Export Function
function downloadCSV() {
  // Try to grab filtered results
  const query = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;

  let filtered = allShipments.filter(s =>
    s.shipmentId.toLowerCase().includes(query) &&
    (status === '' || s.status === status)
  );

  if (filtered.length === 0) {
    showToast("No filtered shipment data to export", "error");
    return;
  }

  const headers = ["Shipment ID", "Container ID", "Current Location", "ETA", "Status"];
  const rows = filtered.map(s => [
    `"${s.shipmentId}"`,
    `"${s.containerId}"`,
    `"${s.currentLocation}"`,
    `"${new Date(s.currentETA).toLocaleString()}"`,
    `"${s.status}"`
  ]);

  const csvContent = [headers, ...rows]
    .map(e => e.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "filtered_shipments.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("CSV downloaded successfully", "success");
}
// 🔐 Role-Based Toggle Logic
document.getElementById('roleSelect').addEventListener('change', handleRoleChange);

function handleRoleChange() {
  const role = document.getElementById('roleSelect').value;
  const isAdmin = role === 'admin';

  document.querySelectorAll('.admin-only').forEach(btn => {
    btn.style.display = isAdmin ? 'inline-block' : 'none';
  });
}
