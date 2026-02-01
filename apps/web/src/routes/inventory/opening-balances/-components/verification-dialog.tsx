import { useState } from "react";
import { useTranslation, useDirection } from "@meditrack/i18n";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { OpeningBalanceResponse } from "@/api/opening-balance.api";

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: OpeningBalanceResponse | null;
  onVerify: (entryId: string) => void;
  onReject: (entryId: string, reason: string) => void;
}

export function VerificationDialog({
  open,
  onOpenChange,
  entry,
  onVerify,
  onReject,
}: VerificationDialogProps) {
  const { t } = useTranslation("opening-balances");
  const { isRTL } = useDirection();
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!entry) return null;

  const unitPrice =
    typeof entry.unit_price === "string"
      ? parseFloat(entry.unit_price)
      : entry.unit_price;
  const totalValue = entry.quantity * unitPrice;

  const handleVerify = () => {
    onVerify(entry.id);
    onOpenChange(false);
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      return;
    }
    onReject(entry.id, rejectionReason.trim());
    onOpenChange(false);
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const textAlign = isRTL ? "text-right" : "text-left";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className={textAlign}>
            {t("verification.title")}
          </DialogTitle>
          <DialogDescription className={textAlign}>
            {t("verification.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entry Summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div
              className={cn(
                "flex items-center justify-between",
                isRTL && "flex-row-reverse",
              )}
            >
              <span className="text-sm text-muted-foreground">
                {t("verification.item")}
              </span>
              <span className="font-medium">{entry.inventory_item_name}</span>
            </div>
            <Separator />
            <div
              className={cn(
                "flex items-center justify-between",
                isRTL && "flex-row-reverse",
              )}
            >
              <span className="text-sm text-muted-foreground">
                {t("verification.quantity")}
              </span>
              <span className="font-medium">{entry.quantity}</span>
            </div>
            <Separator />
            <div
              className={cn(
                "flex items-center justify-between",
                isRTL && "flex-row-reverse",
              )}
            >
              <span className="text-sm text-muted-foreground">
                {t("verification.unitPrice")}
              </span>
              <span className="font-medium">${unitPrice.toFixed(2)}</span>
            </div>
            <Separator />
            <div
              className={cn(
                "flex items-center justify-between",
                isRTL && "flex-row-reverse",
              )}
            >
              <span className="text-sm text-muted-foreground">
                {t("verification.totalValue")}
              </span>
              <span className="text-lg font-bold text-primary">
                ${totalValue.toFixed(2)}
              </span>
            </div>
            <Separator />
            <div
              className={cn(
                "flex items-center justify-between",
                isRTL && "flex-row-reverse",
              )}
            >
              <span className="text-sm text-muted-foreground">
                {t("verification.entryType")}
              </span>
              <span className="font-medium">
                {t(`entryTypes.${entry.entry_type}`)}
              </span>
            </div>
          </div>

          {/* Warning Message */}
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30 p-4",
              isRTL && "flex-row-reverse",
            )}
          >
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div className={cn("space-y-1", isRTL && "text-right")}>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                {t("verification.warning")}
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {t("verification.warningMessage")}
              </p>
            </div>
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <Label htmlFor="rejection_reason" className={textAlign}>
                {t("verification.rejectionReason")}
              </Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t("verification.rejectionReasonPlaceholder")}
                className={textAlign}
                rows={3}
              />
              {!rejectionReason.trim() && (
                <p className="text-sm text-destructive">
                  {t("verification.rejectionReasonRequired")}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className={cn("gap-2", isRTL && "flex-row-reverse")}>
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t("verification.cancel")}
          </Button>

          {!showRejectForm ? (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
                className={cn("gap-2", isRTL && "flex-row-reverse")}
              >
                <XCircle className="h-4 w-4" />
                {t("verification.reject")}
              </Button>
              <Button
                type="button"
                onClick={handleVerify}
                className={cn("gap-2", isRTL && "flex-row-reverse")}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("verification.verify")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason("");
                }}
              >
                {t("verification.back")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className={cn("gap-2", isRTL && "flex-row-reverse")}
              >
                <XCircle className="h-4 w-4" />
                {t("verification.confirmReject")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
