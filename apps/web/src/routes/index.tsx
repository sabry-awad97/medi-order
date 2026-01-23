import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  ArrowLeft,
  CheckCircle,
  BarChart3,
  Users,
} from "lucide-react";

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

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <Page>
      <PageHeader>
        <PageHeaderTrigger />
        <PageHeaderContent>
          <PageHeaderTitle>الصفحة الرئيسية</PageHeaderTitle>
          <PageHeaderDescription>
            نظام إدارة الطلبات الخاصة للصيدلية
          </PageHeaderDescription>
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
              <h2 className="text-4xl font-bold mb-4">
                نظام إدارة الطلبات الخاصة للصيدلية
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                نظام متكامل لإدارة طلبات الأدوية الخاصة بكفاءة واحترافية
              </p>
              <Link to="/pharmacy">
                <Button size="lg" className="gap-2">
                  الدخول إلى النظام
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-2 border-dashed hover:border-solid transition-all">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle>إدارة الطلبات</CardTitle>
                  </div>
                  <CardDescription>
                    إضافة وتعديل وتتبع جميع الطلبات الخاصة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    نظام سهل وسريع لإدارة طلبات الأدوية مع إمكانية إضافة عدة
                    أدوية لكل طلب
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed hover:border-solid transition-all">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <CardTitle>تتبع الحالات</CardTitle>
                  </div>
                  <CardDescription>متابعة حالة كل طلب بدقة</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    من قيد الانتظار حتى التسليم، تتبع كامل لدورة حياة الطلب
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed hover:border-solid transition-all">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <CardTitle>إحصائيات فورية</CardTitle>
                  </div>
                  <CardDescription>
                    معلومات واضحة عن جميع الطلبات
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    لوحة تحكم شاملة تعرض إحصائيات الطلبات حسب الحالة
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </PageContentInner>
      </PageContent>
    </Page>
  );
}
