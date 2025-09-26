const map = L.map('map').setView([29.034, -80.92], 13);

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  { attribution: '&copy; Esri' }
).addTo(map);

let markers = [];
let latlngs = [];
let polygon = null;
let polyline = null;
let territoryLabel = null;
let runs = [];
let canAddMarkers = true; // true before claiming route
let markersDraggable = true;

const locationsListEl = document.getElementById('locationsList');
const showRouteBtn = document.getElementById('showRouteBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// Add marker on map click
map.on('click', e => {
  if (!canAddMarkers) return;

  const marker = L.marker(e.latlng, { draggable: markersDraggable }).addTo(map);
  markers.push(marker);
  latlngs.push(e.latlng);
  updateLocationsList();

  marker.on('drag', () => {
    // Update latlngs when marker dragged
    const idx = markers.indexOf(marker);
    if (idx !== -1) {
      latlngs[idx] = marker.getLatLng();
      updateLocationsList();
    }
  });

  marker.on('click', () => {
    if (!canAddMarkers) return; // only delete before claim
    removeMarker(marker);
  });
});

function removeMarker(marker) {
  const idx = markers.indexOf(marker);
  if (idx !== -1) {
    map.removeLayer(marker);
    markers.splice(idx, 1);
    latlngs.splice(idx, 1);
    updateLocationsList();
  }
}

function updateLocationsList() {
  if (latlngs.length === 0) {
    locationsListEl.innerHTML = '<strong>Markers:</strong><br />None yet';
    return;
  }
  let html = '<strong>Markers:</strong><br />';
  latlngs.forEach((latlng, i) => {
    html += `#${i + 1}: ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}<br />`;
  });
  locationsListEl.innerHTML = html;
}

function clearRouteAndPolygon() {
  if (polygon) {
    map.removeLayer(polygon);
    polygon = null;
  }
  if (polyline) {
    map.removeLayer(polyline);
    polyline = null;
  }
  if (territoryLabel) {
    map.removeLayer(territoryLabel);
    territoryLabel = null;
  }
}

function drawRouteAndTerritory(name, time) {
  clearRouteAndPolygon();

  polygon = L.polygon(latlngs, { color: 'green', fillColor: 'rgba(0,128,0,0.3)', fillOpacity: 0.3 }).addTo(map);
  polyline = L.polyline([...latlngs, latlngs[0]], { color: 'blue', weight: 3 }).addTo(map);

  // Use polygon bounds center (more reliably inside polygon)
  const centroid = polygon.getBounds().getCenter();

  // Calculate total miles
  let totalDistanceMeters = 0;
  for (let i = 1; i < latlngs.length; i++) {
    totalDistanceMeters += latlngs[i - 1].distanceTo(latlngs[i]);
  }
  totalDistanceMeters += latlngs[latlngs.length - 1].distanceTo(latlngs[0]);
  const totalDistanceMiles = (totalDistanceMeters / 1609.344).toFixed(2);

  // Create a DivIcon for label inside polygon
  const divIcon = L.divIcon({
    className: 'territory-label',
    html: createTerritoryLabelHTML(name, totalDistanceMiles, time),
    iconSize: [180, 40],
    iconAnchor: [90, 20]
  });

  territoryLabel = L.marker(centroid, { icon: divIcon, interactive: true }).addTo(map);

  const labelEl = territoryLabel.getElement();
  const menuBtn = labelEl.querySelector('.menu-button');
  const menuDropdown = labelEl.querySelector('.menu-dropdown');

  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    menuDropdown.classList.toggle('show');
  });

  map.on('click', () => {
    if (menuDropdown.classList.contains('show')) {
      menuDropdown.classList.remove('show');
    }
  });

  menuDropdown.addEventListener('click', () => {
    clearRouteAndPolygon();
    clearAllMarkers();
    runs.pop(); // remove last run from leaderboard
    updateLeaderboard();

    // Reset to allow adding markers again after deletion
    canAddMarkers = true;
    markersDraggable = true;
    showRouteBtn.textContent = 'Show Route & Claim Territory';

    menuDropdown.classList.remove('show');
  });
}

// Hide or show territoryLabel based on zoom level
map.on('zoomend', () => {
  if (!territoryLabel) return;
  const zoom = map.getZoom();
  if (zoom >= 15) {
    territoryLabel.getElement().style.display = 'block';
  } else {
    territoryLabel.getElement().style.display = 'none';
  }
});

function clearAllMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  latlngs = [];
  canAddMarkers = true;
  markersDraggable = true;
  updateLocationsList();
}

function updateLeaderboard() {
  const tbody = document.querySelector('#leaderboard tbody');
  if (runs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; font-style: italic; color:#777;">No runs yet</td></tr>`;
    return;
  }
  tbody.innerHTML = runs.map(run => {
    return `<tr>
      <td>${escapeHtml(run.name)}</td>
      <td>${run.miles}</td>
      <td>${escapeHtml(run.time)}</td>
    </tr>`;
  }).join('');
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function(m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}

function createTerritoryLabelHTML(name, miles, time) {
  return `
    ${escapeHtml(name)}<br/>
    Miles: ${miles}<br/>
    Time: ${escapeHtml(time)}
    <button class="menu-button" aria-label="Open menu">&#x22EE;</button>
    <div class="menu-dropdown" role="menu" aria-hidden="true">
      <div role="menuitem" tabindex="0">Delete</div>
    </div>
  `;
}

showRouteBtn.addEventListener('click', () => {
  if (latlngs.length < 2) {
    alert('Please drop at least two markers to form a route.');
    return;
  }

  const userName = prompt('Enter your name:', 'Nate');
  if (userName === null || userName.trim() === '') {
    alert('Name is required.');
    return;
  }
  const userTime = prompt('Enter total time (e.g., 30:00):', '30:00');
  if (userTime === null || userTime.trim() === '') {
    alert('Time is required.');
    return;
  }

  let totalDistanceMeters = 0;
  for (let i = 1; i < latlngs.length; i++) {
    totalDistanceMeters += latlngs[i - 1].distanceTo(latlngs[i]);
  }
  totalDistanceMeters += latlngs[latlngs.length - 1].distanceTo(latlngs[0]);
  const totalDistanceMiles = (totalDistanceMeters / 1609.344).toFixed(2);

  runs.unshift({
    name: userName.trim(),
    miles: totalDistanceMiles,
    time: userTime.trim()
  });

  updateLeaderboard();
  drawRouteAndTerritory(userName.trim(), userTime.trim());

  // Lock markers - disable dragging safely
  canAddMarkers = false;
  markersDraggable = false;
  markers.forEach(m => {
    if (m.dragging) {
      m.dragging.disable();
    }
  });

  showRouteBtn.textContent = 'Route Claimed!';
});

clearAllBtn.addEventListener('click', () => {
  clearAllMarkers();
  clearRouteAndPolygon();
  runs = [];
  updateLeaderboard();
  canAddMarkers = true;
  markersDraggable = true;
  showRouteBtn.textContent = 'Show Route & Claim Territory';
});

updateLocationsList();
updateLeaderboard();
