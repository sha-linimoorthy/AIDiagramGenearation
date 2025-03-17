import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Chart related schemas
export const charts = pgTable("charts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "gantt", "bar", "pie", etc.
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertChartSchema = createInsertSchema(charts).pick({
  title: true,
  type: true,
  data: true,
  userId: true,
});

export type InsertChart = z.infer<typeof insertChartSchema>;
export type Chart = typeof charts.$inferSelect;

// Schema for task in Gantt chart
export const taskSchema = z.object({
  id: z.number(),
  name: z.string(),
  start: z.string(), // date string format: YYYY-MM-DD
  end: z.string(), // date string format: YYYY-MM-DD
  dependencies: z.array(z.number()).optional(),
  category: z.string().optional(),
});

export type Task = z.infer<typeof taskSchema>;

// Schema for Gantt chart data
export const ganttChartDataSchema = z.object({
  title: z.string(),
  tasks: z.array(taskSchema),
});

export type GanttChartData = z.infer<typeof ganttChartDataSchema>;

// Schema for bar chart data entry
export const barChartDataPointSchema = z.object({
  label: z.string(),
  value: z.number(),
  category: z.string().optional(),
});

export type BarChartDataPoint = z.infer<typeof barChartDataPointSchema>;

// Schema for bar chart data
export const barChartDataSchema = z.object({
  title: z.string(),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  data: z.array(barChartDataPointSchema),
});

export type BarChartData = z.infer<typeof barChartDataSchema>;

// Schema for pie chart data entry
export const pieChartDataPointSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
});

export type PieChartDataPoint = z.infer<typeof pieChartDataPointSchema>;

// Schema for pie chart data
export const pieChartDataSchema = z.object({
  title: z.string(),
  data: z.array(pieChartDataPointSchema),
});

export type PieChartData = z.infer<typeof pieChartDataSchema>;

// Union of all chart data types
export const chartDataSchema = z.union([
  ganttChartDataSchema,
  barChartDataSchema,
  pieChartDataSchema,
]);

export type ChartData = 
  | GanttChartData 
  | BarChartData 
  | PieChartData;

// Gemini API request schema
export const geminiRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  chartType: z.enum(["gantt", "bar", "pie", "line", "flow"]).default("gantt"),
});

export type GeminiRequest = z.infer<typeof geminiRequestSchema>;
