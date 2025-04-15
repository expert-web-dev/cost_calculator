import { pgTable, text, serial, integer, boolean, date, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User schema (keeping this as it's in the original file)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define relations after all tables are defined

// Moving calculation schemas
export const movingEstimates = pgTable("moving_estimates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Optional reference to user
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  distance: integer("distance").notNull(),
  homeSize: text("home_size").notNull(), // 'studio', '1bedroom', '2bedroom', '3bedroom'
  additionalItems: text("additional_items").default("none"),
  moveDate: text("move_date").notNull(),
  flexibility: text("flexibility").default("exact"),
  services: json("services").$type<string[]>().default([]),
  costDiy: integer("cost_diy").notNull(),
  costHybrid: integer("cost_hybrid").notNull(),
  costFullService: integer("cost_full_service").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Zod schema for address validation
export const addressSchema = z.object({
  address: z.string().min(5, "Please enter a valid address"),
  city: z.string().min(2, "Please enter a valid city"),
  state: z.string().min(2, "Please enter a valid state"),
  zipCode: z.string().min(5, "Please enter a valid zip code"),
});

export type Address = z.infer<typeof addressSchema>;

// Zod schema for the calculation request
export const moveCalculationRequestSchema = z.object({
  origin: z.string().min(5, "Origin address is required"),
  destination: z.string().min(5, "Destination address is required"),
  homeSize: z.enum(["studio", "1bedroom", "2bedroom", "3bedroom"], {
    errorMap: () => ({ message: "Please select a home size" }),
  }),
  additionalItems: z.enum(["none", "piano", "artwork", "gym", "multiple"]).default("none"),
  moveDate: z.string().min(1, "Move date is required"),
  flexibility: z.enum(["exact", "1-2days", "1week", "flexible"]).default("exact"),
  services: z.array(z.enum(["packing", "storage", "cleaning"])).default([]),
});

export type MoveCalculationRequest = z.infer<typeof moveCalculationRequestSchema>;

export const moveCalculationResponseSchema = z.object({
  distance: z.number(),
  origin: z.string(),
  destination: z.string(),
  homeSize: z.string(),
  moveDate: z.string(),
  costs: z.object({
    diy: z.number(),
    hybrid: z.number(),
    fullService: z.number(),
  }),
  breakdown: z.object({
    transportation: z.number(),
    labor: z.number(),
    materials: z.number(),
    other: z.number(),
  }),
  companies: z.array(
    z.object({
      name: z.string(),
      rating: z.number(),
      description: z.string(),
      available: z.boolean(),
    })
  ),
});

export type MoveCalculationResponse = z.infer<typeof moveCalculationResponseSchema>;

export const insertMoveEstimateSchema = createInsertSchema(movingEstimates).omit({
  id: true,
  createdAt: true,
});

export type InsertMoveEstimate = z.infer<typeof insertMoveEstimateSchema>;
export type MoveEstimate = typeof movingEstimates.$inferSelect;

// Define table relationships
export const usersRelations = relations(users, ({ many }) => ({
  estimates: many(movingEstimates),
}));

export const movingEstimatesRelations = relations(movingEstimates, ({ one }) => ({
  user: one(users, {
    fields: [movingEstimates.userId],
    references: [users.id],
  }),
}));

// Moving checklist schema
export const movingChecklists = pgTable("moving_checklists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  estimateId: integer("estimate_id").references(() => movingEstimates.id),
  moveDate: text("move_date").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export type MoveChecklist = typeof movingChecklists.$inferSelect;
export type InsertMoveChecklist = z.infer<typeof insertMoveChecklistSchema>;

// Moving checklist item schema
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  checklistId: integer("checklist_id").references(() => movingChecklists.id).notNull(),
  task: text("task").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  timeframe: text("timeframe").notNull(), // e.g., "8-weeks", "4-weeks", "2-weeks", "1-week", "moving-day", "after-move"
  completed: boolean("completed").default(false).notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;

// Schema for inserting a new moving checklist
export const insertMoveChecklistSchema = createInsertSchema(movingChecklists).omit({
  id: true,
  createdAt: true,
});

// Schema for inserting a new checklist item
export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({
  id: true,
  createdAt: true,
});

// Relations 
export const movingChecklistsRelations = relations(movingChecklists, ({ one, many }) => ({
  user: one(users, {
    fields: [movingChecklists.userId],
    references: [users.id],
  }),
  estimate: one(movingEstimates, {
    fields: [movingChecklists.estimateId],
    references: [movingEstimates.id],
  }),
  items: many(checklistItems),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  checklist: one(movingChecklists, {
    fields: [checklistItems.checklistId],
    references: [movingChecklists.id],
  }),
}));

// User progress for gamification
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  achievements: text("achievements").array().notNull().default([]),
  streak: integer("streak").notNull().default(0),
  lastInteraction: text("last_interaction").notNull().default(new Date().toISOString()),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
});
