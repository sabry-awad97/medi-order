import { motion } from "motion/react";
import { User, Lock } from "lucide-react";
import { useTranslation } from "@meditrack/i18n";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

interface AccountSetupStepProps {
  direction: "ltr" | "rtl";
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export function AccountSetupStep({
  direction,
  register,
  errors,
}: AccountSetupStepProps) {
  const { t } = useTranslation("onboarding");

  return (
    <motion.div
      key="account"
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
          <Lock className="h-8 w-8 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold">{t("account.title")}</h2>
        <p className="text-muted-foreground">{t("account.subtitle")}</p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="username">
            {t("account.username")} <span className="text-destructive">*</span>
          </FieldLabel>
          <div className="relative">
            <User
              className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === `rtl` ? `right-3` : `left-3`}`}
            />
            <Input
              id="username"
              {...register("username")}
              placeholder="admin"
              autoComplete="username"
              className={direction === "rtl" ? "pr-10" : "pl-10"}
              autoFocus
            />
          </div>
          <FieldError>{errors.username?.message as string}</FieldError>
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">
            {t("account.password")} <span className="text-destructive">*</span>
          </FieldLabel>
          <div className="relative">
            <Lock
              className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === `rtl` ? `right-3` : `left-3`}`}
            />
            <Input
              id="password"
              {...register("password")}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className={direction === "rtl" ? "pr-10" : "pl-10"}
            />
          </div>
          <FieldError>{errors.password?.message as string}</FieldError>
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">
            {t("account.confirmPassword")}{" "}
            <span className="text-destructive">*</span>
          </FieldLabel>
          <div className="relative">
            <Lock
              className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === `rtl` ? `right-3` : `left-3`}`}
            />
            <Input
              id="confirmPassword"
              {...register("confirmPassword")}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className={direction === "rtl" ? "pr-10" : "pl-10"}
            />
          </div>
          <FieldError>{errors.confirmPassword?.message as string}</FieldError>
        </Field>

        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <p className="font-medium mb-2 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {t("account.security.title")}
          </p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• {t("account.security.minLength")}</li>
            <li>• {t("account.security.strong")}</li>
            <li>• {t("account.security.admin")}</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
