DO $$ BEGIN
 CREATE TYPE "public"."ai_feature" AS ENUM('navigation', 'resume_screener', 'performance_review', 'attrition_risk');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature" "ai_feature" NOT NULL,
	"triggered_by" uuid NOT NULL,
	"input_summary" text,
	"output_summary" text,
	"latency_ms" integer,
	"created_at" timestamp DEFAULT now()
);
