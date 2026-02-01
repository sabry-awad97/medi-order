import { motion } from "motion/react";
import { Sparkles, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useTranslation } from "@meditrack/i18n";
import { Button } from "@/components/ui/button";

interface WelcomeStepProps {
  direction: "ltr" | "rtl";
  onNext: () => void;
  onFillTestData?: () => void;
}

export function WelcomeStep({
  direction,
  onNext,
  onFillTestData,
}: WelcomeStepProps) {
  const { t } = useTranslation("onboarding");

  const features = [
    t("welcome.features.orders"),
    t("welcome.features.inventory"),
    t("welcome.features.reports"),
    t("welcome.features.security"),
  ];

  return (
    <motion.div
      key="welcome"
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
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold">{t("welcome.title")}</h2>
        <p className="text-muted-foreground">{t("welcome.subtitle")}</p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid gap-4 text-left">
          {features.map((feature, index) => (
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
              <span className="text-sm text-muted-foreground">{feature}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 pt-4">
          <Button
            size="lg"
            onClick={onNext}
            className="h-12 px-8 text-base font-semibold"
          >
            {t("welcome.getStarted")}
            {direction === "rtl" ? (
              <ArrowLeft className="ml-2 h-5 w-5" />
            ) : (
              <ArrowRight className="ml-2 h-5 w-5" />
            )}
          </Button>

          {/* Test Data Button - Only in development */}
          {import.meta.env.DEV && onFillTestData && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFillTestData}
              className="text-xs"
            >
              Use Test Data (Dev Only)
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
