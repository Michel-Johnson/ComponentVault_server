import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Search, Bell, X } from "lucide-react";
import StatsOverview from "@/components/stats-overview";
import ComponentsTable from "@/components/components-table";
import AddComponentDialog from "@/components/add-component-dialog";
import { COMPONENT_CATEGORIES } from "@shared/schema";
import AppLayout from "@/components/layout";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showLowStockAlert, setShowLowStockAlert] = useState(true);
  const [warehouseName, setWarehouseName] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [warehouseType, setWarehouseType] = useState<"personal" | "group">("personal");
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [renameValue, setRenameValue] = useState("");
  const t = useTranslation();
  const queryClient = useQueryClient();
  const formatCategory = (category: string) => t(`category_${category.replace(/\s+/g, "")}` as any);
  const warehouseLabel = (w: any) => (w.type === "group" && w.groupName ? `${w.groupName}: ${w.name}` : w.name);

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
    queryFn: async () => {
      const res = await fetch("/api/warehouses", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load warehouses");
      return res.json();
    }
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups", { credentials: "include" });
      if (res.status === 403) return [];
      if (!res.ok) throw new Error("Failed to load groups");
      return res.json();
    }
  });

  useEffect(() => {
    if (warehouses.length && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouses[0].id);
      setRenameValue(warehouses[0].name);
    }
    if (selectedWarehouseId) {
      const found = warehouses.find((w: any) => w.id === selectedWarehouseId);
      if (found) setRenameValue(found.name);
    }
  }, [warehouses, selectedWarehouseId]);

  useEffect(() => {
    if (warehouseType === "group") {
      if (!selectedGroupId && groups.length > 0) {
        setSelectedGroupId(groups[0].id);
      }
    } else {
      setSelectedGroupId(undefined);
    }
  }, [warehouseType, groups, selectedGroupId]);

  const createWarehouse = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/warehouses", {
        name: warehouseName || t("warehouseNamePlaceholder"),
        type: warehouseType,
        groupId: warehouseType === "group" ? selectedGroupId : undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setWarehouseName("");
      setSelectedWarehouseId(data.id);
      setWarehouseType("personal");
      setSelectedGroupId(undefined);
      setRenameValue(data.name);
    }
  });

  const renameWarehouse = useMutation({
    mutationFn: async () => {
      if (!selectedWarehouseId) return;
      await apiRequest("PATCH", `/api/warehouses/${selectedWarehouseId}`, { name: renameValue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
    }
  });

  const { data: components = [], isLoading } = useQuery({
    queryKey: ["/api/components", searchQuery, selectedCategory, selectedWarehouseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory !== "All Categories") params.append("category", selectedCategory);
      if (selectedWarehouseId) params.append("warehouseId", selectedWarehouseId);
      
      const response = await fetch(`/api/components?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch components");
      return response.json();
    }
  });

  const { data: lowStockComponents = [] } = useQuery({
    queryKey: ["/api/components/alerts/low-stock", selectedWarehouseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedWarehouseId) params.append("warehouseId", selectedWarehouseId);
      const response = await fetch(`/api/components/alerts/low-stock?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch low stock components");
      return response.json();
    }
  });

  useEffect(() => {
    if (lowStockComponents.length > 0) {
      setShowLowStockAlert(true);
    }
  }, [lowStockComponents.length]);

  return (
    <AppLayout>
      <StatsOverview warehouseId={selectedWarehouseId} />

      {/* Search and Filters */}
      <div className="bg-card rounded-lg border border-border p-6 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-components"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="filter-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Categories">{t("allCategories")}</SelectItem>
                {COMPONENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {formatCategory(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-component">
              <Plus className="mr-2 h-4 w-4" />
              {t("addComponent")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{t("warehouseSelect")}</p>
            <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
              <SelectTrigger className="w-full lg:w-64">
                <SelectValue placeholder={t("warehouseSelect")} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w: any) => (
                  <SelectItem key={w.id} value={w.id}>
                    {warehouseLabel(w)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 items-end gap-2">
            <Input
              placeholder={t("warehouseNamePlaceholder")}
              value={warehouseName}
              onChange={(e) => setWarehouseName(e.target.value)}
            />
            <Select value={warehouseType} onValueChange={(v) => setWarehouseType(v as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">{t("warehouseTypePersonal")}</SelectItem>
                <SelectItem value="group">{t("warehouseTypeGroup")}</SelectItem>
              </SelectContent>
            </Select>
            {warehouseType === "group" && (
              <Select value={selectedGroupId} onValueChange={(v) => setSelectedGroupId(v)} >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("warehouseGroupSelect")} />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => createWarehouse.mutate()} disabled={createWarehouse.isPending}>
              {t("warehouseCreate")}
            </Button>
          </div>
        </div>
        {selectedWarehouseId && (
          <div className="flex flex-col lg:flex-row gap-3 mt-3">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{t("warehouseRename")}</p>
              <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => renameWarehouse.mutate()} disabled={renameWarehouse.isPending}>
                {t("buttonSave")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ComponentsTable components={components} isLoading={isLoading} />

      {/* Low Stock Alert */}
      {showLowStockAlert && lowStockComponents.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="text-amber-600 h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">{t("lowStockAlertTitle")}</p>
              <p className="text-sm text-amber-700 mt-1" data-testid="text-low-stock-count">
                {t("lowStockAlertBody", { count: lowStockComponents.length })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => setShowLowStockAlert(false)}
              aria-label="Close alert"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AddComponentDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} warehouseId={selectedWarehouseId} />
    </AppLayout>
  );
}
