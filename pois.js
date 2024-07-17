const iconSettings = {
    0: 'icons/map_town.svg',
    1: 'icons/map_town.svg',
    2: 'icons/alt_landable_airport.svg',
    3: 'icons/alt_landable_field.svg',
    4: 'icons/alt_reachable_airport.svg',
    5: 'icons/alt_reachable_airport.svg',
    6: 'icons/map_pass.svg',
    7: 'icons/map_mountain_top.svg',
    8: 'icons/map_obstacle.svg',
    9: 'icons/map_vor.svg',
    10: 'icons/map_ndb.svg',
    11: 'icons/map_tower.svg',
    12: 'icons/map_dam.svg',
    13: 'icons/map_tunnel.svg',
    14: 'icons/map_bridge.svg',
    15: 'icons/map_power_plant.svg',
    16: 'icons/map_castle.svg',
    17: 'icons/map_intersection.svg'
};

// Add the mapping as a constant
const styleMapping = {
    0: "Unknown",
    1: "Waypoint",
    2: "Airfield with a grass/dirt runway",
    3: "Outlanding/field",
    4: "Gliding airfield",
    5: "Airfield with a paved runway",
    6: "Mountain Pass",
    7: "Mountain Top",
    8: "Transmitter Mast",
    9: "VOR",
    10: "NDB",
    11: "Cooling Tower",
    12: "Dam",
    13: "Tunnel",
    14: "Bridge",
    15: "Power Plant",
    16: "Castle",
    17: "Intersection"
};





const ICON_SIZES = {
    0: [6, 6],   // Icon size at zoom level 0
    1: [6, 6],   // Icon size at zoom level 1
    2: [7, 7],   // Icon size at zoom level 2
    3: [8, 8],   // Icon size at zoom level 3
    4: [8, 8],   // Icon size at zoom level 4
    5: [8, 8],   // Icon size at zoom level 5
    6: [9, 9],   // Icon size at zoom level 6
    7: [9, 9],   // Icon size at zoom level 7
    8: [10, 10],   // Icon size at zoom level 8
    9: [10, 10],   // Icon size at zoom level 9
    10: [14, 14], // Icon size at zoom level 10 and above
    11: [16, 16],
    12: [20, 20],
    13: [20, 20],
    14: [20, 20],
    15: [20, 20],
    16: [20, 20],
    17: [20, 20],
    18: [20, 20]
};

const TEXT_SIZES = {
    0: { size: '4px', visible: false },
    1: { size: '4px', visible: false },
    2: { size: '4px', visible: false },
    3: { size: '4px', visible: false },
    4: { size: '4px', visible: false },
    5: { size: '4px', visible: false },
    6: { size: '4px', visible: false },
    7: { size: '8px', visible: false },
    8: { size: '8px', visible: false },
    9: { size: '10px', visible: true },
    10: { size: '10px', visible: true },
    11: { size: '10px', visible: true },
    12: { size: '12px', visible: true },
    13: { size: '12px', visible: true },
    14: { size: '12px', visible: true },
    15: { size: '12px', visible: true },
    16: { size: '12px', visible: true },
    17: { size: '12px', visible: true },
    18: { size: '12px', visible: true }
};

function convertDMSToDD(dms) {
    const degrees = parseInt(dms.substring(0, dms.length - 7)); // Assumes the degrees are always at least 2 digits
    const minutes = parseFloat(dms.substring(dms.length - 7, dms.length - 1));
    const direction = dms.charAt(dms.length - 1);
    const dd = degrees + (minutes / 60);
    return (direction === 'S' || direction === 'W') ? -dd : dd;
}

function metersToFeet(meters) {
    const feet = Math.round(meters * 3.28084) + ' ft';
    console.log(`Converting ${meters} meters to ${feet}`);
    return feet;
}

function feetToMeters(feet) {
    const meters = Math.round(feet / 3.28084) + ' m';
    console.log(`Converting ${feet} feet to ${meters}`);
    return meters;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    function toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    const R = 3958.8; // Radius of the Earth in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}






document.addEventListener('DOMContentLoaded', function () {
    // Set the initial view to zoom level 5 and center at lat 38, lon -96
    const map = L.map('map').setView([38, -96], 5);

    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 18
    }).addTo(map);

    L.control.layers({ "Street Map": streets, "Satellite": satellite }).addTo(map);

    let markers = []; // Store marker references for updating on zoom change
    let currentPoi = null; // Store the currently displayed POI details
	let LoadedContests = new Set();

    fetch('pois.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(poi => {
                const contests = poi.webdata.dataset.contest;
                if (contests) {
                    contests.forEach(contest => LoadedContests.add(contest));
                }
                const lat = convertDMSToDD(poi.lat);
                const lon = convertDMSToDD(poi.lon);
                createMarker(poi, lat, lon);
            });
            populateContestDropdown();
            updateVisibleWaypointsCount();
        })
        .catch(error => console.error('Error loading POI data:', error));

    function populateContestDropdown() {
        const contestDropdown = document.getElementById('filter-contest');
        LoadedContests.forEach(contest => {
            const option = document.createElement('option');
            option.value = contest;
            option.textContent = contest;
            contestDropdown.appendChild(option);
        });
        // Debug output
        console.log('LoadedContests:', Array.from(LoadedContests));
    }
	
    document.getElementById('download-waypoints-btn').addEventListener('click', function() {
        const visibleWaypoints = markers
            .filter(({ marker }) => marker.options.opacity === 1)
            .map(({ poi }) => poi);
        
        const cupFileContent = convertJsonToCup(visibleWaypoints);
        const currentDate = new Date().toISOString().slice(0, 10);
        const fileName = `USTP_${currentDate}.cup`;
        
        const blob = new Blob([cupFileContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    });

    function convertJsonToCup(jsonData) {
        const cupHeaders = [
            "name", "code", "country", "lat", "lon", "elev", "style", 
            "rwdir", "rwlen", "rwwidth", "freq", "desc", "userdata", "pics"
        ];

        const csvRows = [];
        csvRows.push(cupHeaders.join(','));

        jsonData.forEach(entry => {
            const cupRow = cupHeaders.map(header => `"${entry[header] || ''}"`);
            csvRows.push(cupRow.join(','));
        });

        return csvRows.join('\n');
    }

    document.getElementById('contest-filter-btn').addEventListener('click', function() {
        const selectedContest = document.getElementById('filter-contest').value;
        console.log('Selected Contest:', selectedContest);

        fetch('pois.json')
            .then(response => response.json())
            .then(data => {
                markers.forEach(({ marker, poi }) => {
                    const contests = poi.webdata.dataset.contest;
                    if (contests && contests.includes(selectedContest)) {
                        marker.setOpacity(1); // Show the marker
                        marker.getElement().querySelector('div').style.visibility = 'visible'; // Show the label
                        console.log(`Showing ${poi.name}`);
                    } else {
                        marker.setOpacity(0); // Hide the marker
                        marker.getElement().querySelector('div').style.visibility = 'hidden'; // Hide the label
                        console.log(`Hiding ${poi.name}`);
                    }
                });

                updateVisibleWaypointsCount();
            })
            .catch(error => console.error('Error loading POI data:', error));
    });

    map.on('zoomend', function() {
        console.log(`Zoom level changed: ${map.getZoom()}`);
        markers.forEach(({ marker, poi }) => {
            const iconSize = ICON_SIZES[map.getZoom()] || ICON_SIZES[10]; // Default to size for zoom level 10 if undefined
            updateMarkerIcon(marker, poi, iconSize);
        });
        handleAirspaceLabelsVisibility(map.getZoom());
        adjustCircles();
    });

    const visibleWaypointsSpan = document.getElementById('visible-waypoints');

    function updateVisibleWaypointsCount() {
        const visibleMarkers = markers.filter(({ marker }) => marker.options.opacity === 1);
        visibleWaypointsSpan.textContent = `Number of visible waypoints: ${visibleMarkers.length}`;
    }



    document.getElementById('filter-btn').addEventListener('click', function() {
        const centerName = document.getElementById('filter-center').value;
        const radius = parseFloat(document.getElementById('filter-radius').value);
        console.log('Filter button clicked');
        console.log('Center Name:', centerName);
        console.log('Radius:', radius);

        fetch('pois.json')
            .then(response => response.json())
            .then(data => {
                const centerPoi = data.find(poi => poi.name === centerName);
                if (!centerPoi) {
                    alert('POI not found');
                    console.log('POI not found:', centerName);
                    return;
                }

                const centerLat = convertDMSToDD(centerPoi.lat);
                const centerLon = convertDMSToDD(centerPoi.lon);
                console.log('Center POI:', centerPoi);
                console.log('Center Coordinates:', centerLat, centerLon);

                markers.forEach(({ marker, poi }) => {
                    const lat = convertDMSToDD(poi.lat);
                    const lon = convertDMSToDD(poi.lon);
                    const distance = calculateDistance(centerLat, centerLon, lat, lon);
                    console.log(`Distance from ${centerName} to ${poi.name}: ${distance} miles`);

                    if (distance > radius) {
                        marker.setOpacity(0); // Hide the marker
                        marker.getElement().querySelector('div').style.visibility = 'hidden'; // Hide the label
                        console.log(`Hiding ${poi.name}`);
                    } else {
                        marker.setOpacity(1); // Show the marker
                        marker.getElement().querySelector('div').style.visibility = 'visible'; // Show the label
                        console.log(`Showing ${poi.name}`);
                    }
                });

                updateVisibleWaypointsCount();
            })
            .catch(error => console.error('Error loading POI data:', error));
    });

    document.getElementById('show-all-btn').addEventListener('click', function() {
        console.log('Show All button clicked');
        markers.forEach(({ marker, poi }) => {
            marker.setOpacity(1); // Show the marker
            marker.getElement().querySelector('div').style.visibility = 'visible'; // Show the label
            console.log(`Showing ${poi.name}`);
        });
        updateVisibleWaypointsCount();
    });

    document.getElementById('filter-radius').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission if inside a form
            document.getElementById('filter-btn').click();
        }
    });

    function createMarker(poi, lat, lon) {
        const zoomLevel = map.getZoom();
        const iconSize = ICON_SIZES[zoomLevel] || ICON_SIZES[10];
        const iconUrl = iconSettings[poi.style] || 'icons/default_icon.svg';
        const textSize = TEXT_SIZES[zoomLevel].size;
        const textVisible = TEXT_SIZES[zoomLevel].visible ? 'visible' : 'hidden';

        const customIcon = L.divIcon({
            html: `
                <div style="position: relative;">
                    <img src="${iconUrl}" style="width: 100%; height: 100%; transform: rotate(${parseFloat(poi.rwdir) - 45}deg); transform-origin: center;">
                    <div style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); width: 200px; white-space: nowrap; text-align: center; font-size: ${textSize}; visibility: ${textVisible}; color: white; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;">
                        ${poi.name}
                    </div>
                </div>
            `,
            className: '',
            iconSize: iconSize,
            iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
            popupAnchor: [0, -iconSize[1] / 2]
        });

        const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
        markers.push({ marker, poi });

        marker.on('click', () => {
            console.log('Marker clicked:', poi.name);
            currentPoi = poi; // Store the current POI details
            updatePoiDetails(poi);
            document.getElementById('filter-center').value = poi.name; // Populate the filter center field
            console.log('Filter Center populated:', poi.name);
        });
    }

    function updateMarkerIcon(marker, poi, iconSize) {
        const zoomLevel = map.getZoom();
        const iconUrl = iconSettings[poi.style] || 'icons/default_icon.svg';
        const textSize = TEXT_SIZES[zoomLevel].size;
        const textVisible = TEXT_SIZES[zoomLevel].visible ? 'visible' : 'hidden';

        const customIcon = L.divIcon({
            html: `
                <div style="position: relative;">
                    <img src="${iconUrl}" style="width: 100%; height: 100%; transform: rotate(${parseFloat(poi.rwdir) - 45}deg); transform-origin: center;">
                    <div style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); width: 200px; white-space: nowrap; text-align: center; font-size: ${textSize}; visibility: ${textVisible}; color: white; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;">
                        ${poi.name}
                    </div>
                </div>
            `,
            className: '',
            iconSize: iconSize,
            iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
            popupAnchor: [0, -iconSize[1] / 2]
        });

        marker.setIcon(customIcon);
    }

    function updatePoiDetails(poi) {
        const unit = document.getElementById('units').value;
        console.log('Current unit:', unit);

        let elev = poi.elev;
        let rwlen = poi.rwlen;
        let rwwidth = poi.rwwidth;

        if (unit === 'imperial') {
            if (elev.endsWith('m')) {
                elev = metersToFeet(parseFloat(elev));
            }
            if (rwlen.endsWith('m')) {
                rwlen = metersToFeet(parseFloat(rwlen));
            }
            if (rwwidth.endsWith('m')) {
                rwwidth = metersToFeet(parseFloat(rwwidth));
            }
        } else {
            if (elev.endsWith('ft')) {
                elev = feetToMeters(parseFloat(elev));
            }
            if (rwlen.endsWith('ft')) {
                rwlen = feetToMeters(parseFloat(rwlen));
            }
            if (rwwidth.endsWith('ft')) {
                rwwidth = feetToMeters(parseFloat(rwwidth));
            }
        }

        console.log(`Displaying details for ${poi.name}:`, { elev, rwlen, rwwidth });

        document.getElementById('poi-name').textContent = poi.name;
        document.getElementById('poi-code').textContent = poi.code;
        document.getElementById('poi-country').textContent = poi.country;
        document.getElementById('poi-lat').textContent = poi.lat;
        document.getElementById('poi-lon').textContent = poi.lon;
        document.getElementById('poi-elev').textContent = elev;

        // Use the mapping to display the style
        const styleValue = poi.style;
        const styleDescription = styleMapping[styleValue] || "Unknown";
        document.getElementById('poi-style').textContent = `${styleValue} - ${styleDescription}`;

        document.getElementById('poi-rwdir').textContent = poi.rwdir + '°';
        document.getElementById('poi-rwlen').textContent = rwlen;
        document.getElementById('poi-rwwidth').textContent = rwwidth;
        document.getElementById('poi-freq').textContent = poi.freq || 'N/A';
        document.getElementById('poi-desc').textContent = poi.desc;

        // Populate Website Data
        document.getElementById('last-update').textContent = poi.webdata.lastupdate;
        document.getElementById('last-survey').textContent = poi.webdata.lastsurvey;
        document.getElementById('last-survey-format').textContent = poi.webdata.lastsurveyformat;

        // Populate Contest Dataset
        const contests = poi.webdata.dataset.contest;
        console.log('Contests:', contests);
        document.getElementById('contests').textContent = contests ? contests.toString() : 'N/A';
    }

	// Add event listener for unit change to update the details if needed
	document.getElementById('units').addEventListener('change', function() {
		console.log('Unit changed:', document.getElementById('units').value);
		if (currentPoi) {
			updatePoiDetails(currentPoi);
		}
	});
	
	
 



    const airspaceLayers = {
        classB: L.layerGroup(),
        classC: L.layerGroup(),
        classD: L.layerGroup(),
        classQ: L.layerGroup(),
        classR: L.layerGroup()
    };

    let airspaceLabels = [];
    let measurementCircles = {
        '15m': null,
        '18m': null
    };

	function loadGeoJsonData() {
		// Load airspace GeoJSON data
		fetch('files/airspaces.geojson')
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok ' + response.statusText);
				}
				console.log('Airspace response:', response);
				return response.json();
			})
			.then(data => {
				console.log('Airspace data:', data);
				L.geoJSON(data, {
					style: feature => {
						switch (feature.properties.CLASS) {
							case 'B': return { color: '#2979B8', weight: 2, fillOpacity: 0.1 };
							case 'C': return { color: '#903B62', weight: 2, fillOpacity: 0.1 };
							case 'D': return { color: '#1D4473', weight: 2, dashArray: '5, 5', fillOpacity: 0.1 };
							case 'Q': return { color: '#903B62', weight: 2, dashArray: '10, 10', fillOpacity: 0.1 };
							case 'R': return { color: '#2979B8', weight: 2, dashArray: '10, 10', fillOpacity: 0.1 };
							default: return { color: '#2979B8', weight: 1, fillOpacity: 0.1 };
						}
					},
					onEachFeature: (feature, layer) => {
						if (feature.properties && feature.properties.NAME) {
							layer.bindPopup(`<strong>${feature.properties.NAME}</strong><br>Type: ${feature.properties.CLASS}`);
						}
						if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
							const bounds = layer.getBounds();
							const center = bounds.getCenter();

							switch (feature.properties.CLASS) {
								case 'B':
									airspaceLayers.classB.addLayer(layer);
									break;
								case 'C':
									airspaceLayers.classC.addLayer(layer);
									break;
								case 'D':
									airspaceLayers.classD.addLayer(layer);
									break;
								case 'Q':
									airspaceLayers.classQ.addLayer(layer);
									break;
								case 'R':
									airspaceLayers.classR.addLayer(layer);
									break;
								default:
									break;
							}
						}
					}
				});
			})
			.catch(error => console.error('Error loading airspace data:', error));

        // Load labels GeoJSON data
        fetch('files/labels.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                console.log('Labels response:', response);
                return response.json();
            })
            .then(data => {
                console.log('Labels data:', data);
                L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => {
                        return L.marker(latlng, {
                            icon: L.divIcon({
                                className: 'label-icon',
                                html: `<div style="background: white; padding: 2px; border: 1px solid black;">${feature.properties.name}</div>`
                            })
                        });
                    }
                }).addTo(map);
            })
            .catch(error => console.error('Error loading labels data:', error));
    }

    loadGeoJsonData();

    // Airspace control with checkboxes
    const airspaceControl = L.control({ position: 'topright' });

    airspaceControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'airspace-control');
        div.innerHTML = `
            <div style="background: white; padding: 10px;">
                <h4>Airspaces</h4>
                <label><input type="checkbox" id="classB"> Class B</label><br>
                <label><input type="checkbox" id="classC"> Class C</label><br>
                <label><input type="checkbox" id="classD"> Class D</label><br>
                <label><input type="checkbox" id="classQ"> DZ/MOA</label><br>
                <label><input type="checkbox" id="classR"> Restricted</label>
            </div>
        `;
        return div;
    };

    airspaceControl.addTo(map);

    document.getElementById('classB').addEventListener('change', function() {
        if (this.checked) {
            map.addLayer(airspaceLayers.classB);
        } else {
            map.removeLayer(airspaceLayers.classB);
        }
    });

    document.getElementById('classC').addEventListener('change', function() {
        if (this.checked) {
            map.addLayer(airspaceLayers.classC);
        } else {
            map.removeLayer(airspaceLayers.classC);
        }
    });

    document.getElementById('classD').addEventListener('change', function() {
        if (this.checked) {
            map.addLayer(airspaceLayers.classD);
        } else {
            map.removeLayer(airspaceLayers.classD);
        }
    });

    document.getElementById('classQ').addEventListener('change', function() {
        if (this.checked) {
            map.addLayer(airspaceLayers.classQ);
        } else {
            map.removeLayer(airspaceLayers.classQ);
        }
    });

    document.getElementById('classR').addEventListener('change', function() {
        if (this.checked) {
            map.addLayer(airspaceLayers.classR);
        } else {
            map.removeLayer(airspaceLayers.classR);
        }
    });

    function handleAirspaceLabelsVisibility(zoomLevel) {
        if (zoomLevel < 9) {
            airspaceLabels.forEach(label => map.removeLayer(label));
        } else {
            airspaceLabels.forEach(label => map.addLayer(label));
        }
    }

    // Measurement control with checkboxes
    const measurementControl = L.control({ position: 'topright' });

    measurementControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'measurement-control');
        div.innerHTML = `
            <div style="background: white; padding: 10px;">
                <h4>Measurement</h4>
                <label><input type="checkbox" id="circle15m"> 15m</label><br>
                <label><input type="checkbox" id="circle18m"> 18m</label>
            </div>
        `;
        return div;
    };

    measurementControl.addTo(map);

    document.getElementById('circle15m').addEventListener('change', function() {
        if (this.checked) {
            drawCircle('15m', 7.5);
        } else {
            removeCircle('15m');
        }
    });

    document.getElementById('circle18m').addEventListener('change', function() {
        if (this.checked) {
            drawCircle('18m', 9);
        } else {
            removeCircle('18m');
        }
    });

    function drawCircle(id, radius) {
        const center = map.getCenter();
        const circle = L.circle(center, {
            radius: radius,
            color: 'white',
            weight: 3,
            opacity: 0.7
        }).addTo(map);
        const label = L.marker(center, {
            icon: L.divIcon({
                className: 'circle-label',
                html: `<div style="font-size: 12px; color: white; text-align: center;">${id}</div>`,
                iconSize: [30, 15]
            })
        }).addTo(map);
        measurementCircles[id] = { circle, label };
    }

    function removeCircle(id) {
        if (measurementCircles[id]) {
            map.removeLayer(measurementCircles[id].circle);
            map.removeLayer(measurementCircles[id].label);
            measurementCircles[id] = null;
        }
    }

    map.on('moveend', function() {
        adjustCircles();
    });

    function adjustCircles() {
        Object.keys(measurementCircles).forEach(id => {
            const measurement = measurementCircles[id];
            if (measurement) {
                const center = map.getCenter();
                measurement.circle.setLatLng(center);
                measurement.label.setLatLng(center);
            }
        });
    }
});
