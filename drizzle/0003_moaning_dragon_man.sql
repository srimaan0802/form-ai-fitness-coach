ALTER TABLE `training_plans` ADD `profile_id` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `workouts` ADD `profile_id` integer DEFAULT 1 NOT NULL;