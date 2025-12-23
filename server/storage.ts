import { type Component, type InsertComponent, type UpdateComponent } from "@shared/schema";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export interface IStorage {
  // Component operations
  getComponents(): Promise<Component[]>;
  getComponent(id: string): Promise<Component | undefined>;
  createComponent(component: InsertComponent): Promise<Component>;
  updateComponent(id: string, updates: UpdateComponent): Promise<Component | undefined>;
  deleteComponent(id: string): Promise<boolean>;
  searchComponents(query: string): Promise<Component[]>;
  getComponentsByCategory(category: string): Promise<Component[]>;
  getLowStockComponents(): Promise<Component[]>;
  
  // User operations (existing)
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  listUsers(): Promise<any[]>;
  updateUser(id: string, updates: any): Promise<any | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Group operations
  listGroups(): Promise<any[]>;
  createGroup(group: any): Promise<any>;
  updateGroup(id: string, updates: any): Promise<any | undefined>;
  deleteGroup(id: string): Promise<boolean>;

  // Warehouses
  listWarehouses(): Promise<any[]>;
  createWarehouse(warehouse: any): Promise<any>;
  updateWarehouse(id: string, updates: any): Promise<any | undefined>;
  getWarehouse(id: string): Promise<any | undefined>;
  deleteWarehouse(id: string): Promise<boolean>;
}

export class FileStorage implements IStorage {
  private components: Map<string, Component>;
  private users: Map<string, any>;
  private groups: Map<string, any>;
  private warehouses: Map<string, any>;
  private readonly dataDir: string;
  private readonly componentsFile: string;
  private readonly usersFile: string;
  private readonly groupsFile: string;
  private readonly warehousesFile: string;

  private initialized = false;

  constructor(dataDir: string = "data") {
    this.components = new Map();
    this.users = new Map();
    this.groups = new Map();
    this.warehouses = new Map();
    this.dataDir = dataDir;
    this.componentsFile = path.join(dataDir, "components.json");
    this.usersFile = path.join(dataDir, "users.json");
    this.groupsFile = path.join(dataDir, "groups.json");
    this.warehousesFile = path.join(dataDir, "warehouses.json");
    
    // Initialize data loading immediately
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.loadData();
      this.initialized = true;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create data directory:", error);
    }
  }

  private async loadData(): Promise<void> {
    try {
      await this.ensureDataDir();
      
      // Load components
      try {
        const componentsData = await fs.readFile(this.componentsFile, "utf-8");
        const componentsArray: Component[] = JSON.parse(componentsData);
        this.components = new Map(componentsArray.map(comp => [comp.id, comp]));
      } catch (error) {
        console.log("No existing components data found, initializing with sample data");
        await this.initializeSampleData();
      }

      // Load users
      try {
        const usersData = await fs.readFile(this.usersFile, "utf-8");
        const usersArray: any[] = JSON.parse(usersData);
        this.users = new Map(usersArray.map(user => [user.id, user]));
      } catch (error) {
        console.log("No existing users data found");
      }

      // Load groups
      try {
        const groupsData = await fs.readFile(this.groupsFile, "utf-8");
        const groupsArray: any[] = JSON.parse(groupsData);
        this.groups = new Map(groupsArray.map(group => [group.id, group]));
      } catch (error) {
        console.log("No existing groups data found");
      }

      // Load warehouses
      try {
        const warehousesData = await fs.readFile(this.warehousesFile, "utf-8");
        const warehousesArray: any[] = JSON.parse(warehousesData);
        this.warehouses = new Map(warehousesArray.map(wh => [wh.id, wh]));
      } catch (error) {
        console.log("No existing warehouses data found");
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      await this.initializeSampleData();
    }
  }

  private async saveComponents(): Promise<void> {
    try {
      await this.ensureDataDir();
      const componentsArray = Array.from(this.components.values());
      await fs.writeFile(this.componentsFile, JSON.stringify(componentsArray, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save components:", error);
    }
  }

  private async saveUsers(): Promise<void> {
    try {
      await this.ensureDataDir();
      const usersArray = Array.from(this.users.values());
      await fs.writeFile(this.usersFile, JSON.stringify(usersArray, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save users:", error);
    }
  }

  private async saveGroups(): Promise<void> {
    try {
      await this.ensureDataDir();
      const groupsArray = Array.from(this.groups.values());
      await fs.writeFile(this.groupsFile, JSON.stringify(groupsArray, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save groups:", error);
    }
  }

  private async saveWarehouses(): Promise<void> {
    try {
      await this.ensureDataDir();
      const warehousesArray = Array.from(this.warehouses.values());
      await fs.writeFile(this.warehousesFile, JSON.stringify(warehousesArray, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save warehouses:", error);
    }
  }

  private async initializeSampleData(): Promise<void> {
    const sampleComponents: InsertComponent[] = [
      {
        name: "ATmega328P-PU",
        category: "Integrated Circuits",
        quantity: 45,
        location: "A1-B3",
        description: "8-bit AVR Microcontroller",
        minStockLevel: 10
      },
      {
        name: "470µF Electrolytic",
        category: "Capacitors",
        quantity: 8,
        location: "C2-A1", 
        description: "25V Radial Electrolytic Capacitor",
        minStockLevel: 20
      },
      {
        name: "10kΩ Resistor",
        category: "Resistors",
        quantity: 250,
        location: "R1-A5",
        description: "1/4W Carbon Film Resistor",
        minStockLevel: 50
      },
      {
        name: "2N3904 NPN",
        category: "Transistors", 
        quantity: 0,
        location: "T1-C2",
        description: "General Purpose NPN Transistor",
        minStockLevel: 15
      },
      {
        name: "1N4148 Diode",
        category: "Diodes",
        quantity: 5,
        location: "D1-A2",
        description: "High-speed switching diode",
        minStockLevel: 25
      }
    ];

    const defaultWarehouse = { id: "admin-default", name: "Admin Warehouse", ownerId: "admin", groupIds: [], type: "personal" };
    this.warehouses.set(defaultWarehouse.id, defaultWarehouse);

    for (const comp of sampleComponents) {
      const id = randomUUID();
      const component: Component = { 
        id,
        name: comp.name,
        category: comp.category,
        quantity: comp.quantity ?? 0,
        location: comp.location,
        description: comp.description,
        minStockLevel: comp.minStockLevel ?? 10,
        ownerId: "admin",
        groupIds: [],
        warehouseId: defaultWarehouse.id,
        warehouseType: "personal",
        warehouseGroupId: null as any,
      };
      this.components.set(id, component);
    }
    
    // Save initial sample data
    await this.saveComponents();
    await this.saveWarehouses();
  }

  async getComponents(): Promise<Component[]> {
    await this.ensureInitialized();
    return Array.from(this.components.values());
  }

  async getComponent(id: string): Promise<Component | undefined> {
    await this.ensureInitialized();
    return this.components.get(id);
  }

  async createComponent(insertComponent: InsertComponent): Promise<Component> {
    await this.ensureInitialized();
    const id = randomUUID();
    const component: Component = { 
      id,
      name: insertComponent.name,
      category: insertComponent.category,
      quantity: insertComponent.quantity ?? 0,
      location: insertComponent.location,
      description: insertComponent.description,
      minStockLevel: insertComponent.minStockLevel ?? 10,
      ownerId: (insertComponent as any).ownerId ?? "admin",
      groupIds: (insertComponent as any).groupIds ?? [],
      warehouseId: (insertComponent as any).warehouseId ?? "admin-default",
      warehouseType: (insertComponent as any).warehouseType ?? "personal",
      warehouseGroupId: (insertComponent as any).warehouseGroupId ?? null,
    };
    this.components.set(id, component);
    await this.saveComponents();
    return component;
  }

  async updateComponent(id: string, updates: UpdateComponent): Promise<Component | undefined> {
    await this.ensureInitialized();
    const existing = this.components.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.components.set(id, updated);
    await this.saveComponents();
    return updated;
  }

  async deleteComponent(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = this.components.delete(id);
    if (result) {
      await this.saveComponents();
    }
    return result;
  }

  async searchComponents(query: string): Promise<Component[]> {
    await this.ensureInitialized();
    const components = Array.from(this.components.values());
    const lowerQuery = query.toLowerCase();
    
    return components.filter(component =>
      component.name.toLowerCase().includes(lowerQuery) ||
      component.description.toLowerCase().includes(lowerQuery) ||
      component.category.toLowerCase().includes(lowerQuery) ||
      component.location.toLowerCase().includes(lowerQuery)
    );
  }

  async getComponentsByCategory(category: string): Promise<Component[]> {
    await this.ensureInitialized();
    const components = Array.from(this.components.values());
    return components.filter(component => component.category === category);
  }

  async getLowStockComponents(): Promise<Component[]> {
    await this.ensureInitialized();
    const components = Array.from(this.components.values());
    return components.filter(component => component.quantity <= component.minStockLevel);
  }

  // User operations
  async getUser(id: string): Promise<any | undefined> {
    await this.ensureInitialized();
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    await this.ensureInitialized();
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    await this.ensureInitialized();
    const id = randomUUID();
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    await this.saveUsers();
    return user;
  }

  async listUsers(): Promise<any[]> {
    await this.ensureInitialized();
    return Array.from(this.users.values());
  }

  async updateUser(id: string, updates: any): Promise<any | undefined> {
    await this.ensureInitialized();
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.users.set(id, updated);
    await this.saveUsers();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = this.users.delete(id);
    if (result) {
      await this.saveUsers();
    }
    return result;
  }

  // Groups
  async listGroups(): Promise<any[]> {
    await this.ensureInitialized();
    return Array.from(this.groups.values());
  }

  async createGroup(group: any): Promise<any> {
    await this.ensureInitialized();
    const id = randomUUID();
    const newGroup = { ...group, id };
    this.groups.set(id, newGroup);
    await this.saveGroups();
    return newGroup;
  }

  async updateGroup(id: string, updates: any): Promise<any | undefined> {
    await this.ensureInitialized();
    const existing = this.groups.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.groups.set(id, updated);
    await this.saveGroups();
    return updated;
  }

  async deleteGroup(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = this.groups.delete(id);
    if (result) {
      await this.saveGroups();
    }
    return result;
  }

  // Warehouses
  async listWarehouses(): Promise<any[]> {
    await this.ensureInitialized();
    return Array.from(this.warehouses.values());
  }

  async createWarehouse(warehouse: any): Promise<any> {
    await this.ensureInitialized();
    const id = warehouse.id ?? randomUUID();
    const newWarehouse = { ...warehouse, id };
    this.warehouses.set(id, newWarehouse);
    await this.saveWarehouses();
    return newWarehouse;
  }

  async updateWarehouse(id: string, updates: any): Promise<any | undefined> {
    await this.ensureInitialized();
    const existing = this.warehouses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.warehouses.set(id, updated);
    await this.saveWarehouses();
    return updated;
  }

  async getWarehouse(id: string): Promise<any | undefined> {
    await this.ensureInitialized();
    return this.warehouses.get(id);
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = this.warehouses.delete(id);
    if (result) {
      await this.saveWarehouses();
    }
    return result;
  }
}

export class MemStorage implements IStorage {
  private components: Map<string, Component>;
  private users: Map<string, any>;
  private groups: Map<string, any>;
  private warehouses: Map<string, any>;

  constructor() {
    this.components = new Map();
    this.users = new Map();
    this.groups = new Map();
    this.warehouses = new Map();
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private async initializeSampleData(): Promise<void> {
    const sampleComponents: InsertComponent[] = [
      {
        name: "ATmega328P-PU",
        category: "Integrated Circuits",
        quantity: 45,
        location: "A1-B3",
        description: "8-bit AVR Microcontroller",
        minStockLevel: 10
      },
      {
        name: "470µF Electrolytic",
        category: "Capacitors",
        quantity: 8,
        location: "C2-A1", 
        description: "25V Radial Electrolytic Capacitor",
        minStockLevel: 20
      },
      {
        name: "10kΩ Resistor",
        category: "Resistors",
        quantity: 250,
        location: "R1-A5",
        description: "1/4W Carbon Film Resistor",
        minStockLevel: 50
      },
      {
        name: "2N3904 NPN",
        category: "Transistors", 
        quantity: 0,
        location: "T1-C2",
        description: "General Purpose NPN Transistor",
        minStockLevel: 15
      },
      {
        name: "1N4148 Diode",
        category: "Diodes",
        quantity: 5,
        location: "D1-A2",
        description: "High-speed switching diode",
        minStockLevel: 25
      }
    ];

    for (const comp of sampleComponents) {
      const id = randomUUID();
      const component: Component = { 
        id,
        name: comp.name,
        category: comp.category,
        quantity: comp.quantity ?? 0,
        location: comp.location,
        description: comp.description,
        minStockLevel: comp.minStockLevel ?? 10,
        ownerId: "admin",
        groupIds: [],
        warehouseId: "admin-default",
        warehouseType: "personal",
        warehouseGroupId: null,
      };
      this.components.set(id, component);
    }
    this.warehouses.set("admin-default", { id: "admin-default", name: "Admin Warehouse", ownerId: "admin", groupIds: [], type: "personal", warehouseGroupId: null });
  }

  async getComponents(): Promise<Component[]> {
    return Array.from(this.components.values());
  }

  async getComponent(id: string): Promise<Component | undefined> {
    return this.components.get(id);
  }

  async createComponent(insertComponent: InsertComponent): Promise<Component> {
    const id = randomUUID();
    const component: Component = { 
      id,
      name: insertComponent.name,
      category: insertComponent.category,
      quantity: insertComponent.quantity ?? 0,
      location: insertComponent.location,
      description: insertComponent.description,
      minStockLevel: insertComponent.minStockLevel ?? 10,
      ownerId: (insertComponent as any).ownerId ?? "admin",
      groupIds: (insertComponent as any).groupIds ?? [],
      warehouseId: (insertComponent as any).warehouseId ?? "admin-default",
      warehouseType: (insertComponent as any).warehouseType ?? "personal",
      warehouseGroupId: (insertComponent as any).warehouseGroupId ?? null,
    };
    this.components.set(id, component);
    return component;
  }

  async updateComponent(id: string, updates: UpdateComponent): Promise<Component | undefined> {
    const existing = this.components.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.components.set(id, updated);
    return updated;
  }

  async deleteComponent(id: string): Promise<boolean> {
    return this.components.delete(id);
  }

  async searchComponents(query: string): Promise<Component[]> {
    const components = Array.from(this.components.values());
    const lowerQuery = query.toLowerCase();
    
    return components.filter(component =>
      component.name.toLowerCase().includes(lowerQuery) ||
      component.description.toLowerCase().includes(lowerQuery) ||
      component.category.toLowerCase().includes(lowerQuery) ||
      component.location.toLowerCase().includes(lowerQuery)
    );
  }

  async getComponentsByCategory(category: string): Promise<Component[]> {
    const components = Array.from(this.components.values());
    return components.filter(component => component.category === category);
  }

  async getLowStockComponents(): Promise<Component[]> {
    const components = Array.from(this.components.values());
    return components.filter(component => component.quantity <= component.minStockLevel);
  }

  // User operations (existing)
  async getUser(id: string): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = randomUUID();
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async listUsers(): Promise<any[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, updates: any): Promise<any | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async listGroups(): Promise<any[]> {
    return Array.from(this.groups.values());
  }

  async createGroup(group: any): Promise<any> {
    const id = randomUUID();
    const newGroup = { ...group, id };
    this.groups.set(id, newGroup);
    return newGroup;
  }

  async updateGroup(id: string, updates: any): Promise<any | undefined> {
    const existing = this.groups.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.groups.set(id, updated);
    return updated;
  }

  async deleteGroup(id: string): Promise<boolean> {
    return this.groups.delete(id);
  }

  async listWarehouses(): Promise<any[]> {
    return Array.from(this.warehouses.values());
  }

  async createWarehouse(warehouse: any): Promise<any> {
    const id = warehouse.id ?? randomUUID();
    const newWarehouse = { ...warehouse, id };
    this.warehouses.set(id, newWarehouse);
    return newWarehouse;
  }

  async updateWarehouse(id: string, updates: any): Promise<any | undefined> {
    const existing = this.warehouses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.warehouses.set(id, updated);
    return updated;
  }

  async getWarehouse(id: string): Promise<any | undefined> {
    return this.warehouses.get(id);
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    return this.warehouses.delete(id);
  }
}

export const storage = new FileStorage();
