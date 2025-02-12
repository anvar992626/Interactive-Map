import { Point } from "@arcgis/core/geometry";
import MapView from "@arcgis/core/views/MapView";
import Search from "@arcgis/core/widgets/Search";
import Graphic from "@arcgis/core/Graphic";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import { showPopup } from "./map";
import { debounce } from "lodash-es";

export function setupSearch(view: MapView): void {
    console.log("✅ Initializing Search Widget...");

    if (!view) {
        console.error("❌ Error: MapView is undefined in setupSearch.");
        return;
    }

    const searchWidget = new Search({ 
        view, 
        popupEnabled: false, 
        includeDefaultSources: true,
        maxSuggestions: 5
    });
    view.ui.add(searchWidget, "top-right");

    const searchBox = document.getElementById("searchBox") as HTMLInputElement | null;
    
    if (searchBox) {
        // ✅ Add debounced input handler
        const debouncedSearch = debounce((query: string) => {
            if (query.length >= 2) { // Minimum 2 characters
                console.log(`🔍 Debounced search for: ${query}`);
                searchWidget.search(query);
            }
        }, 300);

        // ✅ Handle text input with debounce
        searchBox.addEventListener("input", (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (!target) return;
            const query = target.value.trim();
            if (query) debouncedSearch(query);
        });
        
        // ✅ Preserve existing Enter key functionality
        searchBox.addEventListener("keyup", (event) => {
            if (event.key === "Enter") {
                const query = searchBox.value.trim();
                if (query) {
                    console.log(`🔍 Immediate search for: ${query}`);
                    debouncedSearch.cancel(); // Cancel any pending debounced searches
                    searchWidget.search(query);
                }
            }
        });
    }

    // ✅ Keep existing search result handler
    searchWidget.on("select-result", async (event) => {
        console.log("🔍 Search result selected:", event.result);

        const result = event.result;
        if (!result?.feature?.geometry) {
            console.warn("❌ No valid location found in search result.");
            return;
        }

        const point = result.feature.geometry as Point;
        const attributes = result.feature.attributes || {};

        document.getElementById("customPopup")?.remove();
        view.graphics.removeAll();

        const marker = new Graphic({
            geometry: point,
            symbol: new SimpleMarkerSymbol({
                style: "circle",
                color: [255, 0, 0, 0.8],
                size: "12px",
                outline: { color: [255, 255, 255, 0.8], width: 2 }
            })
        });
        view.graphics.add(marker);

        const addressInfo = `🏙️ <b>City:</b> ${attributes.City || "N/A"}`;
        
        await view.goTo({ target: point, zoom: 15 }, { 
            duration: 1000, 
            easing: "ease-out" 
        }).then(() => {
            showPopup(
                point.latitude.toFixed(6), 
                point.longitude.toFixed(6), 
                addressInfo, 
                view
            );
        });
    });

    // ✅ Preserve error handling and cleanup
    searchWidget.on("search-complete", (event) => {
        if (event.errors?.length > 0) {
            console.error("❌ Search failed:", event.errors);
        }
    });

    searchWidget.on("search-clear", () => {
        console.log("🧹 Search cleared...");
        if (view.graphics.length > 0) {
            view.graphics.removeAll();
        }
        document.getElementById("customPopup")?.remove();
    });
    

    console.log("✅ Search widget initialized with debounced search!");
}