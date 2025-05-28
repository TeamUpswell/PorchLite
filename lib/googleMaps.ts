import { Loader } from "@googlemaps/js-api-loader";

// Create a single loader instance with ALL libraries you need
const mapsLoader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  version: "weekly",
  libraries: ["places"], // Include all libraries you might need
  id: "__googleMapsScriptId", // Ensure consistent ID
});

// Use this single loader instance throughout your app
export const loadMapsApi = async () => {
  try {
    return await mapsLoader.load();
  } catch (error) {
    console.error("Error loading Google Maps API:", error);
    throw error;
  }
};

// Export the loader in case it's needed directly
export { mapsLoader };