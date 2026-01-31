import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  FileText,
  DollarSign,
  Shield,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useDirection } from "@meditrack/i18n";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MEDICINE_FORMS } from "@/lib/constants";
import type { CreateInventoryItemWithStock } from "@/api/inventory.api";

interface InventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateInventoryItemWithStock) => void;
  mode?: "create" | "edit";
}

interface FormData {
  // Step 1: Basic Info
  name: string;
  generic_name: string;
  concentration: string;
  form: string;
  manufacturer: string;
  barcode: string;
  // Step 2: Stock & Pricing
  stock_quantity: string;
  min_stock_level: string;
  unit_price: string;
  // Step 3: Classification & Details
  requires_prescription: boolean;
  is_controlled: boolean;
  storage_instructions: string;
  notes: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const STEPS = [
  {
    id: 1,
    title: "Basic Information",
    description: "Medicine details and identification",
    icon: Package,
  },
  {
    id: 2,
    title: "Stock & Pricing",
    description: "Inventory levels and cost",
    icon: DollarSign,
  },
  {
    id: 3,
    title: "Classification",
    description: "Regulatory and storage details",
    icon: Shield,
  },
  {
    id: 4,
    title: "Review",
    description: "Confirm all details",
    icon: Check,
  },
];

export function InventoryForm({
  open,
  onOpenChange,
  onSubmit,
  mode = "create",
}: InventoryFormProps) {
  const { isRTL } = useDirection();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState<FormData>({
    name: "",
    generic_name: "",
    concentration: "",
    form: "",
    manufacturer: "",
    barcode: "",
    stock_quantity: "0",
    min_stock_level: "10",
    unit_price: "0",
    requires_prescription: false,
    is_controlled: false,
    storage_instructions: "",
    notes: "",
  });

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Medicine name is required";
      }
      if (!formData.concentration.trim()) {
        newErrors.concentration = "Concentration is required";
      }
      if (!formData.form) {
        newErrors.form = "Medicine form is required";
      }
    }

    if (step === 2) {
      const stockQty = parseFloat(formData.stock_quantity);
      const minStock = parseFloat(formData.min_stock_level);
      const price = parseFloat(formData.unit_price);

      if (isNaN(stockQty) || stockQty < 0) {
        newErrors.stock_quantity = "Valid stock quantity is required";
      }
      if (isNaN(minStock) || minStock < 0) {
        newErrors.min_stock_level = "Valid minimum stock level is required";
      }
      if (isNaN(price) || price <= 0) {
        newErrors.unit_price = "Valid unit price is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1);
      return;
    }

    const submitData: CreateInventoryItemWithStock = {
      name: formData.name.trim(),
      generic_name: formData.generic_name.trim() || undefined,
      concentration: formData.concentration.trim(),
      form: formData.form,
      manufacturer: formData.manufacturer.trim() || undefined,
      barcode: formData.barcode.trim() || undefined,
      stock_quantity: parseInt(formData.stock_quantity),
      min_stock_level: parseInt(formData.min_stock_level),
      unit_price: parseFloat(formData.unit_price),
      requires_prescription: formData.requires_prescription,
      is_controlled: formData.is_controlled,
      storage_instructions: formData.storage_instructions.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    onSubmit(submitData);
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(1);
    setErrors({});
    setFormData({
      name: "",
      generic_name: "",
      concentration: "",
      form: "",
      manufacturer: "",
      barcode: "",
      stock_quantity: "0",
      min_stock_level: "10",
      unit_price: "0",
      requires_prescription: false,
      is_controlled: false,
      storage_instructions: "",
      notes: "",
    });
    onOpenChange(false);
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="relative p-6 border-b bg-linear-to-r from-primary/5 via-primary/10 to-primary/5">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">
                  {mode === "create" ? "Add New Medicine" : "Edit Medicine"}
                </DialogTitle>
                <DialogDescription>
                  {STEPS[currentStep - 1].description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors",
                    currentStep >= step.id
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                      currentStep > step.id
                        ? "bg-primary border-primary text-primary-foreground"
                        : currentStep === step.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted-foreground/30 bg-background",
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              ))}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-linear-to-r from-primary to-primary/80"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Medicine Name */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        Medicine Name
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="e.g., Paracetamol"
                        className={cn(errors.name && "border-destructive")}
                      />
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.name}
                        </motion.p>
                      )}
                    </div>

                    {/* Generic Name */}
                    <div className="space-y-2">
                      <Label htmlFor="generic_name">Generic Name</Label>
                      <Input
                        id="generic_name"
                        value={formData.generic_name}
                        onChange={(e) =>
                          updateField("generic_name", e.target.value)
                        }
                        placeholder="e.g., Acetaminophen"
                      />
                    </div>

                    {/* Concentration */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="concentration"
                        className="flex items-center gap-2"
                      >
                        Concentration
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="concentration"
                        value={formData.concentration}
                        onChange={(e) =>
                          updateField("concentration", e.target.value)
                        }
                        placeholder="e.g., 500mg"
                        className={cn(
                          errors.concentration && "border-destructive",
                        )}
                      />
                      {errors.concentration && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.concentration}
                        </motion.p>
                      )}
                    </div>

                    {/* Form */}
                    <div className="space-y-2">
                      <Label htmlFor="form" className="flex items-center gap-2">
                        Medicine Form
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.form || ""}
                        onValueChange={(value) =>
                          updateField("form", value || "")
                        }
                      >
                        <SelectTrigger
                          className={cn(errors.form && "border-destructive")}
                        >
                          <SelectValue placeholder="Select form" />
                        </SelectTrigger>
                        <SelectContent>
                          {MEDICINE_FORMS.map((form) => (
                            <SelectItem key={form} value={form}>
                              {form}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.form && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.form}
                        </motion.p>
                      )}
                    </div>

                    {/* Manufacturer */}
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        value={formData.manufacturer}
                        onChange={(e) =>
                          updateField("manufacturer", e.target.value)
                        }
                        placeholder="e.g., Pfizer"
                      />
                    </div>

                    {/* Barcode */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => updateField("barcode", e.target.value)}
                        placeholder="e.g., 1234567890123"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Stock & Pricing */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-3">
                    {/* Stock Quantity */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="stock_quantity"
                        className="flex items-center gap-2"
                      >
                        Current Stock
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        min="0"
                        value={formData.stock_quantity}
                        onChange={(e) =>
                          updateField("stock_quantity", e.target.value)
                        }
                        placeholder="0"
                        className={cn(
                          errors.stock_quantity && "border-destructive",
                        )}
                      />
                      {errors.stock_quantity && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.stock_quantity}
                        </motion.p>
                      )}
                    </div>

                    {/* Minimum Stock Level */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="min_stock_level"
                        className="flex items-center gap-2"
                      >
                        Min Stock Level
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="min_stock_level"
                        type="number"
                        min="0"
                        value={formData.min_stock_level}
                        onChange={(e) =>
                          updateField("min_stock_level", e.target.value)
                        }
                        placeholder="10"
                        className={cn(
                          errors.min_stock_level && "border-destructive",
                        )}
                      />
                      {errors.min_stock_level && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.min_stock_level}
                        </motion.p>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="unit_price"
                        className="flex items-center gap-2"
                      >
                        Unit Price ($)
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="unit_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) =>
                          updateField("unit_price", e.target.value)
                        }
                        placeholder="0.00"
                        className={cn(
                          errors.unit_price && "border-destructive",
                        )}
                      />
                      {errors.unit_price && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.unit_price}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  {/* Stock Status Preview */}
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <h4 className="font-medium mb-3">Stock Status Preview</h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Current Stock
                        </p>
                        <p className="text-2xl font-bold">
                          {formData.stock_quantity || 0}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Min Level
                        </p>
                        <p className="text-2xl font-bold">
                          {formData.min_stock_level || 0}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Value
                        </p>
                        <p className="text-2xl font-bold">
                          $
                          {(
                            parseFloat(formData.stock_quantity || "0") *
                            parseFloat(formData.unit_price || "0")
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Classification & Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Regulatory Switches */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                    <h4 className="font-medium">Regulatory Classification</h4>

                    <div className="flex items-center justify-between p-3 rounded-md bg-background">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="requires_prescription"
                          className="text-base"
                        >
                          Requires Prescription
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          This medicine requires a doctor's prescription
                        </p>
                      </div>
                      <Switch
                        id="requires_prescription"
                        checked={formData.requires_prescription}
                        onCheckedChange={(checked) =>
                          updateField("requires_prescription", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-md bg-background">
                      <div className="space-y-0.5">
                        <Label htmlFor="is_controlled" className="text-base">
                          Controlled Substance
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Subject to special regulations and tracking
                        </p>
                      </div>
                      <Switch
                        id="is_controlled"
                        checked={formData.is_controlled}
                        onCheckedChange={(checked) =>
                          updateField("is_controlled", checked)
                        }
                      />
                    </div>
                  </div>

                  {/* Storage Instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="storage_instructions">
                      Storage Instructions
                    </Label>
                    <Textarea
                      id="storage_instructions"
                      value={formData.storage_instructions}
                      onChange={(e) =>
                        updateField("storage_instructions", e.target.value)
                      }
                      placeholder="e.g., Store in a cool, dry place away from direct sunlight"
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      placeholder="Any additional information about this medicine"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-linear-to-br from-primary/5 to-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Check className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-lg">
                        Review Your Information
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Please review all details before submitting
                    </p>
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-3">
                    <h5 className="font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Basic Information
                    </h5>
                    <div className="grid gap-3 sm:grid-cols-2 p-4 rounded-lg bg-muted/50">
                      <ReviewField
                        label="Medicine Name"
                        value={formData.name}
                      />
                      <ReviewField
                        label="Generic Name"
                        value={formData.generic_name || "—"}
                      />
                      <ReviewField
                        label="Concentration"
                        value={formData.concentration}
                      />
                      <ReviewField label="Form" value={formData.form} />
                      <ReviewField
                        label="Manufacturer"
                        value={formData.manufacturer || "—"}
                      />
                      <ReviewField
                        label="Barcode"
                        value={formData.barcode || "—"}
                      />
                    </div>
                  </div>

                  {/* Stock & Pricing */}
                  <div className="space-y-3">
                    <h5 className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Stock & Pricing
                    </h5>
                    <div className="grid gap-3 sm:grid-cols-3 p-4 rounded-lg bg-muted/50">
                      <ReviewField
                        label="Current Stock"
                        value={`${formData.stock_quantity} units`}
                      />
                      <ReviewField
                        label="Min Stock Level"
                        value={`${formData.min_stock_level} units`}
                      />
                      <ReviewField
                        label="Unit Price"
                        value={`$${parseFloat(formData.unit_price).toFixed(2)}`}
                      />
                    </div>
                  </div>

                  {/* Classification */}
                  <div className="space-y-3">
                    <h5 className="font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Classification
                    </h5>
                    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                      <div className="flex items-center gap-2">
                        {formData.requires_prescription ? (
                          <Badge variant="secondary">
                            Prescription Required
                          </Badge>
                        ) : (
                          <Badge variant="outline">Over-the-Counter</Badge>
                        )}
                        {formData.is_controlled && (
                          <Badge variant="destructive" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Controlled Substance
                          </Badge>
                        )}
                      </div>
                      {formData.storage_instructions && (
                        <ReviewField
                          label="Storage Instructions"
                          value={formData.storage_instructions}
                        />
                      )}
                      {formData.notes && (
                        <ReviewField label="Notes" value={formData.notes} />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/30">
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? handleClose : handlePrevious}
              className="gap-2"
            >
              {isRTL ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              {currentStep === 1 ? "Cancel" : "Previous"}
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </span>
            </div>

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                {isRTL ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="gap-2">
                <Check className="h-4 w-4" />
                Submit
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Review Field Component
function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
