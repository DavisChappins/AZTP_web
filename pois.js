const iconSettings = {
    0: 'icons/map_town.svg',
    1: 'icons/map_town.svg',
    2: 'icons/alt_landable_airport.svg',
    3: 'icons/alt_landable_field.svg',
    4: 'icons/alt_landable_airport.svg',
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
    8: { size: '8px', visible: true },
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

document.addEventListener('DOMContentLoaded', function () {
    const map = L.map('map').setView([20, 0], 2);

    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 18
    }).addTo(map);

    L.control.layers({ "Street Map": streets, "Satellite": satellite }).addTo(map);

    let markers = []; // Store marker references for updating on zoom change

    fetch('pois.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(poi => {
                const lat = convertDMSToDD(poi.lat);
                const lon = convertDMSToDD(poi.lon);
                createMarker(poi, lat, lon);
            });
        })
        .catch(error => console.error('Error loading POI data:', error));

    map.on('zoomend', function() {
        console.log(`Zoom level changed: ${map.getZoom()}`);
        markers.forEach(({ marker, poi }) => {
            const iconSize = ICON_SIZES[map.getZoom()] || ICON_SIZES[10]; // Default to size for zoom level 10 if undefined
            updateMarkerIcon(marker, poi, iconSize);
        });
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
            const detailsHtml = generateDetailsHtml(poi);
            document.getElementById('poi-details').innerHTML = detailsHtml;
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

    function generateDetailsHtml(poi) {
        return `
            <div class="poi-details">
                <p><strong>Name:</strong> ${poi.name}</p>
                <p><strong>Code:</strong> ${poi.code}</p>
                <p><strong>Country:</strong> ${poi.country}</p>
                <p><strong>Latitude:</strong> ${poi.lat}</p>
                <p><strong>Longitude:</strong> ${poi.lon}</p>
                <p><strong>Elevation:</strong> ${poi.elev}</p>
                <p><strong>Style:</strong> ${poi.style}</p>
                <p><strong>Runway Direction:</strong> ${poi.rwdir}°</p>
                <p><strong>Runway Length:</strong> ${poi.rwlen}</p>
                <p><strong>Runway Width:</strong> ${poi.rwwidth}</p>
                <p><strong>Frequency:</strong> ${poi.freq || 'N/A'}</p>
                <p><strong>Description:</strong> ${poi.desc}</p>
            </div>
        `;
    }
});
