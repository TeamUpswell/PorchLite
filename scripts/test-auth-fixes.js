/**
 * Test script to validate the auth and property loading fixes
 * Run this in the browser console to verify the issues are resolved
 */

const testAuthAndPropertyLoading = () => {
  console.log("🧪 Testing Auth and Property Loading Fixes");

  // Test 1: Check if API endpoints exist
  const testAPIEndpoints = async () => {
    console.log("📡 Testing API endpoints...");

    try {
      // Test cleaning-sections endpoint
      const cleaningResponse = await fetch("/api/cleaning-sections");
      console.log(
        "✅ /api/cleaning-sections:",
        cleaningResponse.status === 200
          ? "OK"
          : `Error ${cleaningResponse.status}`
      );

      // Test house instructions page
      const instructionsResponse = await fetch("/house/instructions/manage");
      console.log(
        "✅ /house/instructions/manage:",
        instructionsResponse.status === 200
          ? "OK"
          : `Error ${instructionsResponse.status}`
      );
    } catch (error) {
      console.error("❌ API endpoint test failed:", error);
    }
  };

  // Test 2: Monitor auth state changes
  const testAuthStateStability = () => {
    console.log("🔐 Monitoring auth state stability...");

    let authStateChanges = 0;
    let propertyStateChanges = 0;

    // Monitor for excessive state changes (indicating loops)
    const startTime = Date.now();
    const monitorDuration = 10000; // 10 seconds

    const checkForExcessiveChanges = () => {
      setTimeout(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= monitorDuration) {
          console.log("📊 Auth State Stability Report:");
          console.log(`   Auth state changes: ${authStateChanges}`);
          console.log(`   Property state changes: ${propertyStateChanges}`);

          if (authStateChanges > 10) {
            console.warn(
              "⚠️ Excessive auth state changes detected - possible loop"
            );
          } else {
            console.log("✅ Auth state appears stable");
          }

          if (propertyStateChanges > 10) {
            console.warn(
              "⚠️ Excessive property state changes detected - possible loop"
            );
          } else {
            console.log("✅ Property state appears stable");
          }
        } else {
          checkForExcessiveChanges();
        }
      }, 1000);
    };

    // Start monitoring
    checkForExcessiveChanges();

    // Listen for console logs that indicate state changes
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(" ");
      if (message.includes("🔄 Auth: State changed")) {
        authStateChanges++;
      }
      if (message.includes("🏠 Property:")) {
        propertyStateChanges++;
      }
      originalLog.apply(console, args);
    };

    // Restore original console.log after monitoring
    setTimeout(() => {
      console.log = originalLog;
    }, monitorDuration + 1000);
  };

  // Run tests
  testAPIEndpoints();
  testAuthStateStability();

  console.log(
    "🧪 Test monitoring started. Check console for results in 10 seconds."
  );
};

// Auto-run if in browser
if (typeof window !== "undefined") {
  testAuthAndPropertyLoading();
}

export default testAuthAndPropertyLoading;
