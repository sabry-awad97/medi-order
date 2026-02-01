import { motion } from "motion/react";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@meditrack/i18n";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface NavigationButtonsProps {
  direction: "ltr" | "rtl";
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function NavigationButtons({
  direction,
  currentStep,
  totalSteps,
  isLoading,
  onBack,
  onNext,
  onSkip,
  onComplete,
}: NavigationButtonsProps) {
  const { t } = useTranslation("onboarding");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center justify-between mt-8 pt-6 border-t"
    >
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={isLoading}
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
        {currentStep === totalSteps - 1 && (
          <Button variant="outline" onClick={onSkip} disabled={isLoading}>
            {t("actions.skip")}
          </Button>
        )}
        {currentStep < totalSteps - 1 ? (
          <Button onClick={onNext} className="gap-2">
            {t("actions.continue")}
            {direction === "rtl" ? (
              <ArrowLeft className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button onClick={onComplete} disabled={isLoading} className="gap-2">
            {isLoading ? (
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
  );
}
