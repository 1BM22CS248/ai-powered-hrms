import {
  pgTable, pgEnum, uuid, varchar, text, integer, timestamp,
} from 'drizzle-orm/pg-core'

export const jobTypeEnum      = pgEnum('job_type',       ['full-time', 'part-time', 'contract'])
export const jobStatusEnum    = pgEnum('job_status',     ['open', 'closed', 'on-hold'])
export const candidateStatusEnum = pgEnum('candidate_status', [
  'applied', 'screening', 'interview', 'offer', 'hired', 'rejected',
])

export const jobPostings = pgTable('job_postings', {
  id:          uuid('id').primaryKey().defaultRandom(),
  title:       varchar('title', { length: 200 }).notNull(),
  department:  varchar('department', { length: 100 }),
  location:    varchar('location', { length: 100 }),
  type:        jobTypeEnum('type').notNull().default('full-time'),
  experience:  varchar('experience', { length: 100 }),
  description: text('description'),
  status:      jobStatusEnum('status').notNull().default('open'),
  openings:    integer('openings').notNull().default(1),
  createdAt:   timestamp('created_at').defaultNow(),
})

export const candidates = pgTable('candidates', {
  id:               uuid('id').primaryKey().defaultRandom(),
  jobId:            uuid('job_id').notNull().references(() => jobPostings.id),
  firstName:        varchar('first_name', { length: 100 }).notNull(),
  lastName:         varchar('last_name', { length: 100 }).notNull(),
  email:            varchar('email', { length: 150 }).notNull(),
  phone:            varchar('phone', { length: 15 }),
  resumeText:       text('resume_text').notNull().default(''),
  resumeUrl:        varchar('resume_url', { length: 500 }),
  aiScore:          integer('ai_score'),
  aiStrengths:      text('ai_strengths'),      // JSON array as text
  aiGaps:           text('ai_gaps'),           // JSON array as text
  aiRecommendation: text('ai_recommendation'),
  status:           candidateStatusEnum('status').notNull().default('applied'),
  appliedAt:        timestamp('applied_at').defaultNow(),
})

export type JobPosting    = typeof jobPostings.$inferSelect
export type NewJobPosting = typeof jobPostings.$inferInsert
export type Candidate     = typeof candidates.$inferSelect
export type NewCandidate  = typeof candidates.$inferInsert
