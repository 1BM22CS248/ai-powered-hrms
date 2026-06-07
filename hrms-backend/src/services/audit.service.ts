import { db } from '../db/client'
import { auditLogs } from '../db/schema'

export async function logAudit(params: {
  actor: string
  action: string
  entityType: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
  ip?: string
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actor:      params.actor,
      action:     params.action,
      entityType: params.entityType,
      entityId:   String(params.entityId),
      oldValue:   params.oldValue != null ? JSON.stringify(params.oldValue) : null,
      newValue:   params.newValue != null ? JSON.stringify(params.newValue) : null,
      ip:         params.ip,
    })
  } catch (err) {
    // Audit log failures must NEVER break the main operation
    console.error('[audit] Failed to write audit log:', err)
  }
}
