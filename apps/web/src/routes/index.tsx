import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    <div className="container mx-auto max-w-4xl px-4 py-16" dir="rtl">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/10">
            <Package className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          نظام إدارة الطلبات الخاصة للصيدلية
        </h1>
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

      <div className="grid gap-6 md:grid-cols-3 mt-16">
        <Card>
          <CardHeader>
            <CardTitle>إدارة الطلبات</CardTitle>
            <CardDescription>
              إضافة وتعديل وتتبع جميع الطلبات الخاصة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              نظام سهل وسريع لإدارة طلبات الأدوية مع إمكانية إضافة عدة أدوية لكل
              طلب
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تتبع الحالات</CardTitle>
            <CardDescription>متابعة حالة كل طلب بدقة</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              من قيد الانتظار حتى التسليم، تتبع كامل لدورة حياة الطلب
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إحصائيات فورية</CardTitle>
            <CardDescription>معلومات واضحة عن جميع الطلبات</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              لوحة تحكم شاملة تعرض إحصائيات الطلبات حسب الحالة
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
