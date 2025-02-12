// main.ts
import { initMap } from "./components/map";
import { setupSearch } from "./components/search";
import { setupUI } from "./utils/ui";
import MapView from "@arcgis/core/views/MapView";

(async () => {
    try {
        console.log("✅ Initializing app...");
        const { view, featureLayer } = await initMap();

        if (view instanceof MapView) {
            setupUI({ view, featureLayer });
            setupSearch(view);
            console.log("✅ App initialized successfully!");
        } else {
            throw new Error("❌ Map initialization failed or returned an invalid view.");
        }
    } catch (error) {
        console.error("❌ Error initializing the app:", error);
        document.body.innerHTML = `<h1 style="color: red; text-align: center;">❌ Failed to initialize the application. Please reload.</h1>`;
    }
    
})();
