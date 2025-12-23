import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout";
import LanguageSwitcher from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/providers/auth-provider";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const t = useTranslation();
  const { user, logout, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");

  const updateProfile = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/me", {
        ...(username ? { username } : {}),
        ...(password ? { password } : {}),
      });
    },
    onSuccess: async () => {
      setFeedback(t("profileSaved"));
      await refresh();
      setPassword("");
    },
    onError: () => setFeedback(t("toastError")),
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">{t("settingsTitle")}</h2>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t("settingsAccount")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("userGreeting", { username: user?.username ?? "" })}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("profileTitle")}</p>
              <Input
                placeholder={t("profileUsername")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                type="password"
                placeholder={t("profilePassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {feedback && <p className="text-xs text-muted-foreground">{feedback}</p>}
              <Button variant="outline" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
                {t("profileSave")}
              </Button>
            </div>
            <Button variant="destructive" onClick={handleLogout} data-testid="button-logout">
              {t("settingsLogout")}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t("languageLabel")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("settingsLanguageHint")}</p>
            <LanguageSwitcher />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

