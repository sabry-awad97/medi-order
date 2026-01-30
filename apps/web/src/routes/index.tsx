import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Users,
} from "lucide-react";
import { useTranslation, useDirection } from "@meditrack/i18n";

import { Button } from "@/components/ui/button";
import {
  Page,
  PageHeader,
  PageHeaderTrigger,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderDescription,
  PageContent,
  PageContentInner,
} from "@/components/ui/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { t } = useTranslation("home");
  const { isRTL } = useDirection();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <ProtectedRoute>
      <Page>
        <PageHeader>
          <PageHeaderTrigger />
          <PageHeaderContent>
            <PageHeaderTitle>{t("title")}</PageHeaderTitle>
            <PageHeaderDescription>{t("subtitle")}</PageHeaderDescription>
          </PageHeaderContent>
        </PageHeader>

        <PageContent>
          <PageContentInner className="flex-1 flex flex-col min-h-0">
            <div className="max-w-4xl mx-auto w-full">
              <div className="text-center mb-12">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Package className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold mb-4">{t("welcome")}</h2>
                <p className="text-xl text-muted-foreground mb-8">
                  {t("description")}
                </p>
                <Link to="/special-orders">
                  <Button size="lg" className="gap-2">
                    {t("enterSystem")}
                    <ArrowIcon className="h-5 w-5" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border border-dashed hover:border-solid transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle>{t("features.orders.title")}</CardTitle>
                    </div>
                    <CardDescription>
                      {t("features.orders.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t("features.orders.details")}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-dashed hover:border-solid transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <CardTitle>{t("features.tracking.title")}</CardTitle>
                    </div>
                    <CardDescription>
                      {t("features.tracking.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t("features.tracking.details")}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-dashed hover:border-solid transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <CardTitle>{t("features.statistics.title")}</CardTitle>
                    </div>
                    <CardDescription>
                      {t("features.statistics.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t("features.statistics.details")}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </PageContentInner>
        </PageContent>
      </Page>
    </ProtectedRoute>
  );
}
