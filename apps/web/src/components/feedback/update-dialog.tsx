import { useAppUpdater } from "@/hooks/use-app-updater";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, AlertCircle } from "lucide-react";
import { useTranslation } from "@meditrack/i18n";

// Detect if text is primarily Arabic
function isArabicText(text: string): boolean {
  // Arabic Unicode range: \u0600-\u06FF
  const arabicChars = text.match(/[\u0600-\u06FF]/g);
  const totalChars = text.replace(/\s/g, "").length;

  if (totalChars === 0) return false;

  // If more than 30% of characters are Arabic, consider it Arabic text
  const arabicRatio = (arabicChars?.length || 0) / totalChars;
  return arabicRatio > 0.3;
}

export function UpdateDialog() {
  const { t } = useTranslation();
  const {
    update,
    checking,
    downloading,
    downloadProgress,
    error,
    downloadAndInstall,
    dismissUpdate,
  } = useAppUpdater();

  const isOpen = !!update && !downloading;

  // Detect text direction for release notes
  const releaseNotesDir =
    update?.body && isArabicText(update.body) ? "rtl" : "ltr";
  const releaseNotesAlign =
    releaseNotesDir === "rtl" ? "text-right" : "text-left";

  if (!update) return null;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("update.available")}
          </DialogTitle>
          <DialogDescription>
            {t("update.newVersion", { version: update.version })}
          </DialogDescription>
        </DialogHeader>

        {update.body && (
          <div
            className="my-4 max-h-60 overflow-y-auto rounded-md bg-muted p-4"
            dir={releaseNotesDir}
          >
            <p className={`text-sm whitespace-pre-wrap ${releaseNotesAlign}`}>
              {update.body}
            </p>
          </div>
        )}

        {update.date && (
          <p className="text-xs text-muted-foreground">
            {t("update.releaseDate", {
              date: new Date(update.date).toLocaleDateString("ar-EG"),
            })}
          </p>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {downloading && (
          <div className="space-y-2">
            <Progress value={downloadProgress} />
            <p className="text-sm text-muted-foreground text-center">
              {t("update.downloadProgress", {
                progress: Math.round(downloadProgress),
              })}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={dismissUpdate}
            disabled={downloading || checking}
          >
            {t("update.later")}
          </Button>
          <Button
            onClick={downloadAndInstall}
            disabled={downloading || checking}
          >
            {downloading ? t("update.downloading") : t("update.updateNow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
