import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, User, Lock, Building2 } from "lucide-react";
import { useTranslation, useDirection } from "@meditrack/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useCompleteFirstRunSetup } from "@/hooks/use-onboarding-db";
import { FirstRunSetupSchema, type FirstRunSetup } from "@/api/onboarding.api";
import { useUpsertSettingValue } from "@/hooks";
import { SETTING_PHARMACY_NAME } from "@/lib/constants";
import {
  LanguageSwitcher,
  ProgressBar,
  WelcomeStep,
  PersonalInfoStep,
  AccountSetupStep,
  OrganizationStep,
  NavigationButtons,
} from "./-components";

export const Route = createFileRoute("/onboarding/index/lazy/")({
  component: OnboardingPage,
});

type OnboardingFormData = FirstRunSetup & {
  confirmPassword: string;
  organization_name?: string;
};

const onboardingFormSchema = FirstRunSetupSchema.extend({
  confirmPassword: FirstRunSetupSchema.shape.password,
  organization_name: z.string().optional(),
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
  const upsertSetting = useUpsertSettingValue();
  const [currentStep, setCurrentStep] = useState(0);
  const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false);
  const { t } = useTranslation("onboarding");
  const { direction } = useDirection();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingFormSchema),
    mode: "onChange",
  });

  // Function to populate form with test data
  const fillTestData = () => {
    setValue("first_name", "Sabry");
    setValue("last_name", "Awad");
    setValue("email", "admin@pharmacy.test");
    setValue("username", "admin");
    setValue("password", "admin123");
    setValue("confirmPassword", "admin123");
    setValue("organization_name", "Well Pharmacy");
  };

  const onSubmit = async (data: OnboardingFormData) => {
    const { confirmPassword, organization_name, ...setupData } = data;

    completeSetup.mutate(setupData, {
      onSuccess: async (response) => {
        // Save organization name to settings if provided
        if (organization_name) {
          upsertSetting.mutate({
            key: SETTING_PHARMACY_NAME,
            value: organization_name,
            category: "general",
            description: {
              en: "The name of your pharmacy",
              ar: "اسم الصيدلية الخاصة بك",
            },
          });
        }

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
      <LanguageSwitcher
        open={languagePopoverOpen}
        onOpenChange={setLanguagePopoverOpen}
      />

      <div className="w-full max-w-4xl px-4">
        {/* Progress Bar */}
        <ProgressBar
          steps={steps}
          currentStep={currentStep}
          direction={direction}
        />

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border bg-card shadow-2xl overflow-hidden"
        >
          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <WelcomeStep
                  direction={direction}
                  onNext={handleNext}
                  onFillTestData={fillTestData}
                />
              )}

              {currentStep === 1 && (
                <PersonalInfoStep
                  direction={direction}
                  register={register}
                  errors={errors}
                />
              )}

              {currentStep === 2 && (
                <AccountSetupStep
                  direction={direction}
                  register={register}
                  errors={errors}
                />
              )}

              {currentStep === 3 && (
                <OrganizationStep
                  direction={direction}
                  register={register}
                  errors={errors}
                />
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            {currentStep > 0 && (
              <NavigationButtons
                direction={direction}
                currentStep={currentStep}
                totalSteps={steps.length}
                isLoading={completeSetup.isPending}
                onBack={handleBack}
                onNext={handleNext}
                onSkip={handleSubmit(onSubmit)}
                onComplete={handleSubmit(onSubmit)}
              />
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
