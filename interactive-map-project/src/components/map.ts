import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import * as Locator from "@arcgis/core/rest/locator";
import Search from "@arcgis/core/widgets/Search";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import { Point } from "@arcgis/core/geometry";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";

interface MapViewProps {
    view: MapView;
    featureLayer: FeatureLayer | null;
}

let cityLayer: FeatureLayer | null = null; // Store the layer globally

// ✅ Initialize the Map
export async function initMap(): Promise<MapViewProps> {
    console.log("✅ Initializing ArcGIS Map...");

    const mapContainer = document.getElementById("mapView");
    if (!mapContainer) throw new Error("❌ #mapView not found!");

    const map = new Map({ basemap: "streets-navigation-vector" });

    const view = new MapView({
        container: "mapView",
        map: map,
        center: [-74.006, 40.7128], // New York City
        zoom: 5
    });

    console.log("✅ Map view initialized.");

    // ✅ Attach UI Functions
    setupCityToggle(map);

    setupZoomControls(view);

    // ✅ Attach Click Event for Reverse Geocoding
    view.on("click", async (event) => handleMapClick(event, view));

    return { view, featureLayer: null };
}

// ✅ Setup Zoom In & Zoom Out Controls
function setupZoomControls(view: MapView) {
    console.log("✅ Adding Zoom Controls...");

    const zoomContainer = document.createElement("div");
    zoomContainer.classList.add("zoom-controls");

    const zoomInButton = document.createElement("button");
    zoomInButton.innerHTML = "➕";
    zoomInButton.classList.add("zoom-btn");
    zoomInButton.setAttribute("aria-label", "Zoom In");
    zoomInButton.addEventListener("click", () => view.zoom += 1);

    const zoomOutButton = document.createElement("button");
    zoomOutButton.innerHTML = "➖";
    zoomOutButton.classList.add("zoom-btn");
    zoomOutButton.setAttribute("aria-label", "Zoom Out");
    zoomOutButton.addEventListener("click", () => view.zoom -= 1);

    zoomContainer.appendChild(zoomInButton);
    zoomContainer.appendChild(zoomOutButton);
    document.body.appendChild(zoomContainer);

    console.log("✅ Zoom Controls Added!");
}

// ✅ Handle Click Events for Reverse Geocoding
async function handleMapClick(event: __esri.ViewClickEvent, view: MapView)
 {
    console.log("📍 Map clicked at:", event.mapPoint);

    const point = event.mapPoint as Point;
    const lat = point.latitude.toFixed(6);
    const lon = point.longitude.toFixed(6);

    const locatorUrl = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";
    const locationResponse = await Locator.locationToAddress(locatorUrl, { location: point }).catch(() => null);

    let addressInfo = "Unknown Location";
    if (locationResponse) {
        addressInfo = `
         📍 <b class="street"></b> ${locationResponse.attributes.Address || "N/A"}<br>
        🌍 <b class="country"></b> ${locationResponse.attributes.CountryCode || "N/A"}<br>
            🏙️ <b class="city"></b> ${locationResponse.attributes.City || "N/A"}<br>
            
        `;
    }

    view.graphics.removeAll();
    view.graphics.add(new Graphic({
        geometry: point,
        symbol: new SimpleMarkerSymbol({ style: "circle", color: "blue", size: "10px", outline: { color: "black", width: 1 } })
    }));

    showPopup(lat, lon, addressInfo, view);


}





export function showPopup(lat: string, lon: string, content: string, view: MapView) {
    console.log("🗑 Removing old popup...");
    
    // ✅ Remove any existing popup before creating a new one
    const existingPopup = document.getElementById("customPopup");
    if (existingPopup) {
        existingPopup.remove();
    }

    // ✅ Create and style the popup container
    const popupContainer = document.createElement("div");
    popupContainer.id = "customPopup";
    popupContainer.classList.add("custom-popup");
    document.body.appendChild(popupContainer);

    // ✅ Set popup content
    popupContainer.innerHTML = `
        <div class="popup-content">
             <button class="close-popup">✖</button>
            ${content}

            <p class="p"> <b>:</b> ${lat}, ${lon}</p>
           
        </div>
    `;

    // ✅ Position the popup correctly
    const screenPoint = view.toScreen(new Point({ longitude: parseFloat(lon), latitude: parseFloat(lat) }));
    popupContainer.style.left = `${screenPoint.x}px`;
    popupContainer.style.top = `${screenPoint.y}px`;
    popupContainer.style.display = "block";

    // ✅ Close Popup on Click
    document.querySelector("#customPopup .close-popup")?.addEventListener("click", () => popupContainer.remove());

    console.log("✅ Floating popup displayed at:", { lat, lon });
}






// ✅ Attach Toggle Button for Cities
export function setupCityToggle(map: Map) {
    const toggleLayerBtn = document.getElementById("toggleLayerBtn") as HTMLButtonElement | null;
    if (toggleLayerBtn) {
        toggleLayerBtn.addEventListener("click", () => toggleCityLayer(map, toggleLayerBtn));
    } else {
        console.error("❌ Toggle button not found in the DOM.");
    }
}

// ✅ Toggle City Markers on Button Click
async function toggleCityLayer(map: Map, button: HTMLButtonElement) {
    if (!cityLayer) {
        cityLayer = await loadCityData(map);
        button.innerHTML = `<i class="bi bi-geo-alt-fill"></i>`;  // Set icon when markers are loaded
    } else {
        cityLayer.visible = !cityLayer.visible;
        button.innerHTML = cityLayer.visible  
            ? `<i class="bi bi-geo-alt-fill"></i>`  // Filled icon when markers are visible
            : `<i class="bi bi-geo-alt"></i>`;      // Outline icon when markers are hidden
        console.log(`✅ City Markers are now ${cityLayer.visible ? "VISIBLE" : "HIDDEN"}`);
    }
}

// ✅ Fetch City Data from locations.geojson and Add to the Map
async function loadCityData(map: Map): Promise<FeatureLayer> {
    console.log("✅ Fetching City Data from locations.geojson...");

    const geoJsonUrl = "/data/locations.geojson"; // ✅ Path inside 'public/data'
    try {
        const response = await fetch(geoJsonUrl);
        if (!response.ok) throw new Error(`❌ Failed to load locations.geojson: ${response.statusText}`);
        const locations = await response.json();

        const cityGraphics: Graphic[] = locations.features.map((feature: any, index: number) => {
            const [longitude, latitude] = feature.geometry.coordinates;
            const name = feature.properties.name;
            const description = feature.properties.description || "City Location";

            return new Graphic({
                geometry: new Point({ longitude, latitude }),
                attributes: { ObjectID: index + 1, name, description },
                popupTemplate: { title: "{name}", content: "{description}" }
            });
        });

        if (cityGraphics.length === 0) throw new Error("❌ No valid city locations found in locations.geojson.");

        const renderer = new SimpleRenderer({
            symbol: new PictureMarkerSymbol({
                url: "https://cdn-icons-png.flaticon.com/512/2776/2776000.png", 
                width: "32px",
                height: "32px"
            })
        });

        cityLayer = new FeatureLayer({
            source: cityGraphics,
            objectIdField: "ObjectID",
            popupTemplate: { title: "{name}", content: "📍 {description}" },
            renderer
        });

        map.add(cityLayer);
        console.log(`✅ Loaded ${cityGraphics.length} city markers successfully!`);
        return cityLayer;
    } catch (error) {
        console.error("❌ Error fetching city data:", error);
        return null;
    }
}
