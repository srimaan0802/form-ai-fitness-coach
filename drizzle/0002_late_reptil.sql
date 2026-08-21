CREATE TABLE `training_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_key` text DEFAULT 'primary' NOT NULL,
	`name` text DEFAULT 'My training split' NOT NULL,
	`days` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `training_plans_plan_key_unique` ON `training_plans` (`plan_key`);