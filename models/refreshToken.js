import mongoose from 'mongoose'

const refreshTokenSchema = mongoose.Schema({
  // TODO: add expiration date for auto logging out
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  issuedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
})

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema)
