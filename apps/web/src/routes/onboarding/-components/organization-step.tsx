import { motion } from "motion/react";
import { Building2 } from "lucide-react";
import { useTranslation } from "@meditrack/i18n";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

interface OrganizationStepProps {
  direction: "ltr" | "rtl";
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export function OrganizationStep({
  direction,
  register,
  errors,
}: OrganizationStepProps) {
  const { t } = useTranslation("onboarding");

  return (
    <motion.div
      key="organization"
      initial={{ opacity: 0, x: direction === "rtl" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction === "rtl" ? 20 : -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2 mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4"
        >
          <Building2 className="h-8 w-8 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold">{t("organization.title")}</h2>
        <p className="text-muted-foreground">{t("organization.subtitle")}</p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <Field data-invalid={!!errors.organization_name}>
          <FieldLabel htmlFor="organization_name">
            {t("organization.name")}
          </FieldLabel>
          <div className="relative">
            <Building2
              className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === `rtl` ? `right-3` : `left-3`}`}
            />
            <Input
              id="organization_name"
              {...register("organization_name")}
              placeholder="My Pharmacy"
              className={direction === "rtl" ? "pr-10" : "pl-10"}
              autoFocus
            />
          </div>
          <FieldError>{errors.organization_name?.message}</FieldError>
        </Field>

        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          <p>{t("organization.skipNote")}</p>
        </div>
      </div>
    </motion.div>
  );
}
