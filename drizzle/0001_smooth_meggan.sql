CREATE TABLE `profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_key` text DEFAULT 'primary' NOT NULL,
	`name` text NOT NULL,
	`level` text DEFAULT 'Intermediate' NOT NULL,
	`goal` text DEFAULT 'Build strength' NOT NULL,
	`units` text DEFAULT 'lb' NOT NULL,
	`weekly_days` integer DEFAULT 4 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_profile_key_unique` ON `profiles` (`profile_key`);