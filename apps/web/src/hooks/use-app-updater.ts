import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useState, useEffect } from "react";

export function useAppUpdater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = async () => {
    setChecking(true);
    setError(null);

    try {
      const updateInfo = await check();
      setUpdate(updateInfo ?? null);
      return updateInfo;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to check for updates";
      setError(message);
      console.error("Update check failed:", err);
      return null;
    } finally {
      setChecking(false);
    }
  };

  const dismissUpdate = () => {
    // Just close the dialog for this session
    // It will show again on next app launch
    setUpdate(null);
  };

  const downloadAndInstall = async () => {
    if (!update) return;

    setDownloading(true);
    setError(null);

    try {
      let totalBytes = 0;
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            setDownloadProgress(0);
            totalBytes = 0;
            console.log("Download started");
            break;
          case "Progress":
            totalBytes += event.data.chunkLength;
            // Update progress based on chunks received
            setDownloadProgress(
              Math.min((totalBytes / (1024 * 1024 * 50)) * 100, 99),
            );
            console.log(`Downloaded ${totalBytes} bytes`);
            break;
          case "Finished":
            setDownloadProgress(100);
            console.log("Download finished");
            break;
        }
      });

      // Restart the app to apply the update
      await relaunch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to download update";
      setError(message);
      console.error("Update installation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  // Auto-check on mount (only in production)
  useEffect(() => {
    if (import.meta.env.PROD) {
      checkForUpdates();
    }
  }, []);

  return {
    update,
    checking,
    downloading,
    downloadProgress,
    error,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
  };
}
