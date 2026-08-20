import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutKey: text("workout_key").notNull().unique(),
  name: text("name").notNull().default("Lower body strength"),
  muscleGroup: text("muscle_group").notNull().default("Legs"),
  exercises: text("exercises").notNull(),
  status: text("status").notNull().default("active"),
  completedSets: integer("completed_sets").notNull().default(0),
  totalSets: integer("total_sets").notNull().default(0),
  volume: integer("volume").notNull().default(0),
  workoutDate: text("workout_date").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
