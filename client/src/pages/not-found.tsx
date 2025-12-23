import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import AppLayout from "@/components/layout";
import { useTranslation } from "@/lib/i18n";

export default function NotFound() {
  const t = useTranslation();
  return (
    <AppLayout>
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">{t("notFoundTitle")}</h1>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              {t("notFoundSubtitle")}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
