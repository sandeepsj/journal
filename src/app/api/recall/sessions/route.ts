import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { ChatSession } from '@/lib/db/models/ChatSession'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const sessions = await ChatSession.find({ userId: session.user.id })
      .select('_id title updatedAt')
      .sort({ updatedAt: -1 })
      .lean()

    return NextResponse.json(sessions)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const body = await request.json()
    const title = body.title || 'New Chat'

    const chatSession = await ChatSession.create({
      userId: session.user.id,
      title,
      messages: [],
    })

    return NextResponse.json(chatSession)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
