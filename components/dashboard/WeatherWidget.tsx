"use client";

console.log("🌤️ WeatherWidget FILE LOADED");

export default function TestComponent() {
  console.log("🌤️ TestComponent: MINIMAL TEST STARTED");

  return (
    <div
      style={{
        backgroundColor: "lime",
        color: "black", 
        padding: "20px",
        border: "3px solid red",
        fontSize: "18px",
        fontWeight: "bold",
      }}
    >
      ✅ TEST COMPONENT IS WORKING!
    </div>
  );
}