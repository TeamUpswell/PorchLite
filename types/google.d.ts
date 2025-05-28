// Create this file to extend the Window interface

declare global {
  interface Window {
    google: typeof google;
  }
}

export {};