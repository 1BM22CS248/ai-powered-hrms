DO $$ BEGIN
 CREATE TYPE "public"."onboarding_category" AS ENUM('documents', 'setup', 'training', 'introduction');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'on-leave' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'emp_status')) THEN
    ALTER TYPE "emp_status" ADD VALUE 'on-leave';
  END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category" "onboarding_category" NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"due_date" date NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
