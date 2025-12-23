import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AppLayout from "@/components/layout";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/providers/auth-provider";
import { useLocation } from "wouter";

interface UserRow {
  id: string;
  username: string;
  role: string;
  groups?: string[];
}

interface GroupRow {
  id: string;
  name: string;
  memberIds: string[];
}

export default function AdminPage() {
  const t = useTranslation();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "user" });
  const [newGroup, setNewGroup] = useState({ name: "", memberIds: [] as string[] });
  const [groupEdits, setGroupEdits] = useState<Record<string, string>>({});

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (res.status === 403) {
        navigate("/inventory");
        return [];
      }
      if (!res.ok) throw new Error("Failed to load users");
      return res.json() as Promise<UserRow[]>;
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load groups");
      return res.json() as Promise<GroupRow[]>;
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/users", newUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setNewUser({ username: "", password: "", role: "user" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const saveGroup = useMutation({
    mutationFn: async (group: { id?: string; name: string; memberIds: string[] }) => {
      if (group.id) {
        await apiRequest("PATCH", `/api/groups/${group.id}`, { name: group.name, memberIds: group.memberIds });
      } else {
        await apiRequest("POST", "/api/groups", group);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setNewGroup({ name: "", memberIds: [] });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const toggleMember = (memberIds: string[], id: string) => {
    return memberIds.includes(id) ? memberIds.filter((m) => m !== id) : [...memberIds, id];
  };

  const userOptions = useMemo(
    () => users.map((u) => ({ label: `${u.username} (${u.role})`, value: u.id })),
    [users],
  );

  if (user?.role !== "admin") {
    return <AppLayout>{/* guarded above, but keep empty fallback */}</AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">{t("adminPanel")}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t("adminUsers")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("adminNoUsers")}</p>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between border border-border rounded-md p-3">
                      <div>
                        <p className="font-medium">{u.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("adminRole")}: {u.role} · {t("adminAddToGroup")}: {(u.groups || []).join(", ")}
                        </p>
                      </div>
                      {u.id !== "admin" && (
                        <Button variant="ghost" size="sm" onClick={() => deleteUser.mutate(u.id)}>
                          {t("adminDelete")}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="font-semibold">{t("adminCreateUser")}</h4>
                <div className="space-y-2">
                  <Label htmlFor="new-user-name">{t("loginUsername")}</Label>
                  <Input
                    id="new-user-name"
                    value={newUser.username}
                    onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-user-pass">{t("loginPassword")}</Label>
                  <Input
                    id="new-user-pass"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-user-role">{t("adminRole")}</Label>
                  <Input
                    id="new-user-role"
                    value={newUser.role}
                    onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
                  />
                </div>
                <Button onClick={() => createUser.mutate()} disabled={createUser.isPending}>
                  {t("adminSave")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t("adminGroups")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("adminNoGroups")}</p>
              ) : (
                <div className="space-y-3">
                  {groups.map((g) => (
                    <div key={g.id} className="border border-border rounded-md p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={groupEdits[g.id] ?? g.name}
                          onChange={(e) =>
                            setGroupEdits((prev) => ({
                              ...prev,
                              [g.id]: e.target.value,
                            }))
                          }
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              saveGroup.mutate({
                                id: g.id,
                                name: groupEdits[g.id] ?? g.name,
                                memberIds: g.memberIds,
                              })
                            }
                          >
                            {t("adminSave")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteGroup.mutate(g.id)}
                          >
                            {t("adminDelete")}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {userOptions.map((opt) => (
                          <label key={opt.value} className="flex items-center space-x-2 text-sm">
                            <Checkbox
                              checked={g.memberIds.includes(opt.value)}
                              onCheckedChange={() =>
                                saveGroup.mutate({
                                  id: g.id,
                                  name: g.name,
                                  memberIds: toggleMember(g.memberIds, opt.value),
                                })
                              }
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="font-semibold">{t("adminCreateGroup")}</h4>
                <div className="space-y-2">
                  <Label htmlFor="group-name">{t("groupName")}</Label>
                  <Input
                    id="group-name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t("adminMembers")}</p>
                  {userOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center space-x-2 text-sm">
                      <Checkbox
                        checked={newGroup.memberIds.includes(opt.value)}
                        onCheckedChange={() =>
                          setNewGroup((p) => ({ ...p, memberIds: toggleMember(p.memberIds, opt.value) }))
                        }
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <Button onClick={() => saveGroup.mutate(newGroup)} disabled={saveGroup.isPending}>
                  {t("adminSave")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

