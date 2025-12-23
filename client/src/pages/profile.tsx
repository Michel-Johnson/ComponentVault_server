import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout";
import { useAuth } from "@/providers/auth-provider";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const t = useTranslation();
  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await apiRequest("PATCH", "/api/users/me", { username, password: password || undefined });
      await refresh();
      setPassword("");
      setMessage("✓");
    } catch (e) {
      setMessage("✕");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-xl">
        <h2 className="text-2xl font-semibold">{t("profileTitle")}</h2>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t("profileTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("profileUsername")}</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("profilePassword")}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {t("profileSave")}
              </Button>
              {message && <span className="text-sm text-muted-foreground">{message}</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

