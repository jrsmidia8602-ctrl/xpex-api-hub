import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeGA4, configureGA4Conversions } from "./lib/analytics";

// Initialize GA4 with enhanced configuration
initializeGA4();

// Log recommended conversions configuration
if (import.meta.env.DEV) {
  configureGA4Conversions();
}

createRoot(document.getElementById("root")!).render(<App />);
