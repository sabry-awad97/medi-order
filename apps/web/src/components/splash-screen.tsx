/**
 * Splash Screen Component
 *
 * Displays a beautiful loading screen while the app initializes.
 * Only shows on first load, not on subsequent refreshes.
 */

import { useEffect } from "react";

export function SplashScreen() {
  useEffect(() => {
    // Check if this is the first load in this session
    const hasShownSplash = sessionStorage.getItem("splash-shown");

    const splash = document.getElementById("splash-screen");
    if (!splash) return;

    if (hasShownSplash) {
      // If splash was already shown, remove it immediately
      splash.remove();
    } else {
      // First load - show splash and mark as shown
      sessionStorage.setItem("splash-shown", "true");

      // Hide splash screen after component mounts
      // Add fade-out animation
      splash.style.opacity = "0";
      splash.style.transition = "opacity 0.3s ease-out";

      // Remove from DOM after animation
      setTimeout(() => {
        splash.remove();
      }, 300);
    }
  }, []);

  return null; // This component doesn't render anything in React
}

// Function to remove splash screen (can be called from anywhere)
export function hideSplashScreen() {
  const splash = document.getElementById("splash-screen");
  if (splash) {
    splash.style.opacity = "0";
    splash.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => {
      splash.remove();
    }, 300);
  }
}

// Function to reset splash screen (for testing or special cases)
export function resetSplashScreen() {
  sessionStorage.removeItem("splash-shown");
}
