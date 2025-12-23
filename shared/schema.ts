import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const components = pgTable("components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  location: text("location").notNull(),
  description: text("description").notNull(),
  minStockLevel: integer("min_stock_level").notNull().default(10),
  ownerId: text("owner_id"),
  groupIds: jsonb("group_ids").$type<string[]>().default(sql`'[]'::jsonb`),
  warehouseId: text("warehouse_id").notNull().default(sql`'default'`),
  warehouseType: text("warehouse_type").default("personal"),
  warehouseGroupId: text("warehouse_group_id"),
});

export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull(),
  groupIds: jsonb("group_ids").$type<string[]>().default(sql`'[]'::jsonb`),
  type: text("type").notNull().default("personal"), // personal | group
});

export const insertComponentSchema = createInsertSchema(components).omit({
  id: true,
  ownerId: true,
  groupIds: true,
  warehouseId: true,
  warehouseType: true,
  warehouseGroupId: true,
}).extend({
  quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
  minStockLevel: z.number().int().min(0, "Minimum stock level must be 0 or greater")
});

export const updateComponentSchema = insertComponentSchema.partial();

export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type UpdateComponent = z.infer<typeof updateComponentSchema>;
export type Component = typeof components.$inferSelect;

export const COMPONENT_CATEGORIES = [
  "Resistors",
  "Capacitors", 
  "Integrated Circuits",
  "Transistors",
  "Diodes",
  "Connectors",
  "Inductors",
  "Switches",
  "Sensors",
  "Other"
] as const;

export type ComponentCategory = typeof COMPONENT_CATEGORIES[number];
