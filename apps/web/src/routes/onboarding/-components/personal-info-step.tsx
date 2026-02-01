import { motion } from "motion/react";
import { User, Mail } from "lucide-react";
import { useTranslation } from "@meditrack/i18n";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

interface PersonalInfoStepProps {
  direction: "ltr" | "rtl";
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export function PersonalInfoStep({
  direction,
  register,
  errors,
}: PersonalInfoStepProps) {
  const { t } = useTranslation("onboarding");

  return (
    <motion.div
      key="personal"
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
          <User className="h-8 w-8 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold">{t("personal.title")}</h2>
        <p className="text-muted-foreground">{t("personal.subtitle")}</p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.first_name}>
            <FieldLabel htmlFor="first_name">
              {t("personal.firstName")}{" "}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="first_name"
              {...register("first_name")}
              placeholder="John"
              autoFocus
            />
            <FieldError>{errors.first_name?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.last_name}>
            <FieldLabel htmlFor="last_name">
              {t("personal.lastName")}{" "}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="last_name"
              {...register("last_name")}
              placeholder="Doe"
            />
            <FieldError>{errors.last_name?.message}</FieldError>
          </Field>
        </div>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">
            {t("personal.email")} <span className="text-destructive">*</span>
          </FieldLabel>
          <div className="relative">
            <Mail
              className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === `rtl` ? `right-3` : `left-3`}`}
            />
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="admin@pharmacy.com"
              className={direction === "rtl" ? "pr-10" : "pl-10"}
            />
          </div>
          <FieldError>{errors.email?.message}</FieldError>
        </Field>
      </div>
    </motion.div>
  );
}
