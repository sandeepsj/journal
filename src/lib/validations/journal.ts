import { z } from 'zod'

export const createJournalSchema = z.object({
  title: z.string().max(300, 'Title too long').optional().default(''),
  body: z.string().min(1, 'Entry cannot be empty').max(50000, 'Entry too long'),
  mood: z.enum(['calm', 'happy', 'anxious', 'sad', 'grateful']).nullable().optional(),
})

export const updateJournalSchema = createJournalSchema.partial()

export const recallQuerySchema = z.object({
  query: z.string().min(3, 'Query too short').max(500, 'Query too long'),
})

export type CreateJournalInput = z.infer<typeof createJournalSchema>
export type UpdateJournalInput = z.infer<typeof updateJournalSchema>
export type RecallQueryInput = z.infer<typeof recallQuerySchema>
