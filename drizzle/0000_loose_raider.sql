CREATE TABLE `budget` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text,
	`wallet_id` text,
	`limit_centavos` integer NOT NULL,
	`period` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`carry_over` integer DEFAULT false NOT NULL,
	`last_notified_threshold` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallet`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ck_budget_limit_positive" CHECK("budget"."limit_centavos" > 0),
	CONSTRAINT "ck_budget_threshold" CHECK("budget"."last_notified_threshold" IN (0, 75, 90, 100))
);
--> statement-breakpoint
CREATE INDEX `ix_budget_user` ON `budget` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_budget_wallet_category` ON `budget` (`user_id`,`category_id`,`wallet_id`,`period`) WHERE "budget"."wallet_id" IS NOT NULL AND "budget"."category_id" IS NOT NULL AND "budget"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_budget_wallet` ON `budget` (`user_id`,`wallet_id`,`period`) WHERE "budget"."wallet_id" IS NOT NULL AND "budget"."category_id" IS NULL AND "budget"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_budget_category` ON `budget` (`user_id`,`category_id`,`period`) WHERE "budget"."wallet_id" IS NULL AND "budget"."category_id" IS NOT NULL AND "budget"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_budget_global` ON `budget` (`user_id`,`period`) WHERE "budget"."wallet_id" IS NULL AND "budget"."category_id" IS NULL AND "budget"."deleted_at" IS NULL;--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT 'pricetag' NOT NULL,
	`color` text DEFAULT '#5F736C' NOT NULL,
	`type` text NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_category_user_type` ON `category` (`user_id`,`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_category_name` ON `category` (`user_id`,`type`,`name`) WHERE "category"."deleted_at" IS NULL;--> statement-breakpoint
CREATE TABLE `pledge` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`wallet_id` text NOT NULL,
	`donor_name` text NOT NULL,
	`purpose` text,
	`pledged_centavos` integer NOT NULL,
	`due_date` text,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallet`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ck_pledge_amount_positive" CHECK("pledge"."pledged_centavos" > 0)
);
--> statement-breakpoint
CREATE INDEX `ix_pledge_user` ON `pledge` (`user_id`);--> statement-breakpoint
CREATE TABLE `recurring_rule` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`wallet_id` text NOT NULL,
	`category_id` text,
	`type` text NOT NULL,
	`amount_centavos` integer NOT NULL,
	`description` text,
	`note` text,
	`frequency` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`next_occurrence` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallet`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ck_recurring_amount_positive" CHECK("recurring_rule"."amount_centavos" > 0)
);
--> statement-breakpoint
CREATE INDEX `ix_recurring_user_active` ON `recurring_rule` (`user_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`biometric_enabled` integer DEFAULT false NOT NULL,
	`theme` text DEFAULT 'light' NOT NULL,
	`locale` text DEFAULT 'en-PH' NOT NULL,
	`last_backup_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`wallet_id` text NOT NULL,
	`category_id` text,
	`type` text NOT NULL,
	`amount_centavos` integer NOT NULL,
	`occurred_on` text NOT NULL,
	`description` text,
	`note` text,
	`transfer_id` text,
	`recurring_id` text,
	`recurrence_occurrence` text,
	`pledge_id` text,
	`donor_name` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallet`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transfer_id`) REFERENCES `transfer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recurring_id`) REFERENCES `recurring_rule`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`pledge_id`) REFERENCES `pledge`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ck_txn_amount_positive" CHECK("transaction"."amount_centavos" > 0),
	CONSTRAINT "ck_txn_occurred_on_format" CHECK("transaction"."occurred_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE INDEX `ix_txn_user_date` ON `transaction` (`user_id`,`occurred_on`);--> statement-breakpoint
CREATE INDEX `ix_txn_wallet_date` ON `transaction` (`user_id`,`wallet_id`,`occurred_on`);--> statement-breakpoint
CREATE INDEX `ix_txn_category_date` ON `transaction` (`user_id`,`category_id`,`occurred_on`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_txn_recurrence_occurrence` ON `transaction` (`recurring_id`,`recurrence_occurrence`) WHERE "transaction"."recurring_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_txn_transfer_leg` ON `transaction` (`transfer_id`,`type`) WHERE "transaction"."transfer_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `ix_txn_pledge` ON `transaction` (`pledge_id`) WHERE "transaction"."pledge_id" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `transfer` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`from_wallet_id` text NOT NULL,
	`to_wallet_id` text NOT NULL,
	`amount_centavos` integer NOT NULL,
	`occurred_on` text NOT NULL,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_wallet_id`) REFERENCES `wallet`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_wallet_id`) REFERENCES `wallet`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ck_transfer_amount_positive" CHECK("transfer"."amount_centavos" > 0),
	CONSTRAINT "ck_transfer_distinct_wallets" CHECK("transfer"."from_wallet_id" <> "transfer"."to_wallet_id")
);
--> statement-breakpoint
CREATE INDEX `ix_transfer_user_date` ON `transfer` (`user_id`,`occurred_on`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`avatar_uri` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_user_email` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `wallet` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT 'wallet' NOT NULL,
	`color` text DEFAULT '#0E6B57' NOT NULL,
	`opening_balance_centavos` integer DEFAULT 0 NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_wallet_user` ON `wallet` (`user_id`);