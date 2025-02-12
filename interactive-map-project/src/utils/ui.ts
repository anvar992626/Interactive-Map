import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

// ✅ Define Interface for Function Parameters
interface UIProps {
    view: MapView;
    featureLayer: FeatureLayer | null;
}

export function setupUI({ view, featureLayer }: UIProps): void {
    console.log("✅ Initializing UI Controls...");

    // ✅ Ensure the reset button works
    const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement | null;
    resetBtn?.addEventListener("click", () => {
        view.goTo({ center: [-74.006, 40.7128], zoom: 10 });
    });

    

    const darkModeBtn = document.getElementById("darkModeBtn") as HTMLButtonElement | null;

    if (!darkModeBtn) {
        console.warn("⚠️ Warning: Dark mode button (#darkModeBtn) not found.");
    } else {
        darkModeBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
    
            const icon = darkModeBtn.querySelector("i");
            if (icon) {
                icon.classList.toggle("bi-sun", document.body.classList.contains("dark-mode"));
                icon.classList.toggle("bi-moon-stars", !document.body.classList.contains("dark-mode"));
            }
        });
    }
    
}    
