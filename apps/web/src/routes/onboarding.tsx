import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Mail,
  Lock,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Languages,
  Check,
} from "lucide-react";
import {
  useTranslation,
  useLocale,
  useDirection,
  LOCALES,
} from "@meditrack/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useCompleteFirstRunSetup } from "@/hooks/use-onboarding-db";
import { FirstRunSetupSchema, type FirstRunSetup } from "@/api/onboarding.api";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type OnboardingFormData = FirstRunSetup & {
  confirmPassword: string;
};

const onboardingFormSchema = FirstRunSetupSchema.extend({
  confirmPassword: FirstRunSetupSchema.shape.password,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const steps = [
  { id: 1, icon: Sparkles },
  { id: 2, icon: User },
  { id: 3, icon: Lock },
  { id: 4, icon: Building2 },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const completeSetup = useCompleteFirstRunSetup();
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useTranslation("onboarding");
  const { locale, setLocale } = useLocale();
  const { direction } = useDirection();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingFormSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: OnboardingFormData) => {
    const { confirmPassword, ...setupData } = data;

    completeSetup.mutate(setupData, {
      onSuccess: async (response) => {
        if (response.token) {
          await login({
            username: data.username,
            password: data.password,
          });
          navigate({ to: "/" });
        }
      },
    });
  };

  const handleNext = async () => {
    let isValid = true;

    if (currentStep === 1) {
      isValid = await trigger(["first_name", "last_name", "email"]);
    } else if (currentStep === 2) {
      isValid = await trigger(["username", "password", "confirmPassword"]);
    }

    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background"
      dir={direction}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.1),transparent_50%)]" />
      </div>

      {/* Language Switcher */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 right-6 z-10"
      >
        <Popover>
          <PopoverTrigger
            render={(props) => (
              <button
                {...props}
                className="h-9 w-9 rounded-full hover:bg-primary/10 transition-colors flex items-center justify-center"
              >
                <span className="text-xl">{LOCALES[locale].flag}</span>
              </button>
            )}
          />
          <PopoverContent className="w-40 p-1" align="end">
            <div className="space-y-0.5">
              {Object.entries(LOCALES).map(([code, config]) => (
                <button
                  key={code}
                  onClick={() => setLocale(code as "en" | "ar")}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                    locale === code
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  <span className="text-lg">{config.flag}</span>
                  <span className="flex-1 text-left text-sm">
                    {config.nativeName}
                  </span>
                  {locale === code && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </motion.div>

      <div className="w-full max-w-4xl px-4">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <motion.div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    index <= currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                  animate={{
                    scale: index === currentStep ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </motion.div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-border relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-primary"
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: index < currentStep ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      style={{
                        transformOrigin: direction === "rtl" ? "right" : "left",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border bg-card shadow-2xl overflow-hidden"
        >
          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {/* Welcome Step */}
              {currentStep === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: direction === "rtl" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction === "rtl" ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.2,
                    }}
                    className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
                  >
                    <Sparkles className="h-12 w-12 text-primary" />
                  </motion.div>

                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">
                      {t("welcome.title")}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                      {t("welcome.subtitle")}
                    </p>
                  </div>

                  <div className="grid gap-4 text-left max-w-md mx-auto pt-4">
                    {[
                      t("welcome.features.orders"),
                      t("welcome.features.inventory"),
                      t("welcome.features.reports"),
                      t("welcome.features.security"),
                    ].map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{
                          opacity: 0,
                          x: direction === "rtl" ? 20 : -20,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <Button
                    size="lg"
                    onClick={handleNext}
                    className="mt-8 h-12 px-8 text-base font-semibold"
                  >
                    {t("welcome.getStarted")}
                    {direction === "rtl" ? (
                      <ArrowLeft className="ml-2 h-5 w-5" />
                    ) : (
                      <ArrowRight className="ml-2 h-5 w-5" />
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Personal Information Step */}
              {currentStep === 1 && (
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
                    <h2 className="text-3xl font-bold">
                      {t("personal.title")}
                    </h2>
                    <p className="text-muted-foreground">
                      {t("personal.subtitle")}
                    </p>
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
                        {t("personal.email")}{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <div className="relative">
                        <Mail
                          className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === "rtl" ? "right-3" : "left-3"}`}
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
              )}

              {/* Account Setup Step */}
              {currentStep === 2 && (
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
                    <p className="text-muted-foreground">
                      {t("account.subtitle")}
                    </p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    <Field data-invalid={!!errors.username}>
                      <FieldLabel htmlFor="username">
                        {t("account.username")}{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <div className="relative">
                        <User
                          className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === "rtl" ? "right-3" : "left-3"}`}
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
                      <FieldError>{errors.username?.message}</FieldError>
                    </Field>

                    <Field data-invalid={!!errors.password}>
                      <FieldLabel htmlFor="password">
                        {t("account.password")}{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <div className="relative">
                        <Lock
                          className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === "rtl" ? "right-3" : "left-3"}`}
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
                      <FieldError>{errors.password?.message}</FieldError>
                    </Field>

                    <Field data-invalid={!!errors.confirmPassword}>
                      <FieldLabel htmlFor="confirmPassword">
                        {t("account.confirmPassword")}{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <div className="relative">
                        <Lock
                          className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === "rtl" ? "right-3" : "left-3"}`}
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
                      <FieldError>{errors.confirmPassword?.message}</FieldError>
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
              )}

              {/* Organization Step */}
              {currentStep === 3 && (
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
                    <h2 className="text-3xl font-bold">
                      {t("organization.title")}
                    </h2>
                    <p className="text-muted-foreground">
                      {t("organization.subtitle")}
                    </p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    <Field data-invalid={!!errors.organization_name}>
                      <FieldLabel htmlFor="organization_name">
                        {t("organization.name")}
                      </FieldLabel>
                      <div className="relative">
                        <Building2
                          className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === "rtl" ? "right-3" : "left-3"}`}
                        />
                        <Input
                          id="organization_name"
                          {...register("organization_name")}
                          placeholder="My Pharmacy"
                          className={direction === "rtl" ? "pr-10" : "pl-10"}
                          autoFocus
                        />
                      </div>
                      <FieldError>
                        {errors.organization_name?.message}
                      </FieldError>
                    </Field>

                    <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                      <p>{t("organization.skipNote")}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            {currentStep > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between mt-8 pt-6 border-t"
              >
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={completeSetup.isPending}
                  className="gap-2"
                >
                  {direction === "rtl" ? (
                    <ArrowRight className="h-4 w-4" />
                  ) : (
                    <ArrowLeft className="h-4 w-4" />
                  )}
                  {t("actions.back")}
                </Button>

                <div className="flex gap-2">
                  {currentStep === 3 && (
                    <Button
                      variant="outline"
                      onClick={handleSubmit(onSubmit)}
                      disabled={completeSetup.isPending}
                    >
                      {t("actions.skip")}
                    </Button>
                  )}
                  {currentStep < 3 ? (
                    <Button onClick={handleNext} className="gap-2">
                      {t("actions.continue")}
                      {direction === "rtl" ? (
                        <ArrowLeft className="h-4 w-4" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit(onSubmit)}
                      disabled={completeSetup.isPending}
                      className="gap-2"
                    >
                      {completeSetup.isPending ? (
                        <>
                          <Spinner className="h-4 w-4" />
                          {t("actions.creating")}
                        </>
                      ) : (
                        <>
                          {t("actions.complete")}
                          <CheckCircle2 className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          {t("footer")}
        </motion.p>
      </div>
    </div>
  );
}
