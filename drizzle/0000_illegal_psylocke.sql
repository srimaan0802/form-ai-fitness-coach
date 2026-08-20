CREATE TABLE `workouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_key` text NOT NULL,
	`name` text DEFAULT 'Lower body strength' NOT NULL,
	`muscle_group` text DEFAULT 'Legs' NOT NULL,
	`exercises` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`completed_sets` integer DEFAULT 0 NOT NULL,
	`total_sets` integer DEFAULT 0 NOT NULL,
	`volume` integer DEFAULT 0 NOT NULL,
	`workout_date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workouts_workout_key_unique` ON `workouts` (`workout_key`);