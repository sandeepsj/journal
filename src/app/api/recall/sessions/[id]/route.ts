import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { ChatSession } from '@/lib/db/models/ChatSession'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id } = await params

    await connectDB()

    const chatSession = await ChatSession.findOne({
      _id: id,
      userId: session.user.id,
    }).lean()

    if (!chatSession) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(chatSession)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id } = await params

    await connectDB()

    const result = await ChatSession.deleteOne({
      _id: id,
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
