import { useAppUpdater } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "@meditrack/i18n";
import { getVersion } from "@tauri-apps/api/app";
import { useState, useEffect } from "react";

export function ManualUpdateCheck() {
  const { t } = useTranslation("common");
  const { update, checking, error, checkForUpdates } = useAppUpdater();
  const [currentVersion, setCurrentVersion] = useState<string>("0.3.0");

  useEffect(() => {
    // Get version from Tauri
    getVersion()
      .then(setCurrentVersion)
      .catch(() => {
        // Fallback to package version
        setCurrentVersion("0.3.0");
      });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          {t("update.checkForUpdates")}
        </CardTitle>
        <CardDescription>
          {t("update.currentVersion", { version: currentVersion })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!update && !error && !checking && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{t("update.upToDate")}</AlertDescription>
          </Alert>
        )}

        {update && (
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              {t("update.newVersion", { version: update.version })}
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={checkForUpdates} disabled={checking} variant="outline">
          {checking && <Loader2 className="h-4 w-4 animate-spin" />}
          {checking ? t("update.checking") : t("update.checkForUpdates")}
        </Button>
      </CardContent>
    </Card>
  );
}
