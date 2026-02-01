import { useState, useEffect } from "react";
import { Building2, Globe, Mail, Phone, MapPin, FileText } from "lucide-react";
import { useTranslation, useDirection } from "@meditrack/i18n";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  ManufacturerResponse,
  CreateManufacturer,
  UpdateManufacturer,
} from "@/api/manufacturer.api";

interface ManufacturerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manufacturer: ManufacturerResponse | null;
  mode: "create" | "edit";
  onSubmit: (data: CreateManufacturer | UpdateManufacturer) => void;
}

interface FormData {
  name: string;
  short_name: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  notes: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  website?: string;
}

export function ManufacturerFormDialog({
  open,
  onOpenChange,
  manufacturer,
  mode,
  onSubmit,
}: ManufacturerFormDialogProps) {
  const { t } = useTranslation("manufacturer");
  const { isRTL } = useDirection();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    short_name: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    notes: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Reset form when dialog opens/closes or manufacturer changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && manufacturer) {
        setFormData({
          name: manufacturer.name,
          short_name: manufacturer.short_name || "",
          country: manufacturer.country || "",
          phone: manufacturer.phone || "",
          email: manufacturer.email || "",
          website: manufacturer.website || "",
          notes: manufacturer.notes || "",
        });
      } else {
        setFormData({
          name: "",
          short_name: "",
          country: "",
          phone: "",
          email: "",
          website: "",
          notes: "",
        });
      }
      setErrors({});
    }
  }, [open, mode, manufacturer]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ValidationErrors];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Name is required
    if (!formData.name.trim()) {
      newErrors.name = t("form.validation.nameRequired");
    }

    // Email validation (if provided)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t("form.validation.emailInvalid");
      }
    }

    // Website validation (if provided)
    if (formData.website.trim()) {
      try {
        new URL(formData.website);
      } catch {
        newErrors.website = t("form.validation.websiteInvalid");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: CreateManufacturer | UpdateManufacturer = {
      name: formData.name.trim(),
      short_name: formData.short_name.trim() || undefined,
      country: formData.country.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      website: formData.website.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    onSubmit(submitData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl h-[85vh] flex flex-col p-0 gap-0"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader
          className={cn(
            "px-6 py-4 border-b shrink-0",
            isRTL ? "pl-14" : "pr-14",
          )}
        >
          <DialogTitle className="text-xl">
            {mode === "create" ? t("form.addTitle") : t("form.editTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("description")
              : `${t("editManufacturer")}: ${manufacturer?.name}`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 h-0">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3
                  className={cn(
                    "font-semibold text-base flex items-center gap-2",
                    isRTL && "flex-row-reverse justify-end",
                  )}
                >
                  <Building2 className="h-4 w-4 text-primary" />
                  {t("form.companyInfo")}
                </h3>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className={cn(isRTL && "text-right block")}
                    >
                      {t("form.fields.name")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder={t("form.fields.namePlaceholder")}
                      className={cn(errors.name && "border-destructive")}
                      dir={isRTL ? "rtl" : "ltr"}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  {/* Short Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="short_name"
                      className={cn(isRTL && "text-right block")}
                    >
                      {t("form.fields.shortName")}
                    </Label>
                    <Input
                      id="short_name"
                      value={formData.short_name}
                      onChange={(e) =>
                        updateField("short_name", e.target.value)
                      }
                      placeholder={t("form.fields.shortNamePlaceholder")}
                      dir={isRTL ? "rtl" : "ltr"}
                    />
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="country"
                      className={cn(isRTL && "text-right block")}
                    >
                      {t("form.fields.country")}
                    </Label>
                    <div className="relative">
                      <MapPin
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                          isRTL ? "right-3" : "left-3",
                        )}
                      />
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => updateField("country", e.target.value)}
                        placeholder={t("form.fields.countryPlaceholder")}
                        className={cn(isRTL ? "pr-10" : "pl-10")}
                        dir={isRTL ? "rtl" : "ltr"}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3
                  className={cn(
                    "font-semibold text-base flex items-center gap-2",
                    isRTL && "flex-row-reverse justify-end",
                  )}
                >
                  <Phone className="h-4 w-4 text-green-600" />
                  {t("form.contactInfo")}
                </h3>

                <div className="space-y-4">
                  {/* Phone */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className={cn(isRTL && "text-right block")}
                    >
                      {t("form.fields.phone")}
                    </Label>
                    <div className="relative">
                      <Phone
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                          isRTL ? "right-3" : "left-3",
                        )}
                      />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder={t("form.fields.phonePlaceholder")}
                        className={cn(isRTL ? "pr-10" : "pl-10")}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className={cn(isRTL && "text-right block")}
                    >
                      {t("form.fields.email")}
                    </Label>
                    <div className="relative">
                      <Mail
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                          isRTL ? "right-3" : "left-3",
                        )}
                      />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder={t("form.fields.emailPlaceholder")}
                        className={cn(
                          isRTL ? "pr-10" : "pl-10",
                          errors.email && "border-destructive",
                        )}
                        dir="ltr"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="website"
                      className={cn(isRTL && "text-right block")}
                    >
                      {t("form.fields.website")}
                    </Label>
                    <div className="relative">
                      <Globe
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                          isRTL ? "right-3" : "left-3",
                        )}
                      />
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateField("website", e.target.value)}
                        placeholder={t("form.fields.websitePlaceholder")}
                        className={cn(
                          isRTL ? "pr-10" : "pl-10",
                          errors.website && "border-destructive",
                        )}
                        dir="ltr"
                      />
                    </div>
                    {errors.website && (
                      <p className="text-sm text-destructive">
                        {errors.website}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Additional Information */}
              <div className="space-y-4">
                <h3
                  className={cn(
                    "font-semibold text-base flex items-center gap-2",
                    isRTL && "flex-row-reverse justify-end",
                  )}
                >
                  <FileText className="h-4 w-4 text-purple-600" />
                  {t("form.additionalInfo")}
                </h3>

                <div className="space-y-2">
                  <Label
                    htmlFor="notes"
                    className={cn(isRTL && "text-right block")}
                  >
                    {t("form.fields.notes")}
                  </Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder={t("form.fields.notesPlaceholder")}
                    rows={4}
                    className={cn(
                      "w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none",
                      isRTL && "text-right",
                    )}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter
          className={cn(
            "px-6 py-4 border-t shrink-0 gap-2",
            isRTL && "flex-row-reverse",
          )}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("form.buttons.cancel")}
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {mode === "create"
              ? t("form.buttons.submit")
              : t("form.buttons.update")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
