import { useState, useEffect, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { updateComponentSchema, COMPONENT_CATEGORIES, type Component } from "@shared/schema";
import { z } from "zod";
import { useTranslation } from "@/lib/i18n";

interface EditComponentDialogProps {
  component: Component | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditComponentDialog({ component, open, onOpenChange }: EditComponentDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    location: "",
    description: "",
    minStockLevel: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslation();
  const formatCategory = (category: string) => t(`category_${category.replace(/\s+/g, "")}` as any);

  useEffect(() => {
    if (component) {
      setFormData({
        name: component.name,
        category: component.category,
        quantity: component.quantity.toString(),
        location: component.location,
        description: component.description,
        minStockLevel: component.minStockLevel.toString()
      });
    }
  }, [component]);

  const updateComponentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/components/${component?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/components/alerts/low-stock"] });
      toast({
        title: t("toastSuccess"),
        description: t("toastUpdated")
      });
      onOpenChange(false);
      setErrors({});
    },
    onError: (error: any) => {
      toast({
        title: t("toastError"),
        description: t("toastUpdateFailed"),
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = updateComponentSchema.parse({
        name: formData.name,
        category: formData.category,
        quantity: parseInt(formData.quantity) || 0,
        location: formData.location,
        description: formData.description,
        minStockLevel: parseInt(formData.minStockLevel) || 10
      });

      updateComponentMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!component) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-edit-component">
        <DialogHeader>
          <DialogTitle>{t("formEditTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("formComponentName")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              data-testid="input-edit-name"
            />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="category">{t("formCategory")}</Label>
            <Select value={formData.category} onValueChange={(value) => updateFormData("category", value)}>
              <SelectTrigger data-testid="select-edit-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPONENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {formatCategory(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">{t("formQuantity")}</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => updateFormData("quantity", e.target.value)}
                data-testid="input-edit-quantity"
              />
              {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <Label htmlFor="location">{t("formLocation")}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData("location", e.target.value)}
                data-testid="input-edit-location"
              />
              {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="minStockLevel">{t("formMinStock")}</Label>
            <Input
              id="minStockLevel"
              type="number"
              min="0"
              value={formData.minStockLevel}
              onChange={(e) => updateFormData("minStockLevel", e.target.value)}
              data-testid="input-edit-min-stock"
            />
            {errors.minStockLevel && <p className="text-sm text-destructive mt-1">{errors.minStockLevel}</p>}
          </div>

          <div>
            <Label htmlFor="description">{t("formDescription")}</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              data-testid="textarea-edit-description"
            />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit">
              {t("buttonCancel")}
            </Button>
            <Button type="submit" disabled={updateComponentMutation.isPending} data-testid="button-save-edit">
              {updateComponentMutation.isPending ? t("buttonUpdating") : t("buttonUpdate")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
