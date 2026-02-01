import { motion } from "motion/react";
import { CheckCircle2, type LucideIcon } from "lucide-react";

interface Step {
  id: number;
  icon: LucideIcon;
}

interface ProgressBarProps {
  steps: Step[];
  currentStep: number;
  direction: "ltr" | "rtl";
}

export function ProgressBar({
  steps,
  currentStep,
  direction,
}: ProgressBarProps) {
  return (
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
  );
}
