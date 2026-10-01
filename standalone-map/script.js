document.addEventListener('DOMContentLoaded', () => {
  // Tile Providers (100% Keyless, Open Source & Keyless Mirrors)
  const tileProviders = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }),
    google_roads: L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; Google Maps'
    })
  };

  // Preset Corridors
  const CORRIDORS = {
    'mumbai-pune': {
      origin: [19.0760, 72.8777, 'Mumbai Logistics Park, Maharashtra'],
      dest: [18.5204, 73.8567, 'Pune Cold Storage Hub, Maharashtra'],
      waypoints: [[18.7500, 73.3500, 'Khandala Ghat Waypoint']]
    },
    'bhiwandi-chakan': {
      origin: [19.2967, 73.0631, 'Bhiwandi Warehousing Hub, Thane'],
      dest: [18.7606, 73.8617, 'Chakan Auto Manufacturing Corridor'],
      waypoints: [[19.0500, 73.4000, 'Panvel Junction']]
    },
    'jnpt-hinjawadi': {
      origin: [18.9499, 72.9510, 'JNPT Container Terminal, Navi Mumbai'],
      dest: [18.5913, 73.7389, 'Hinjawadi Phase-3 Tech Park, Pune'],
      waypoints: []
    },
    'delhi-jaipur': {
      origin: [28.6139, 77.2090, 'Delhi Logistics Gateway'],
      dest: [26.9124, 75.7873, 'Jaipur Industrial Area, Rajasthan'],
      waypoints: [[27.8500, 76.5000, 'Neemrana Hub']]
    }
  };

  // State
  let activePinMode = null; // 'origin' | 'dest' | 'waypoint' | null
  let originCoord = [...CORRIDORS['mumbai-pune'].origin];
  let destCoord = [...CORRIDORS['mumbai-pune'].dest];
  let waypoints = [...CORRIDORS['mumbai-pune'].waypoints];
  let routePolyline = null;

  // Initialize Map
  const map = L.map('map', {
    center: [18.8, 73.3],
    zoom: 10,
    layers: [tileProviders.osm],
    scrollWheelZoom: true
  });

  L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

  // Custom Icon Factory
  function createPinIcon(color, label) {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          background: ${color};
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
        ">
          <span style="
            transform: rotate(45deg);
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            font-family: sans-serif;
          ">${label}</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  // Active Markers
  let originMarker = L.marker([originCoord[0], originCoord[1]], {
    icon: createPinIcon('#10b981', 'A'),
    draggable: true
  }).addTo(map);

  let destMarker = L.marker([destCoord[0], destCoord[1]], {
    icon: createPinIcon('#ef4444', 'B'),
    draggable: true
  }).addTo(map);

  let waypointMarkers = [];

  // DOM Elements
  const toolPinOrigin = document.getElementById('toolPinOrigin');
  const toolPinDest = document.getElementById('toolPinDest');
  const toolPinWaypoint = document.getElementById('toolPinWaypoint');
  const clearPinsBtn = document.getElementById('clearPinsBtn');
  const corridorSelect = document.getElementById('corridorSelect');
  const layerBtns = document.querySelectorAll('.layer-btn');
  const pinModeBanner = document.getElementById('pinModeBanner');
  const pinModeText = document.getElementById('pinModeText');
  const cancelPinModeBtn = document.getElementById('cancelPinModeBtn');
  const headerPinOriginBtn = document.getElementById('headerPinOriginBtn');
  const headerPinDestBtn = document.getElementById('headerPinDestBtn');

  const hudOrigin = document.getElementById('hudOrigin');
  const hudDest = document.getElementById('hudDest');
  const hudDistance = document.getElementById('hudDistance');
  const hudDuration = document.getElementById('hudDuration');
  const hudFuel = document.getElementById('hudFuel');

  // Co-Loading Elements
  const capacitySlider = document.getElementById('capacitySlider');
  const sliderValText = document.getElementById('sliderValText');
  const truckBarA = document.getElementById('truckBarA');
  const truckBarEmpty = document.getElementById('truckBarEmpty');
  const compAPercentText = document.getElementById('compAPercentText');
  const compBPercentText = document.getElementById('compBPercentText');
  const costAVal = document.getElementById('costAVal');
  const costBVal = document.getElementById('costBVal');
  const co2Val = document.getElementById('co2Val');
  const compBSpaceVal = document.getElementById('compBSpaceVal');
  const compBTotalVal = document.getElementById('compBTotalVal');
  const authorizeMatchBtn = document.getElementById('authorizeMatchBtn');
  const contractHash = document.getElementById('contractHash');
  const quickPairBtns = document.querySelectorAll('.quick-pair-btn');

  // Simulator Elements
  const scenarioBtns = document.querySelectorAll('.scenario-btn');
  const simTitle = document.getElementById('simTitle');
  const simTag = document.getElementById('simTag');
  const simDesc = document.getElementById('simDesc');
  const simDuration = document.getElementById('simDuration');
  const simDist = document.getElementById('simDist');
  const simCost = document.getElementById('simCost');
  const simRec = document.getElementById('simRec');

  // Haversine Distance Helper
  function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Reverse Geocode Helper
  async function reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
        { headers: { 'User-Agent': 'RouteMind-Keyless-Map/1.0' } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          return data.display_name.split(', ').slice(0, 3).join(', ');
        }
      }
    } catch (e) {
      console.warn('Geocoding notice:', e.message);
    }
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }

  // Recalculate Route and HUD
  function updateRoute() {
    const points = [
      [originCoord[0], originCoord[1]],
      ...waypoints.map(wp => [wp[0], wp[1]]),
      [destCoord[0], destCoord[1]]
    ];

    if (routePolyline) {
      map.removeLayer(routePolyline);
    }

    // Draw route corridor line
    routePolyline = L.polyline(points, {
      color: '#0284c7',
      weight: 5,
      opacity: 0.85,
      dashArray: '1, 8',
      lineCap: 'round'
    }).addTo(map);

    // Fit map bounds
    map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });

    // Calculate total distance
    let totalDist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDist += getHaversineDistance(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }
    // Road factor adjustment (approx 1.28x over straight line)
    totalDist = totalDist * 1.28;

    const hours = totalDist / 54; // 54 km/h logistics speed
    const durationHrs = Math.floor(hours);
    const durationMins = Math.round((hours - durationHrs) * 60);

    const liters = (totalDist / 3.85).toFixed(1); // 3.85 km/L heavy truck

    hudDistance.textContent = `${totalDist.toFixed(1)} km`;
    hudDuration.textContent = `${durationHrs}h ${durationMins}m`;
    hudFuel.textContent = `${liters} Liters`;

    hudOrigin.textContent = originCoord[2] || `${originCoord[0].toFixed(4)}, ${originCoord[1].toFixed(4)}`;
    hudDest.textContent = destCoord[2] || `${destCoord[0].toFixed(4)}, ${destCoord[1].toFixed(4)}`;

    originMarker.bindPopup(`<strong>Origin (A)</strong><br>${hudOrigin.textContent}`).openPopup();
    destMarker.bindPopup(`<strong>Destination (B)</strong><br>${hudDest.textContent}`);
  }

  // Pin Mode Activation
  function setPinMode(mode) {
    activePinMode = mode;
    toolPinOrigin.classList.toggle('active', mode === 'origin');
    toolPinDest.classList.toggle('active', mode === 'dest');
    toolPinWaypoint.classList.toggle('active', mode === 'waypoint');

    if (mode) {
      pinModeBanner.classList.add('show');
      map.getContainer().style.cursor = 'crosshair';
      if (mode === 'origin') {
        pinModeText.textContent = '📍 Click on the map to set ORIGIN (Point A).';
      } else if (mode === 'dest') {
        pinModeText.textContent = '🏁 Click on the map to set DESTINATION (Point B).';
      } else if (mode === 'waypoint') {
        pinModeText.textContent = '🟣 Click on the map to add an intermediate WAYPOINT.';
      }
    } else {
      pinModeBanner.classList.remove('show');
      map.getContainer().style.cursor = '';
    }
  }

  toolPinOrigin.addEventListener('click', () => setPinMode(activePinMode === 'origin' ? null : 'origin'));
  toolPinDest.addEventListener('click', () => setPinMode(activePinMode === 'dest' ? null : 'dest'));
  toolPinWaypoint.addEventListener('click', () => setPinMode(activePinMode === 'waypoint' ? null : 'waypoint'));
  cancelPinModeBtn.addEventListener('click', () => setPinMode(null));

  if (headerPinOriginBtn) {
    headerPinOriginBtn.addEventListener('click', () => {
      document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
      setPinMode('origin');
    });
  }

  if (headerPinDestBtn) {
    headerPinDestBtn.addEventListener('click', () => {
      document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
      setPinMode('dest');
    });
  }

  // Map Click Event for Pinning
  map.on('click', async (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (activePinMode === 'origin') {
      const address = await reverseGeocode(lat, lng);
      originCoord = [lat, lng, address];
      originMarker.setLatLng([lat, lng]);
      setPinMode(null);
      updateRoute();
    } else if (activePinMode === 'dest') {
      const address = await reverseGeocode(lat, lng);
      destCoord = [lat, lng, address];
      destMarker.setLatLng([lat, lng]);
      setPinMode(null);
      updateRoute();
    } else if (activePinMode === 'waypoint') {
      const address = await reverseGeocode(lat, lng);
      const wpIdx = waypoints.length + 1;
      waypoints.push([lat, lng, address]);

      const marker = L.marker([lat, lng], {
        icon: createPinIcon('#8b5cf6', `W${wpIdx}`),
        draggable: true
      }).addTo(map);

      marker.bindPopup(`<strong>Waypoint ${wpIdx}</strong><br>${address}`).openPopup();
      waypointMarkers.push(marker);

      marker.on('dragend', async (ev) => {
        const p = ev.target.getLatLng();
        const newAddr = await reverseGeocode(p.lat, p.lng);
        waypoints[wpIdx - 1] = [p.lat, p.lng, newAddr];
        updateRoute();
      });

      setPinMode(null);
      updateRoute();
    }
  });

  // Dragging Origin Marker
  originMarker.on('dragend', async (e) => {
    const p = e.target.getLatLng();
    const address = await reverseGeocode(p.lat, p.lng);
    originCoord = [p.lat, p.lng, address];
    updateRoute();
  });

  // Dragging Destination Marker
  destMarker.on('dragend', async (e) => {
    const p = e.target.getLatLng();
    const address = await reverseGeocode(p.lat, p.lng);
    destCoord = [p.lat, p.lng, address];
    updateRoute();
  });

  // Clear Pins
  clearPinsBtn.addEventListener('click', () => {
    waypointMarkers.forEach(m => map.removeLayer(m));
    waypointMarkers = [];
    waypoints = [];
    const def = CORRIDORS['mumbai-pune'];
    originCoord = [...def.origin];
    destCoord = [...def.dest];
    originMarker.setLatLng([originCoord[0], originCoord[1]]);
    destMarker.setLatLng([destCoord[0], destCoord[1]]);
    corridorSelect.value = 'mumbai-pune';
    updateRoute();
  });

  // Corridor Selector
  corridorSelect.addEventListener('change', (e) => {
    const selected = CORRIDORS[e.target.value];
    if (selected) {
      waypointMarkers.forEach(m => map.removeLayer(m));
      waypointMarkers = [];

      originCoord = [...selected.origin];
      destCoord = [...selected.dest];
      waypoints = [...selected.waypoints];

      originMarker.setLatLng([originCoord[0], originCoord[1]]);
      destMarker.setLatLng([destCoord[0], destCoord[1]]);

      waypoints.forEach((wp, idx) => {
        const marker = L.marker([wp[0], wp[1]], {
          icon: createPinIcon('#8b5cf6', `W${idx + 1}`),
          draggable: true
        }).addTo(map);
        waypointMarkers.push(marker);
      });

      updateRoute();
    }
  });

  // Tile Switcher
  layerBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      layerBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const key = btn.dataset.layer;
      Object.values(tileProviders).forEach(t => map.removeLayer(t));
      if (tileProviders[key]) {
        map.addLayer(tileProviders[key]);
      }
    });
  });

  // Co-Loading Capacity Slider Logic (Requested Feature: Co-Loading Marketplace)
  function updateCoLoadingMatrix(fillPercent) {
    const totalPallets = 20;
    const filledPallets = Math.round(totalPallets * (fillPercent / 100));
    const emptyPercent = 100 - fillPercent;
    const emptyPallets = totalPallets - filledPallets;

    sliderValText.textContent = `${fillPercent}% Filled (${filledPallets}/20 Pallets)`;
    truckBarA.style.width = `${fillPercent}%`;
    truckBarA.textContent = `Company A (${fillPercent}%)`;
    truckBarEmpty.style.width = `${emptyPercent}%`;
    truckBarEmpty.textContent = `${emptyPercent}% Empty Space`;

    compAPercentText.textContent = `${fillPercent}%`;
    compBPercentText.textContent = `${emptyPercent}%`;

    const baseCost = 24000;
    const rawCostA = baseCost * (fillPercent / 100);
    const rawCostB = baseCost * (emptyPercent / 100);

    costAVal.innerHTML = `&#8377;${Math.round(rawCostA).toLocaleString()} <span class="savings">(-${Math.round((1 - rawCostA / baseCost) * 100)}% savings)</span>`;
    costBVal.innerHTML = `&#8377;${Math.round(rawCostB).toLocaleString()} <span class="savings">(-${Math.round((1 - rawCostB / baseCost) * 100)}% vs solo charter)</span>`;

    const co2Savings = Math.round(148 * (emptyPercent / 40));
    co2Val.textContent = `${co2Savings} kg CO₂e`;

    compBSpaceVal.textContent = `${emptyPercent}% Available (${emptyPallets} Pallets)`;
    compBTotalVal.innerHTML = `&#8377;${Math.round(rawCostB).toLocaleString()} <span style="color:#059669; font-weight:600;">(Saved &#8377;${Math.round(baseCost - rawCostB).toLocaleString()})</span>`;
  }

  capacitySlider.addEventListener('input', (e) => {
    updateCoLoadingMatrix(parseInt(e.target.value, 10));
  });

  // Authorize Co-Loading Contract
  authorizeMatchBtn.addEventListener('click', () => {
    const randomHash = Math.random().toString(36).substring(2, 9).toUpperCase();
    contractHash.textContent = `Smart Contract Verified: #RM-CONTRACT-${randomHash}-SUCCESS`;
    authorizeMatchBtn.textContent = '✓ Contract Authenticated & Dispatched';
    authorizeMatchBtn.style.background = '#047857';
    setTimeout(() => {
      authorizeMatchBtn.textContent = 'Authorize Autonomous Contract →';
      authorizeMatchBtn.style.background = '';
    }, 4000);
  });

  // Quick Pair Buttons from Live Feed
  quickPairBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const lane = btn.dataset.lane;
      alert(`AI Match Selected: ${lane}. Setting corridor on map and updating co-loading rate.`);
      document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // What-If Disturbance Simulator Scenarios
  const SCENARIO_DATA = {
    normal: {
      title: 'Standard Optimum Transit',
      tag: 'STATUS: OPTIMAL',
      tagClass: 'sim-tag',
      desc: 'Direct transit via Mumbai-Pune Expressway. Zero delays reported. Ideal for temperature-sensitive cargo.',
      duration: '2h 45m',
      dist: '148.5 km',
      cost: '₹4,820',
      rec: 'Maintain Expressway Lane'
    },
    monsoon: {
      title: 'Heavy Monsoon Downpour on Khandala Ghats',
      tag: 'DELAY: +35 MIN',
      tagClass: 'sim-tag text-amber',
      desc: 'Waterlogging and poor visibility between Lonavala and Khandala. Speed restriction 40 km/h.',
      duration: '3h 20m (+35m)',
      dist: '152.0 km',
      cost: '₹5,340 (+11% fuel)',
      rec: 'Hold speed to 45 km/h & activate anti-skid reefer lock'
    },
    toll: {
      title: 'Khalapur Toll Plaza Bottleneck',
      tag: 'CONGESTION: +20 MIN',
      tagClass: 'sim-tag text-purple',
      desc: 'RFID sensor maintenance causing 3 km queue at Khalapur plaza.',
      duration: '3h 05m (+20m)',
      dist: '148.5 km',
      cost: '₹5,100',
      rec: 'Divert via Old NH-48 bypass lane'
    },
    overheat: {
      title: 'Reefer Telemetry Incline Strain',
      tag: 'SENSITIVE CARGO WARNING',
      tagClass: 'sim-tag text-rose',
      desc: 'Heavy climb through Bhor Ghat pushing auxiliary engine temp to 92°C. Cargo temp steady at -18°C.',
      duration: '2h 55m',
      dist: '148.5 km',
      cost: '₹4,950',
      rec: 'Pulse compressor cycling every 12 mins'
    }
  };

  scenarioBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      scenarioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const sc = SCENARIO_DATA[btn.dataset.scenario];
      if (sc) {
        simTitle.textContent = sc.title;
        simTag.textContent = sc.tag;
        simDesc.textContent = sc.desc;
        simDuration.textContent = sc.duration;
        simDist.textContent = sc.dist;
        simCost.textContent = sc.cost;
        simRec.textContent = sc.rec;
      }
    });
  });

  // Initial Calculation
  updateRoute();
  updateCoLoadingMatrix(60);
});
