import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertComponentSchema, updateComponentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const ADMIN_USER = {
    id: "admin",
    username: "michel",
    password: "Michelj6",
    role: "admin" as const,
    groups: [] as string[],
  };

  const ensureAdmin = async () => {
    const existing = await storage.getUserByUsername(ADMIN_USER.username);
    if (!existing) {
      await storage.createUser(ADMIN_USER);
      await storage.createWarehouse({
        id: "admin-default",
        name: "Admin Warehouse",
        ownerId: "admin",
        groupIds: [],
        type: "personal",
        warehouseGroupId: null,
      });
    }
  };
  await ensureAdmin();

  const syncUserGroups = async () => {
    const groups = await storage.listGroups();
    const users = await storage.listUsers();
    const memberships: Record<string, string[]> = {};
    groups.forEach((g) => {
      (g.memberIds || []).forEach((uid: string) => {
        memberships[uid] = memberships[uid] || [];
        memberships[uid].push(g.id);
      });
    });
    await Promise.all(
      users.map((u) => storage.updateUser(u.id, { ...u, groups: memberships[u.id] || [] })),
    );
  };

  const refreshSessionUser = async (req: any) => {
    if (req.session?.user?.id) {
      const fresh = await storage.getUser(req.session.user.id);
      if (fresh) {
        req.session.user = {
          id: fresh.id,
          username: fresh.username,
          role: fresh.role,
          groups: fresh.groups ?? [],
        };
      }
    }
  };

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    const user = await storage.getUserByUsername(username || "");
    if (user && user.password === password) {
      req.session.user = { id: user.id, username: user.username, role: user.role, groups: user.groups ?? [] };
      return res.json({ user: req.session.user });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.status(204).end();
    });
  });

  app.get("/api/session", (req, res) => {
    if (req.session?.user) {
      return res.json({ user: req.session.user });
    }
    return res.status(401).json({ error: "Unauthorized" });
  });

  app.post("/api/register", async (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    const existing = await storage.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }
    const user = await storage.createUser({ username, password, role: "user", groups: [] });
    const defaultWh = await storage.createWarehouse({
      name: `${username}'s Warehouse`,
      ownerId: user.id,
      groupIds: [],
      type: "personal",
      warehouseGroupId: null,
    });
    user.defaultWarehouseId = defaultWh.id;
    await storage.updateUser(user.id, user);
    req.session.user = { id: user.id, username: user.username, role: user.role, groups: [] };
    return res.status(201).json({ user: req.session.user });
  });

  app.get("/api/me", async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ error: "Unauthorized" });
    const me = await storage.getUser(req.session.user.id);
    if (!me) return res.status(404).json({ error: "User not found" });
    res.json(me);
  });

  app.patch("/api/me", async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ error: "Unauthorized" });
    const { username, password } = req.body as { username?: string; password?: string };
    const me = await storage.getUser(req.session.user.id);
    if (!me) return res.status(404).json({ error: "User not found" });
    if (username) {
      const conflict = await storage.getUserByUsername(username);
      if (conflict && conflict.id !== me.id) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }
    const updated = await storage.updateUser(me.id, { ...me, username: username ?? me.username, password: password ?? me.password });
    req.session.user = {
      id: updated!.id,
      username: updated!.username,
      role: updated!.role,
      groups: updated!.groups ?? [],
    };
    res.json({ user: req.session.user });
  });

  app.use("/api", (req, res, next) => {
    const openPaths = ["/login", "/session", "/logout", "/register"];
    if (openPaths.includes(req.path)) return next();
    if (req.session?.user) {
      refreshSessionUser(req).then(() => next());
      return;
    }
    return res.status(401).json({ error: "Unauthorized" });
  });

  const canAccessWarehouse = (warehouse: any, user: any) => {
    if (!user || !warehouse) return false;
    if (user.role === "admin") return true;
    const groups: string[] = user.groups ?? [];
    if (warehouse.type === "group") {
      return !!warehouse.warehouseGroupId && groups.includes(warehouse.warehouseGroupId);
    }
    return warehouse.ownerId === user.id || (warehouse.groupIds || []).some((gid: string) => groups.includes(gid));
  };

  const canAccessComponent = (component: any, user: any, warehouses: any[]) => {
    if (!user) return false;
    const warehouse = warehouses.find((w) => w.id === component.warehouseId);
    return canAccessWarehouse(warehouse, user);
  };

  const getAccessibleWarehouses = async (user: any) => {
    const warehouses = await storage.listWarehouses();
    return warehouses.filter((w) => canAccessWarehouse(w, user));
  };

  const groupMap = async () => {
    const groups = await storage.listGroups();
    return new Map(groups.map((g) => [g.id, g]));
  };

  // Get all components
  app.get("/api/components", async (req, res) => {
    try {
      const { search, category, warehouseId } = req.query;
      const user = req.session?.user;
      const warehouses = await getAccessibleWarehouses(user);
      let components = (await storage.getComponents()).filter((c) => canAccessComponent(c as any, user, warehouses));

      if (warehouseId) {
        components = components.filter((c) => c.warehouseId === warehouseId);
      }
      
      // Apply category filter first
      if (category && category !== "All Categories") {
        components = components.filter(component => component.category === category);
      }
      
      // Apply search filter to the results
      if (search) {
        const lowerQuery = (search as string).toLowerCase();
        components = components.filter(component =>
          component.name.toLowerCase().includes(lowerQuery) ||
          component.description.toLowerCase().includes(lowerQuery) ||
          component.category.toLowerCase().includes(lowerQuery) ||
          component.location.toLowerCase().includes(lowerQuery)
        );
      }
      
      res.json(components);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch components" });
    }
  });

  // Get component by ID
  app.get("/api/components/:id", async (req, res) => {
    try {
      const component = await storage.getComponent(req.params.id);
      const user = req.session?.user;
      const warehouses = await getAccessibleWarehouses(user);
      if (!component || !canAccessComponent(component, user, warehouses)) {
        return res.status(404).json({ error: "Component not found" });
      }
      if (!component) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.json(component);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch component" });
    }
  });

  // Create new component
  app.post("/api/components", async (req, res) => {
    try {
      const user = req.session?.user;
      const warehouses = await getAccessibleWarehouses(user);
      const validated = insertComponentSchema.parse(req.body);
      const targetWarehouseId =
        (req.body as any).warehouseId ||
        warehouses[0]?.id ||
        (await storage.createWarehouse({
          name: "My Warehouse",
          ownerId: user?.id,
          groupIds: [],
          type: "personal",
          warehouseGroupId: null,
        })).id;
      const targetWarehouse = (await storage.listWarehouses()).find((w) => w.id === targetWarehouseId);
      if (!targetWarehouse || !canAccessWarehouse(targetWarehouse, user)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const component = await storage.createComponent({
        ...validated,
        ownerId: user?.id,
        groupIds: [],
        warehouseId: targetWarehouseId,
        warehouseType: targetWarehouse.type || "personal",
        warehouseGroupId: targetWarehouse.warehouseGroupId ?? null,
      });
      res.status(201).json(component);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create component" });
    }
  });

  // Update component
  app.patch("/api/components/:id", async (req, res) => {
    try {
      const user = req.session?.user;
      const validated = updateComponentSchema.parse(req.body);
      const existing = await storage.getComponent(req.params.id);
      const warehouses = await getAccessibleWarehouses(user);
      if (!existing || !canAccessComponent(existing, user, warehouses)) {
        return res.status(404).json({ error: "Component not found" });
      }
      const component = await storage.updateComponent(req.params.id, validated);
      if (!component) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.json(component);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update component" });
    }
  });

  // Delete component
  app.delete("/api/components/:id", async (req, res) => {
    try {
      const user = req.session?.user;
      const existing = await storage.getComponent(req.params.id);
      const warehouses = await getAccessibleWarehouses(user);
      if (!existing || !canAccessComponent(existing, user, warehouses)) {
        return res.status(404).json({ error: "Component not found" });
      }
      const success = await storage.deleteComponent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete component" });
    }
  });

  // Get low stock components
  app.get("/api/components/alerts/low-stock", async (req, res) => {
    try {
      const user = req.session?.user;
      const { warehouseId } = req.query;
      const warehouses = await getAccessibleWarehouses(user);
      const components = (await storage.getLowStockComponents()).filter((c) => {
        if (!canAccessComponent(c as any, user, warehouses)) return false;
        if (warehouseId) return c.warehouseId === warehouseId;
        return true;
      });
      res.json(components);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock components" });
    }
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const user = req.session?.user;
      const { warehouseId } = req.query;
      const warehouses = await getAccessibleWarehouses(user);
      let allComponents = (await storage.getComponents()).filter((c) =>
        canAccessComponent(c as any, user, warehouses),
      );
      if (warehouseId) {
        allComponents = allComponents.filter((c) => c.warehouseId === warehouseId);
      }
      const lowStockComponents = allComponents.filter((c) => c.quantity <= c.minStockLevel);
      
      const totalComponents = allComponents.length;
      const totalQuantity = allComponents.reduce((sum, c) => sum + c.quantity, 0);
      const categories = new Set(allComponents.map(c => c.category)).size;
      const lowStockCount = lowStockComponents.length;
      
      res.json({
        totalComponents,
        totalQuantity,
        categories,
        lowStockCount
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin: users
  app.get("/api/users", async (req, res) => {
    if (req.session?.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const users = await storage.listUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    if (req.session?.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { username, password, role = "user", groups = [] } = req.body as any;
    const existing = await storage.getUserByUsername(username);
    if (existing) return res.status(400).json({ error: "User already exists" });
    const user = await storage.createUser({ username, password, role, groups });
    res.status(201).json(user);
  });

  app.patch("/api/users/:id", async (req, res) => {
    if (req.session?.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const user = await storage.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  app.patch("/api/users/me", async (req, res) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { username, password } = req.body as any;
    const updated = await storage.updateUser(user.id, {
      ...(username ? { username } : {}),
      ...(password ? { password } : {}),
    });
    if (!updated) return res.status(404).json({ error: "User not found" });
    req.session.user = { ...req.session.user, username: updated.username };
    res.json(updated);
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (req.session?.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const deleted = await storage.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.status(204).end();
  });

  // Groups
  app.get("/api/groups", async (req, res) => {
    const user = req.session?.user;
    const groups = await storage.listGroups();
    if (user?.role === "admin") {
      return res.json(groups);
    }
    const filtered = groups.filter((g) => (g.memberIds || []).includes(user?.id));
    res.json(filtered);
  });

  app.post("/api/groups", async (req, res) => {
    if (req.session?.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { name, memberIds = [] } = req.body as any;
    const group = await storage.createGroup({ name, memberIds });
    await syncUserGroups();
    res.status(201).json(group);
  });

  app.patch("/api/groups/:id", async (req, res) => {
    if (req.session?.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const group = await storage.updateGroup(req.params.id, req.body);
    if (!group) return res.status(404).json({ error: "Group not found" });
    await syncUserGroups();
    res.json(group);
  });

  app.delete("/api/groups/:id", async (req, res) => {
    if (req.session?.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const deleted = await storage.deleteGroup(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Group not found" });
    await syncUserGroups();
    res.status(204).end();
  });

  // Warehouses
  app.get("/api/warehouses", async (req, res) => {
    const user = req.session?.user;
    const warehouses = await getAccessibleWarehouses(user);
    const gmap = await groupMap();
    const withNames = warehouses.map((w) => ({
      ...w,
      groupName: w.warehouseGroupId ? gmap.get(w.warehouseGroupId)?.name : undefined,
    }));
    res.json(withNames);
  });

  app.post("/api/warehouses", async (req, res) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { name, groupIds = [], type = "personal", groupId } = req.body as any;
    if (!["personal", "group"].includes(type)) {
      return res.status(400).json({ error: "Invalid warehouse type" });
    }
    let chosenGroupId: string | null = null;
    if (type === "group") {
      const candidate = groupId || groupIds[0];
      const groups = await storage.listGroups();
      const target = groups.find((g) => g.id === candidate);
      if (!target) return res.status(400).json({ error: "Group not found" });
      if (!(user.role === "admin" || (target.memberIds || []).includes(user.id))) {
        return res.status(403).json({ error: "Only group members can create group warehouses" });
      }
      chosenGroupId = target.id;
    }
    const warehouse = await storage.createWarehouse({
      name: name || "My Warehouse",
      ownerId: user?.id,
      groupIds: [],
      type,
      warehouseGroupId: chosenGroupId,
    });
    res.status(201).json(warehouse);
  });

  app.patch("/api/warehouses/:id", async (req, res) => {
    const user = req.session?.user;
    const existing = (await storage.listWarehouses()).find((w) => w.id === req.params.id);
    if (!existing) return res.status(404).json({ error: "Warehouse not found" });
    if (!(existing.ownerId === user?.id || user?.role === "admin")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const payload: any = {};
    if (req.body.name) payload.name = req.body.name;
    const updated = await storage.updateWarehouse(req.params.id, { ...existing, ...payload });
    res.json(updated);
  });

  app.delete("/api/warehouses/:id", async (req, res) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const existing = (await storage.listWarehouses()).find((w) => w.id === req.params.id);
    if (!existing) return res.status(404).json({ error: "Warehouse not found" });

    // 只有仓库所有者才能删除仓库
    if (existing.ownerId !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Only warehouse owner can delete the warehouse" });
    }

    // 允许删除非空仓库，并将所有关联元件的 warehouseId 设置为 null
    const components = await storage.getComponents();
    const toOrphan = components.filter((c) => c.warehouseId === req.params.id);
    for (const c of toOrphan) {
      await storage.updateComponent(c.id, { warehouseId: null });
    }

    const deleted = await storage.deleteWarehouse(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Warehouse not found" });

    res.status(204).end();
  });

  const httpServer = createServer(app);
  return httpServer;
}
