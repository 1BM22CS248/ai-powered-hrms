import { pgTable, pgEnum, uuid, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const aiFeatureEnum = pgEnum('ai_feature', [
  'navigation',
  'resume_screener',
  'performance_review',
  'attrition_risk',
])

export const aiLogs = pgTable('ai_logs', {
  id:            serial('id').primaryKey(),
  feature:       aiFeatureEnum('feature').notNull(),
  triggeredBy:   uuid('triggered_by').notNull(),
  inputSummary:  text('input_summary'),
  outputSummary: text('output_summary'),
  latencyMs:     integer('latency_ms'),
  createdAt:     timestamp('created_at').defaultNow(),
})

export type AiLog    = typeof aiLogs.$inferSelect
export type NewAiLog = typeof aiLogs.$inferInsert
