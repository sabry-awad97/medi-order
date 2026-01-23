import { Link, createFileRoute } from "@tanstack/react-router";
import { Home, ArrowRight, Search, FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Page, PageContent, PageContentInner } from "@/components/ui/page";

export const Route = createFileRoute("/404")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <Page>
      <PageContent>
        <PageContentInner className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto px-6 py-16">
            {/* الأيقونة والرقم */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <FileQuestion className="h-32 w-32 mx-auto text-muted-foreground/40 mb-4" />
                <h1 className="text-9xl font-bold text-primary/10 select-none">
                  404
                </h1>
              </div>
            </div>

            {/* العنوان والوصف */}
            <div className="space-y-4 mb-8">
              <h2 className="text-3xl font-bold">الصفحة غير موجودة</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى موقع آخر
              </p>
            </div>

            {/* الروابط المفيدة */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="gap-2"
                  render={(props) => <Link to="/" {...props} />}
                >
                  <Home className="h-5 w-5" />
                  العودة للرئيسية
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  render={(props) => <Link to="/pharmacy" {...props} />}
                >
                  <Search className="h-5 w-5" />
                  الطلبات الخاصة
                </Button>
              </div>

              {/* روابط سريعة */}
              <div className="pt-8 border-t border-dashed">
                <p className="text-sm text-muted-foreground mb-4">
                  أو انتقل إلى:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    render={(props) => <Link to="/pharmacy" {...props} />}
                  >
                    الطلبات
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    render={(props) => <Link to="/suppliers" {...props} />}
                  >
                    الموردين
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    render={(props) => <Link to="/reports" {...props} />}
                  >
                    التقارير
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PageContentInner>
      </PageContent>
    </Page>
  );
}
