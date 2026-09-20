CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`details` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_created_at` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact_name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_clients_name` ON `clients` (`name`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`visit_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`object_key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text DEFAULT 'application/pdf' NOT NULL,
	`size` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_documents_visit_version` ON `documents` (`visit_id`,`version`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`contact_name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`access_notes` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_locations_client_id` ON `locations` (`client_id`);--> statement-breakpoint
CREATE TABLE `machine_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_type` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`location_id` text NOT NULL,
	`work_order_id` text NOT NULL,
	`existing_machine_id` text,
	`proposed_code` text NOT NULL,
	`proposed_type` text NOT NULL,
	`proposed_brand` text DEFAULT '' NOT NULL,
	`proposed_model` text DEFAULT '' NOT NULL,
	`proposed_serial_number` text DEFAULT '' NOT NULL,
	`proposed_internal_location` text DEFAULT '' NOT NULL,
	`proposed_installation_date` text,
	`proposed_notes` text DEFAULT '' NOT NULL,
	`proposed_photo_object_key` text,
	`proposed_by_id` text NOT NULL,
	`reviewed_by_id` text,
	`review_notes` text,
	`reviewed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`existing_machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`proposed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_machine_proposals_status` ON `machine_proposals` (`status`);--> statement-breakpoint
CREATE INDEX `idx_machine_proposals_order_id` ON `machine_proposals` (`work_order_id`);--> statement-breakpoint
CREATE TABLE `machines` (
	`id` text PRIMARY KEY NOT NULL,
	`location_id` text NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`serial_number` text DEFAULT '' NOT NULL,
	`internal_location` text DEFAULT '' NOT NULL,
	`installation_date` text,
	`photo_object_key` text,
	`notes` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_machines_location_code` ON `machines` (`location_id`,`code`);--> statement-breakpoint
CREATE INDEX `idx_machines_serial_number` ON `machines` (`serial_number`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`object_key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `visit_machine_reports`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_photos_report_id` ON `photos` (`report_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`password_hash` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `visit_machine_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`visit_id` text NOT NULL,
	`machine_id` text,
	`proposal_id` text,
	`problem_found` text DEFAULT '' NOT NULL,
	`work_performed` text DEFAULT '' NOT NULL,
	`actions_taken` text DEFAULT '' NOT NULL,
	`parts_replaced` text DEFAULT '' NOT NULL,
	`observations` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`proposal_id`) REFERENCES `machine_proposals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_visit_reports_visit_id` ON `visit_machine_reports` (`visit_id`);--> statement-breakpoint
CREATE INDEX `idx_visit_reports_machine_id` ON `visit_machine_reports` (`machine_id`);--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`technician_id` text NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`outcome` text DEFAULT 'DRAFT' NOT NULL,
	`general_notes` text DEFAULT '' NOT NULL,
	`signer_name` text,
	`signature_object_key` text,
	`signed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`technician_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_visits_order_sequence` ON `visits` (`work_order_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `idx_visits_work_order_id` ON `visits` (`work_order_id`);--> statement-breakpoint
CREATE TABLE `work_order_machines` (
	`work_order_id` text NOT NULL,
	`machine_id` text NOT NULL,
	PRIMARY KEY(`work_order_id`, `machine_id`),
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_work_order_machines_machine_id` ON `work_order_machines` (`machine_id`);--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`client_id` text NOT NULL,
	`location_id` text NOT NULL,
	`type` text NOT NULL,
	`reported_issue` text NOT NULL,
	`scheduled_date` text,
	`time_slot` text,
	`assigned_technician_id` text,
	`status` text DEFAULT 'REGISTERED' NOT NULL,
	`office_notes` text DEFAULT '' NOT NULL,
	`reopened_reason` text,
	`created_by_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_technician_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_work_orders_number` ON `work_orders` (`number`);--> statement-breakpoint
CREATE INDEX `idx_work_orders_technician_status` ON `work_orders` (`assigned_technician_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_work_orders_date_status` ON `work_orders` (`scheduled_date`,`status`);--> statement-breakpoint
CREATE INDEX `idx_work_orders_client_id` ON `work_orders` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_work_orders_location_id` ON `work_orders` (`location_id`);