import mongoose, { Schema, model, models } from 'mongoose'

export interface IUser {
  _id: mongoose.Types.ObjectId
  email: string
  name: string
  image: string
  googleId: string
  createdAt: Date
  lastLoginAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    googleId: { type: String, required: true, unique: true },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const User = models.User ?? model<IUser>('User', UserSchema)
