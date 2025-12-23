import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LanguageSwitcher from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/providers/auth-provider";
import { apiRequest } from "@/lib/queryClient";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const [location, navigate] = useLocation();
  const t = useTranslation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    if (user && !loading && (location === "/login" || location === "/")) {
      navigate("/inventory");
    }
  }, [user, loading, location, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) {
        await apiRequest("POST", "/api/register", form).then((r) => r.json());
        await login(form.username, form.password);
      } else {
        await login(form.username, form.password);
      }
      navigate("/inventory");
    } catch (err) {
      setError(t("loginError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              {isRegister ? t("registerTitle") : t("loginTitle")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t("loginSubtitle")}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">{t("loginUsername")}</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  data-testid="input-username"
                />
              </div>
              <div>
                <Label htmlFor="password">{t("loginPassword")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  data-testid="input-password"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t("buttonUpdating") : isRegister ? t("registerButton") : t("loginButton")}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <button
                className="text-primary hover:underline"
                onClick={() => setIsRegister((v) => !v)}
              >
                {isRegister ? t("haveAccount") : t("needAccount")}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

