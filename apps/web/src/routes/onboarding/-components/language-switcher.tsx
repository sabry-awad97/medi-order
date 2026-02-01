import { motion } from "motion/react";
import { Check } from "lucide-react";
import { useLocale, LOCALES } from "@meditrack/i18n";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LanguageSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LanguageSwitcher({
  open,
  onOpenChange,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-6 right-6 z-10"
    >
      <Popover open={open} onOpenChange={onOpenChange}>
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
                onClick={async () => {
                  await setLocale(code as "en" | "ar");
                  onOpenChange(false);
                }}
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
  );
}
