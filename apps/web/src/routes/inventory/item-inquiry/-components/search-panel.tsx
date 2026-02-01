import { useState, useEffect } from "react";
import {
  Search,
  Barcode,
  Pill,
  Package,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation, useDirection } from "@meditrack/i18n";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface SearchPanelProps {
  onSearch: (query: string, type: "name" | "barcode" | "generic") => void;
  searchQuery: string;
  searchType: "name" | "barcode" | "generic";
}

export function SearchPanel({
  onSearch,
  searchQuery,
  searchType,
}: SearchPanelProps) {
  const { t } = useTranslation("item-inquiry");
  const { isRTL } = useDirection();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [localType, setLocalType] = useState(searchType);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    setLocalQuery(searchQuery);
    setLocalType(searchType);
  }, [searchQuery, searchType]);

  const handleSearch = () => {
    onSearch(localQuery, localType);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleTypeChange = (type: string) => {
    const newType = type as "name" | "barcode" | "generic";
    setLocalType(newType);
  };

  const handleApplySettings = () => {
    if (localQuery.trim()) {
      onSearch(localQuery, localType);
    }
    setIsPopoverOpen(false);
  };

  const searchTypes = [
    {
      value: "name" as const,
      label: t("searchPanel.byName"),
      icon: Package,
      placeholder: t("searchPanel.namePlaceholder"),
      description: t("searchPanel.nameDescription"),
    },
    {
      value: "barcode" as const,
      label: t("searchPanel.byBarcode"),
      icon: Barcode,
      placeholder: t("searchPanel.barcodePlaceholder"),
      description: t("searchPanel.barcodeDescription"),
    },
    {
      value: "generic" as const,
      label: t("searchPanel.byGeneric"),
      icon: Pill,
      placeholder: t("searchPanel.genericPlaceholder"),
      description: t("searchPanel.genericDescription"),
    },
  ];

  const currentSearchType = searchTypes.find((st) => st.value === localType)!;
  const CurrentIcon = currentSearchType.icon;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search Input Group */}
          <div className="w-full md:w-[400px]">
            <ButtonGroup className="w-full">
              <InputGroup>
                <InputGroupInput
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={currentSearchType.placeholder}
                  autoFocus
                  className={cn(isRTL ? "pr-3" : "pl-3")}
                />
                <InputGroupAddon align="inline-end" className="pr-3">
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <Tooltip>
                      <TooltipTrigger
                        render={(tooltipProps) => (
                          <PopoverTrigger
                            render={(popoverProps) => (
                              <InputGroupButton
                                size="icon-xs"
                                aria-label={t("searchPanel.advancedSearch")}
                                className={cn("gap-1.5 px-2! w-auto")}
                                {...tooltipProps}
                                {...popoverProps}
                              >
                                <CurrentIcon className="h-3.5 w-3.5" />
                                <ChevronDown className="h-3 w-3 opacity-50" />
                              </InputGroupButton>
                            )}
                          />
                        )}
                      />
                      <TooltipContent>
                        {t("searchPanel.searchBy")}: {currentSearchType.label}
                      </TooltipContent>
                    </Tooltip>
                    <PopoverContent
                      align={isRTL ? "start" : "end"}
                      className="w-80 rounded-xl"
                    >
                      <PopoverHeader>
                        <PopoverTitle>
                          {t("searchPanel.searchOptions")}
                        </PopoverTitle>
                        <PopoverDescription>
                          {t("searchPanel.searchOptionsDescription")}
                        </PopoverDescription>
                      </PopoverHeader>

                      <div className="space-y-4 mt-4">
                        {/* Search Type Selection */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">
                            {t("searchPanel.searchBy")}
                          </Label>
                          <RadioGroup
                            value={localType}
                            onValueChange={handleTypeChange}
                            className="space-y-2"
                          >
                            {searchTypes.map((type) => {
                              const Icon = type.icon;
                              return (
                                <div
                                  key={type.value}
                                  className="flex items-start space-x-3 space-y-0"
                                >
                                  <RadioGroupItem
                                    value={type.value}
                                    id={type.value}
                                  />
                                  <div className="flex-1 space-y-1">
                                    <Label
                                      htmlFor={type.value}
                                      className="flex items-center gap-2 font-normal cursor-pointer"
                                    >
                                      <Icon className="h-4 w-4" />
                                      {type.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      {type.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </div>

                        {/* Apply Button */}
                        <Button
                          onClick={handleApplySettings}
                          className="w-full"
                          size="sm"
                        >
                          {t("searchPanel.applySettings")}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </InputGroupAddon>
              </InputGroup>
            </ButtonGroup>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            size="sm"
            className={cn("shrink-0 gap-2", isRTL && "flex-row-reverse")}
          >
            <Search className="h-4 w-4" />
            <span>{t("searchPanel.search")}</span>
          </Button>
        </div>

        {/* Search Tips */}
        <div
          className={cn(
            "mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1",
            isRTL && "text-right",
          )}
        >
          <p>💡 {t("searchPanel.tip1")}</p>
          <p>💡 {t("searchPanel.tip2")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
