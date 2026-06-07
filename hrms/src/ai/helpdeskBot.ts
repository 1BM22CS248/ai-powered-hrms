import { callLLM } from './client'
import { HELPDESK_BOT_PROMPT } from './prompts'
import type { SupportTicket } from '../data/types'

export async function getHelpdeskReply(ticket: SupportTicket): Promise<string> {
  try {
    const reply = await callLLM(HELPDESK_BOT_PROMPT(ticket.subject, ticket.description, ticket.category))
    return reply.trim()
  } catch (err) {
    console.error('[helpdeskBot]', err)
    return ''
  }
}
