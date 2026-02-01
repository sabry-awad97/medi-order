import { motion } from "motion/react";
import {
  Package,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation, useDirection } from "@meditrack/i18n";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OpeningBalanceResponse } from "@/api/opening-balance.api";

interface OpeningBalanceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: OpeningBalanceResponse | null;
}

export function OpeningBalanceDetailsDialog({
  open,
  onOpenChange,
  entry,
}: OpeningBalanceDetailsDialogProps) {
  const { t } = useTranslation("opening-balances");
  const { isRTL } = useDirection();

  if (!entry) return null;

  const unitPrice =
    typeof entry.unit_price === "string"
      ? parseFloat(entry.unit_price)
      : entry.unit_price;
  const totalValue = entry.quantity * unitPrice;

  const getVerificationStatusBadge = () => {
    if (entry.is_verified) {
      return (
        <Badge
          variant="default"
          className={cn("gap-1", isRTL && "flex-row-reverse")}
        >
          <CheckCircle2 className="h-3 w-3" />
          {t("status.verified")}
        </Badge>
      );
    }
    if (!entry.is_active) {
      return (
        <Badge
          variant="destructive"
          className={cn("gap-1", isRTL && "flex-row-reverse")}
        >
          <XCircle className="h-3 w-3" />
          {t("status.rejected")}
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className={cn("gap-1", isRTL && "flex-row-reverse")}
      >
        <Clock className="h-3 w-3" />
        {t("status.pending")}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div
          className={cn(
            "px-6 py-4 border-b shrink-0 bg-muted/30",
            isRTL ? "pl-14" : "pr-14",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-4",
              isRTL ? "flex-row-reverse" : "justify-between",
            )}
          >
            {getVerificationStatusBadge()}
            <div className={cn("flex-1", isRTL && "text-right")}>
              <DialogTitle className="text-2xl font-bold">
                {entry.inventory_item_name}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {t("details.entryId")}: {entry.id.slice(0, 8)}
              </DialogDescription>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="p-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Stock & Pricing */}
              <div className="space-y-6">
                {/* Stock Overview Card */}
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className={cn(isRTL && "text-right")}>
                      <CardTitle
                        className={cn(
                          "flex items-center gap-2 text-lg",
                          isRTL && "flex-row-reverse justify-end",
                        )}
                      >
                        <Package className="h-5 w-5 text-primary" />
                        {t("details.stockInfo")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className={cn("space-y-4", isRTL && "text-right")}
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("details.quantity")}
                          </p>
                          <p className="text-3xl font-bold">{entry.quantity}</p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("details.totalValue")}
                          </p>
                          <p className="text-3xl font-bold text-primary">
                            ${totalValue.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <DetailField
                        icon={<DollarSign className="h-4 w-4" />}
                        label={t("details.unitPrice")}
                        value={`$${unitPrice.toFixed(2)}`}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Entry Information Card */}
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className={cn(isRTL && "text-right")}>
                      <CardTitle
                        className={cn(
                          "flex items-center gap-2 text-lg",
                          isRTL && "flex-row-reverse justify-end",
                        )}
                      >
                        <FileText className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                        {t("details.entryInfo")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className={cn("space-y-3", isRTL && "text-right")}
                    >
                      <DetailField
                        icon={<FileText className="h-4 w-4" />}
                        label={t("details.entryType")}
                        value={t(`entryTypes.${entry.entry_type}`)}
                      />
                      <Separator />
                      <DetailField
                        icon={<Calendar className="h-4 w-4" />}
                        label={t("details.entryDate")}
                        value={format(new Date(entry.entry_date), "PPP")}
                      />
                      {entry.expiry_date && (
                        <>
                          <Separator />
                          <DetailField
                            icon={<AlertTriangle className="h-4 w-4" />}
                            label={t("details.expiryDate")}
                            value={format(new Date(entry.expiry_date), "PPP")}
                          />
                        </>
                      )}
                      {entry.import_batch_id && (
                        <>
                          <Separator />
                          <DetailField
                            icon={<Package className="h-4 w-4" />}
                            label={t("details.importBatch")}
                            value={entry.import_batch_id.slice(0, 8)}
                          />
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Reason & Notes Card */}
                {(entry.reason || entry.notes) && (
                  <motion.div
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardHeader className={cn(isRTL && "text-right")}>
                        <CardTitle
                          className={cn(
                            "flex items-center gap-2 text-lg",
                            isRTL && "flex-row-reverse justify-end",
                          )}
                        >
                          <FileText className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                          {t("details.additionalInfo")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent
                        className={cn("space-y-4", isRTL && "text-right")}
                      >
                        {entry.reason && (
                          <div className="space-y-2">
                            <h4
                              className={cn(
                                "font-medium text-sm flex items-center gap-2",
                                isRTL && "flex-row-reverse justify-end",
                              )}
                            >
                              <FileText className="h-4 w-4" />
                              {t("details.reason")}
                            </h4>
                            <p
                              className={cn(
                                "text-sm text-muted-foreground leading-relaxed",
                                isRTL && "text-right",
                              )}
                            >
                              {entry.reason}
                            </p>
                          </div>
                        )}
                        {entry.reason && entry.notes && <Separator />}
                        {entry.notes && (
                          <div className="space-y-2">
                            <h4
                              className={cn(
                                "font-medium text-sm flex items-center gap-2",
                                isRTL && "flex-row-reverse justify-end",
                              )}
                            >
                              <FileText className="h-4 w-4" />
                              {t("details.notes")}
                            </h4>
                            <p
                              className={cn(
                                "text-sm text-muted-foreground leading-relaxed",
                                isRTL && "text-right",
                              )}
                            >
                              {entry.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Right Column - Verification & Audit */}
              <div className="space-y-6">
                {/* Verification Status Card */}
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className={cn(isRTL && "text-right")}>
                      <CardTitle
                        className={cn(
                          "flex items-center gap-2 text-lg",
                          isRTL && "flex-row-reverse justify-end",
                        )}
                      >
                        {entry.is_verified ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                        ) : !entry.is_active ? (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                        )}
                        {t("details.verificationStatus")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className={cn("space-y-3", isRTL && "text-right")}
                    >
                      {entry.is_verified && entry.verified_at && (
                        <>
                          <DetailField
                            icon={<Calendar className="h-4 w-4" />}
                            label={t("details.verifiedAt")}
                            value={format(new Date(entry.verified_at), "PPP")}
                          />
                          {entry.verified_by_name && (
                            <>
                              <Separator />
                              <DetailField
                                icon={<User className="h-4 w-4" />}
                                label={t("details.verifiedBy")}
                                value={entry.verified_by_name}
                              />
                            </>
                          )}
                        </>
                      )}
                      {!entry.is_verified && entry.is_active && (
                        <p className="text-sm text-muted-foreground">
                          {t("details.pendingVerification")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Audit Trail Card */}
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className={cn(isRTL && "text-right")}>
                      <CardTitle
                        className={cn(
                          "flex items-center gap-2 text-lg",
                          isRTL && "flex-row-reverse justify-end",
                        )}
                      >
                        <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        {t("details.auditTrail")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className={cn("space-y-3", isRTL && "text-right")}
                    >
                      <TimelineItem
                        icon={<Calendar className="h-4 w-4 text-primary" />}
                        label={t("details.created")}
                        value={format(new Date(entry.created_at), "PPp")}
                        isRTL={isRTL}
                      />
                      {entry.entered_by_name && (
                        <>
                          <Separator />
                          <TimelineItem
                            icon={
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                            }
                            label={t("details.createdBy")}
                            value={entry.entered_by_name}
                            isRTL={isRTL}
                          />
                        </>
                      )}
                      {entry.updated_at && (
                        <>
                          <Separator />
                          <TimelineItem
                            icon={
                              <Calendar className="h-4 w-4 text-green-600 dark:text-green-500" />
                            }
                            label={t("details.lastUpdated")}
                            value={format(new Date(entry.updated_at), "PPp")}
                            isRTL={isRTL}
                          />
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
interface DetailFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function DetailField({ label, value, icon }: DetailFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground flex items-center gap-2 shrink-0">
        {icon}
        {label}
      </p>
      <p className="font-medium text-sm text-right">{value}</p>
    </div>
  );
}

interface TimelineItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isRTL?: boolean;
}

function TimelineItem({ icon, label, value, isRTL }: TimelineItemProps) {
  if (isRTL) {
    return (
      <div
        className="flex items-start gap-3"
        style={{ flexDirection: "row-reverse" }}
      >
        <div className="p-2 rounded-lg bg-muted">{icon}</div>
        <div className="flex-1 space-y-1 text-right">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-muted">{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
