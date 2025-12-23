import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout";
import { useTranslation } from "@/lib/i18n";

export default function ReportsPage() {
  const t = useTranslation();
  const { data: lowStockComponents = [], isLoading } = useQuery({
    queryKey: ["/api/components/alerts/low-stock"],
    queryFn: async () => {
      const response = await fetch("/api/components/alerts/low-stock", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch low stock components");
      return response.json();
    },
  });

  const csvContent = useMemo(() => {
    if (!lowStockComponents.length) return "";
    const headers = ["name", "category", "quantity", "minStockLevel", "location", "description"];
    const rows = lowStockComponents.map((component: any) =>
      headers
        .map((field) => `"${String(component[field] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }, [lowStockComponents]);

  const handleExport = () => {
    if (!csvContent) return;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "low-stock-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{t("reportsTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("reportsLowStockSubtitle")}</p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!csvContent} data-testid="button-export-csv">
            {t("reportsExport")}
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t("reportsLowStockHeadline")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : lowStockComponents.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("reportsNoLowStock")}</p>
            ) : (
              <div className="space-y-4">
                {lowStockComponents.map((component: any) => (
                  <div key={component.id} className="flex justify-between border border-border rounded-md p-3">
                    <div>
                      <p className="font-medium">{component.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {component.category} · {component.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-700">
                        {component.quantity} / {component.minStockLevel}
                      </p>
                      <p className="text-xs text-muted-foreground">{component.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

