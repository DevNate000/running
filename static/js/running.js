const center = [29.0340, -80.9200]; // New Smyrna Beach

  const map = L.map('map').setView(center, 13);


let mapMode = 'dark_all';
const mapModeBtn = document.getElementById('mapMode');

function setMapMode(mode) {
  mapMode = mode;
  // Remove all tile layers
  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer);
  });
  // Add the new tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/' + mapMode + '/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB',
    maxZoom: 19,
  }).addTo(map);
  // Update button color
  if (mapMode === 'dark_all') {
    mapModeBtn.style.background = '#222e3c';
    mapModeBtn.style.color = 'white';
    mapModeBtn.textContent = 'Light Map';
  } else {
    mapModeBtn.style.background = '#000000';
    mapModeBtn.style.color = '#e0e0e0';
    mapModeBtn.textContent = 'Dark Map';
  }
}

mapModeBtn.addEventListener('click', () => {
  setMapMode(mapMode === 'light_all' ? 'dark_all' : 'light_all');
});

// Initialize with current mode
setMapMode(mapMode);

  let markers = [];
  let latlngs = [];

  let routeLine = null;
  let territoryPolygon = null;
  let territoryLabel = null;

  let canAddMarkers = true; // can add markers to the map
  let markersDraggable = true; // markers are draggable before territory claim

  // Leaderboard data
  let runs = [];

  // Fetch runs from backend on load
  async function fetchRuns() {
    try {
      const res = await fetch('/api/runs');
      if (!res.ok) throw new Error('Failed to fetch runs');
      const data = await res.json();
      runs = data.map(run => {
        // Calculate pace (min:sec per mile)
        let pace = '';
        if (run.miles && run.time) {
          let parts = run.time.split(':').map(Number);
          let totalSeconds = 0;
          if (parts.length === 3) {
            totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          } else if (parts.length === 2) {
            totalSeconds = parts[0] * 60 + parts[1];
          }
          if (run.miles > 0) {
            let paceSec = totalSeconds / run.miles;
            let paceMin = Math.floor(paceSec / 60);
            let paceRemSec = Math.round(paceSec % 60).toString().padStart(2, '0');
            pace = `${paceMin}:${paceRemSec}`;
          }
        }
        return {
          ...run,
          pace
        };
      });
      updateLeaderboard();
      // Draw all runs as territories on the map
      drawAllTerritories();
    } catch (err) {
      console.error('Error fetching runs:', err);
    }
  }

  // Draw all runs as territories on the map
  function drawAllTerritories() {
    // Clear any existing overlays
    clearAllMarkers();
    clearRouteAndPolygon();
    // For each run, draw its territory
    runs.forEach(run => {
      if (!run.route_coords) return;
      let coords;
      try {
        coords = typeof run.route_coords === 'string' ? JSON.parse(run.route_coords) : run.route_coords;
      } catch (e) {
        coords = [];
      }
      if (!Array.isArray(coords) || coords.length < 2) return;
      // Convert to Leaflet LatLngs
      const latlngArr = coords.map(pt => L.latLng(pt[0], pt[1]));
      // Use user color or fallback
      let userColor = run.color || 'green';
      // Debug: log color for each run
      console.log('Drawing territory for', run.name, 'user_id:', run.user_id, 'color:', userColor);
      // If color is a known name, use it; if hex, ensure it starts with #
      if (/^[0-9a-fA-F]{6}$/.test(userColor)) userColor = '#' + userColor;
      // Draw polyline
      const routeLine = L.polyline(latlngArr, { color: userColor }).addTo(map);
      // Draw polygon (closed)
      const polygonPoints = latlngArr.slice();
      polygonPoints.push(latlngArr[0]);
      const territoryPolygon = L.polygon(polygonPoints, { color: userColor, fillColor: userColor, fillOpacity: 0.3 }).addTo(map);
      // Calculate centroid
      const centroid = getCentroid(polygonPoints);

      // --- Territory label rendering overhaul ---
      // Replace the old divIcon label rendering in drawAllTerritories()
      // const divIcon = L.divIcon({ ... });
      // const territoryLabel = L.marker(centroid, { icon: divIcon, interactive: false }).addTo(map);

      // New version:
      // 1. Show a small colored pill with initials at centroid
      // 2. On hover, show a tooltip with full info (name, miles, time, pace)

      const initials = run.name ? run.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?';
      const pillHtml = `<div style="
        background:${userColor};
        color:#181a1b;
        font-weight:bold;
        border-radius:16px;
        padding:2px 10px;
        font-size:15px;
        box-shadow:0 1px 6px #0008;
        border:2px solid #fff;
        min-width:24px;
        text-align:center;
        pointer-events:auto;
        ">
        ${initials}
      </div>`;
      const pillIcon = L.divIcon({
        className: '',
        html: pillHtml,
        iconSize: null,
        iconAnchor: [0, 0],
      });
      const pillMarker = L.marker(centroid, { icon: pillIcon, interactive: true }).addTo(map);

      // Add a Leaflet tooltip for details
      const runDate = new Date(run.created_at).toLocaleString('en-US', {
        year: '2-digit',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const labelDetails = `
        <div style='color: ${run.color};'>
          <strong>${escapeHtml(run.name)}</strong><br/>
          Miles: ${run.miles} mi<br/>
          Time: ${escapeHtml(run.time)}<br/>
          Pace: ${run.pace ? escapeHtml(run.pace) : '--'}/mi <br/>
          Date: ${runDate} <br/>
        </div>
      `;
      pillMarker.bindTooltip(labelDetails, {
        direction: 'top',
        offset: [0, -10],
        permanent: false,
        sticky: true,
        className: 'territory-tooltip',
      });
    });
  }

  map.on('click', function(e) {
    if (!canAddMarkers) return;
    addMarker(e.latlng);
    clearRouteAndPolygon();
  });

  function addMarker(latlng) {
    const marker = L.marker(latlng, { draggable: markersDraggable }).addTo(map);
    markers.push(marker);
    latlngs.push(latlng);

    marker.on('click', () => {
      removeMarker(marker);
    });

    marker.on('drag', () => {
      const idx = markers.indexOf(marker);
      if (idx !== -1) {
        latlngs[idx] = marker.getLatLng();
        updateLocationsList();
      }
    });
  }

  function removeMarker(marker) {
    const index = markers.indexOf(marker);
    if (index > -1) {
      map.removeLayer(marker);
      markers.splice(index, 1);
      latlngs.splice(index, 1);
      updateLocationsList();

      if (routeLine || territoryPolygon) {
        if (latlngs.length < 2) {
          clearRouteAndPolygon();
        } else {
          drawRouteAndTerritory();
        }
      }

      if (markers.length === 0) {
        canAddMarkers = true;
        markersDraggable = true;
      }
    }
  }

  function updateLocationsList() {
    const listEl = document.getElementById('locationsList');
    if (latlngs.length === 0) {
      listEl.innerHTML = '';
      return;
    }
    // Only log the lat/lng to the console
    latlngs.forEach((pt, i) => {
      console.log(`${i + 1}. Lat: ${pt.lat.toFixed(5)}, Lng: ${pt.lng.toFixed(5)}`);
    });
    listEl.innerHTML = '';
  }

  function clearRouteAndPolygon() {
    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }
    if (territoryPolygon) {
      map.removeLayer(territoryPolygon);
      territoryPolygon = null;
    }
    if (territoryLabel) {
      map.removeLayer(territoryLabel);
      territoryLabel = null;
    }
    document.getElementById('showRouteBtn').textContent = 'Show Route & Claim Territory';
  }

  function createTerritoryLabelHTML(name, miles, time) {
    return `
      <div class="territory-label-box">
        <strong>${name}</strong><br/>
        Miles: ${miles} mi<br/>
        Time: ${time}
        <div class="menu-button" title="Options">
          <div></div><div></div><div></div>
        </div>
        <div class="menu-dropdown">Delete</div>
      </div>
    `;
  }

  function drawRouteAndTerritory(name, time) {
    if (routeLine) map.removeLayer(routeLine);
    if (territoryPolygon) map.removeLayer(territoryPolygon);
    if (territoryLabel) map.removeLayer(territoryLabel);

    // Disable dragging of markers when territory claimed
    markers.forEach(m => m.dragging.disable());
    markersDraggable = false;

    routeLine = L.polyline(latlngs, { color: 'blue' }).addTo(map);

    const polygonPoints = latlngs.slice();
    polygonPoints.push(latlngs[0]);
    territoryPolygon = L.polygon(polygonPoints, { color: 'green', fillColor: 'green', fillOpacity: 0.3 }).addTo(map);

    // Calculate centroid
    const centroid = getCentroid(polygonPoints);

    // Calculate total distance in miles (including closing segment)
    let totalDistanceMeters = 0;
    for (let i = 1; i < latlngs.length; i++) {
      totalDistanceMeters += latlngs[i - 1].distanceTo(latlngs[i]);
    }
    totalDistanceMeters += latlngs[latlngs.length - 1].distanceTo(latlngs[0]);
    const totalDistanceMiles = (totalDistanceMeters / 1609.344).toFixed(2);

    // Create custom icon with menu
    const divIcon = L.divIcon({
      className: 'territory-label',
      html: createTerritoryLabelHTML(name, totalDistanceMiles, time),
      iconSize: [180, 80],
      iconAnchor: [90, 40]
    });

    territoryLabel = L.marker(centroid, { icon: divIcon, interactive: true }).addTo(map);

    // Setup menu toggle and delete
    const labelEl = territoryLabel.getElement();
    const menuBtn = labelEl.querySelector('.menu-button');
    const menuDropdown = labelEl.querySelector('.menu-dropdown');

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle('show');
    });

    // Hide menu on map click
    map.on('click', () => {
      if (menuDropdown.classList.contains('show')) {
        menuDropdown.classList.remove('show');
      }
    });

    menuDropdown.addEventListener('click', () => {
      // Delete territory and markers related
      clearRouteAndPolygon();
      clearAllMarkers();
      runs.pop(); // remove last run from leaderboard (territory we deleted)
      updateLeaderboard();
      menuDropdown.classList.remove('show');
    });
  }

  function getCentroid(points) {
    let latSum = 0;
    let lngSum = 0;
    points.forEach(pt => {
      latSum += pt.lat;
      lngSum += pt.lng;
    });
    return L.latLng(latSum / points.length, lngSum / points.length);
  }

  function clearAllMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    latlngs = [];
    canAddMarkers = true;
    markersDraggable = true;
    updateLocationsList();
  }

  // Leaderboard update function
  function updateLeaderboard() {
    const tbody = document.querySelector('#leaderboard tbody');
    if (runs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; font-style: italic; color:#777;">No runs yet</td></tr>`;
      return;
    }

    tbody.innerHTML = runs.map(run => {
      return `<tr>
        <td> <div class="profile-container"> <img class="profile-picture" src="/static/img/${run.profile_picture}.png" alt="${run.profile_picture}"> ${escapeHtml(run.name)} </div> </td>
        <td>${run.miles}</td>
        <td>${escapeHtml(run.time)}</td>
        <td>${run.pace ? escapeHtml(run.pace) : '--'}/mi</td>
      </tr>`;
    }).join('');
  }

  // Escape HTML for security
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (m) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[m];
    });
  }

  document.getElementById('showRouteBtn').addEventListener('click', async () => {
    if (latlngs.length < 2) {
      alert('Please drop at least two markers to form a route.');
      return;
    }

    // Prompt for user_id
    const userId = prompt('Enter your user ID (number):', '1');
    if (userId === null || userId.trim() === '' || isNaN(userId)) {
      alert('User ID is required and must be a number.');
      return;
    }
    const userTime = prompt('Enter total time (e.g., 30:00):', '30:00');
    if (userTime === null || userTime.trim() === '') {
      alert('Time is required.');
      return;
    }

    // Calculate total miles
    let totalDistanceMeters = 0;
    for (let i = 1; i < latlngs.length; i++) {
      totalDistanceMeters += latlngs[i - 1].distanceTo(latlngs[i]);
    }
    totalDistanceMeters += latlngs[latlngs.length - 1].distanceTo(latlngs[0]);
    const totalDistanceMiles = (totalDistanceMeters / 1609.344).toFixed(2);

    // Prepare run data
    const runData = {
      user_id: userId.trim(),
      route_coords: latlngs.map(pt => [pt.lat, pt.lng]),
      miles: totalDistanceMiles,
      time: userTime.trim()
    };

    // POST to backend
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runData)
      });
      const result = await res.json();
      if (result.success && result.run) {
        // Add to leaderboard from backend response, including color and user_id
        runs.unshift({
          name: result.run.name,
          miles: result.run.miles,
          time: result.run.time,
          route_coords: result.run.route_coords,
          color: result.run.color,
          user_id: result.run.user_id
        });
        updateLeaderboard();
        // Draw the new territory with the correct color
        drawAllTerritories();
        canAddMarkers = false;
        document.getElementById('showRouteBtn').textContent = 'Route Claimed!';
      } else {
        alert('Failed to save run.');
      }
    } catch (err) {
      alert('Error saving run.');
      console.error(err);
    }
  });



  // On page load, fetch runs from backend
  updateLocationsList();
  fetchRuns();

  // Mobile bottom menu logic
  if (window.innerWidth <= 700) {
    const sidePanel = document.getElementById('side-panel');
    // Hide side panel by default on mobile
    sidePanel.classList.remove('mobile-visible');
    sidePanel.classList.add('mobile-hidden');

    // Add Route button: hide side panel and trigger add route
    document.getElementById('mobile-add-route').onclick = function() {
      sidePanel.classList.remove('mobile-visible');
      sidePanel.classList.add('mobile-hidden');
      document.getElementById('showRouteBtn').click();
    };
    // Leaderboard button: show side panel, hide if already visible
    document.getElementById('mobile-leaderboard').onclick = function() {
      if (sidePanel.classList.contains('mobile-visible')) {
        sidePanel.classList.remove('mobile-visible');
        sidePanel.classList.add('mobile-hidden');
      } else {
        sidePanel.classList.add('mobile-visible');
        sidePanel.classList.remove('mobile-hidden');
      }
    };
    // Map mode button: toggle map mode and update label
    document.getElementById('mobile-map-mode').onclick = function() {
      setMapMode(mapMode === 'light_all' ? 'dark_all' : 'light_all');
      this.textContent = mapMode === 'light_all' ? 'Dark Map' : 'Light Map';
    };
    // Hide side panel if map is clicked (for better UX)
    map.on('click', function() {
      sidePanel.classList.remove('mobile-visible');
      sidePanel.classList.add('mobile-hidden');
    });
    // Set initial text for map mode button
    document.getElementById('mobile-map-mode').textContent = mapMode === 'light_all' ? 'Dark Map' : 'Light Map';
  }
