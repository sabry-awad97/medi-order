/**
 * Splash Screen Component
 *
 * Displays a beautiful loading screen while the app initializes.
 * Automatically hidden once React mounts.
 */

import { Pill } from "lucide-react";
import { useEffect } from "react";

export function SplashScreen() {
  useEffect(() => {
    // Hide splash screen after component mounts
    const splash = document.getElementById("splash-screen");
    if (splash) {
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
