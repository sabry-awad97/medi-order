import { motion } from "motion/react";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ManufacturerResponse } from "@/api/manufacturer.api";

interface ManufacturerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manufacturer: ManufacturerResponse | null;
}

export function ManufacturerDetailsDialog({
  open,
  onOpenChange,
  manufacturer,
}: ManufacturerDetailsDialogProps) {
  const { t } = useTranslation("manufacturer");
  const { isRTL } = useDirection();

  if (!manufacturer) return null;

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
            <Badge
              variant={manufacturer.is_active ? "default" : "secondary"}
              className={cn(
                "text-sm px-4 py-1.5 font-medium",
                isRTL ? "order-first" : "order-last",
              )}
            >
              {manufacturer.is_active
                ? t("details.active")
                : t("details.inactive")}
            </Badge>
            <div className={cn("flex-1", isRTL && "text-right")}>
              <DialogTitle className="text-2xl font-bold">
                {manufacturer.name}
              </DialogTitle>
              {manufacturer.short_name && (
                <DialogDescription className="text-base mt-1">
                  {manufacturer.short_name}
                </DialogDescription>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="p-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Company Information */}
              <div className="space-y-6">
                {/* Company Info Card */}
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
                        <Building2 className="h-5 w-5 text-primary" />
                        {t("details.companyInfo")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className={cn("space-y-3", isRTL && "text-right")}
                    >
                      <DetailField
                        icon={<Building2 className="h-4 w-4" />}
                        label={t("details.name")}
                        value={manufacturer.name}
                        isRTL={isRTL}
                      />
                      {manufacturer.short_name && (
                        <>
                          <Separator />
                          <DetailField
                            icon={<FileText className="h-4 w-4" />}
                            label={t("details.shortName")}
                            value={manufacturer.short_name}
                            isRTL={isRTL}
                          />
                        </>
                      )}
                      {manufacturer.country && (
                        <>
                          <Separator />
                          <DetailField
                            icon={<MapPin className="h-4 w-4" />}
                            label={t("details.country")}
                            value={manufacturer.country}
                            isRTL={isRTL}
                          />
                        </>
                      )}
                      <Separator />
                      <DetailField
                        icon={
                          manufacturer.is_active ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-500" />
                          )
                        }
                        label={t("details.status")}
                        value={
                          manufacturer.is_active
                            ? t("details.active")
                            : t("details.inactive")
                        }
                        isRTL={isRTL}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Timeline Card */}
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
                        <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        {t("details.timeline")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className={cn("space-y-3", isRTL && "text-right")}
                    >
                      <TimelineItem
                        icon={<Calendar className="h-4 w-4 text-primary" />}
                        label={t("details.created")}
                        value={format(new Date(manufacturer.created_at), "PPp")}
                        isRTL={isRTL}
                      />
                      {manufacturer.updated_at && (
                        <>
                          <Separator />
                          <TimelineItem
                            icon={
                              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                            }
                            label={t("details.lastUpdated")}
                            value={format(
                              new Date(manufacturer.updated_at),
                              "PPp",
                            )}
                            isRTL={isRTL}
                          />
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Contact Information */}
              <div className="space-y-6">
                {/* Contact Info Card */}
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
                        <Phone className="h-5 w-5 text-green-600 dark:text-green-500" />
                        {t("details.contactInfo")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className={cn("space-y-4", isRTL && "text-right")}
                    >
                      {manufacturer.phone && (
                        <div className="space-y-2">
                          <DetailField
                            icon={<Phone className="h-4 w-4" />}
                            label={t("details.phone")}
                            value={manufacturer.phone}
                            isRTL={isRTL}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-full gap-2",
                              isRTL && "flex-row-reverse",
                            )}
                            onClick={() =>
                              window.open(`tel:${manufacturer.phone}`)
                            }
                          >
                            <Phone className="h-3 w-3" />
                            {t("details.callPhone")}
                          </Button>
                        </div>
                      )}

                      {manufacturer.phone && manufacturer.email && (
                        <Separator />
                      )}

                      {manufacturer.email && (
                        <div className="space-y-2">
                          <DetailField
                            icon={<Mail className="h-4 w-4" />}
                            label={t("details.email")}
                            value={manufacturer.email}
                            isRTL={isRTL}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-full gap-2",
                              isRTL && "flex-row-reverse",
                            )}
                            onClick={() =>
                              window.open(`mailto:${manufacturer.email}`)
                            }
                          >
                            <Mail className="h-3 w-3" />
                            {t("details.sendEmail")}
                          </Button>
                        </div>
                      )}

                      {manufacturer.email && manufacturer.website && (
                        <Separator />
                      )}

                      {manufacturer.website && (
                        <div className="space-y-2">
                          <DetailField
                            icon={<Globe className="h-4 w-4" />}
                            label={t("details.website")}
                            value={manufacturer.website}
                            isRTL={isRTL}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-full gap-2",
                              isRTL && "flex-row-reverse",
                            )}
                            onClick={() =>
                              window.open(manufacturer.website!, "_blank")
                            }
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t("details.visitWebsite")}
                          </Button>
                        </div>
                      )}

                      {!manufacturer.phone &&
                        !manufacturer.email &&
                        !manufacturer.website && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {t("table.na")}
                          </p>
                        )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Notes Card */}
                {manufacturer.notes && (
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
                          <FileText className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                          {t("details.notes")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className={cn(isRTL && "text-right")}>
                        <p
                          className={cn(
                            "text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap",
                            isRTL && "text-right",
                          )}
                        >
                          {manufacturer.notes}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
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
  isRTL?: boolean;
}

function DetailField({ label, value, icon, isRTL }: DetailFieldProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        isRTL && "flex-row-reverse",
      )}
    >
      <p
        className={cn(
          "text-sm text-muted-foreground flex items-center gap-2 shrink-0",
          isRTL && "flex-row-reverse",
        )}
      >
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "font-medium text-sm",
          isRTL ? "text-left" : "text-right",
        )}
      >
        {value}
      </p>
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
  return (
    <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
      <div className="p-2 rounded-lg bg-muted">{icon}</div>
      <div className={cn("flex-1 space-y-1", isRTL && "text-right")}>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
