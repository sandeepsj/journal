import mongoose from 'mongoose'

// Cache the promise so concurrent calls await the same connection attempt
declare global {
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | null
}

let cachedPromise: Promise<typeof mongoose> | null = global._mongoosePromise ?? null

export async function connectDB(): Promise<typeof mongoose> {
  if (cachedPromise) return cachedPromise

  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is not defined')

  cachedPromise = mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  })

  global._mongoosePromise = cachedPromise
  return cachedPromise
}
