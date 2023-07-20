import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { User } from './models/user.js'
import dotenv from 'dotenv'
import { RefreshToken } from './models/refreshToken.js'
dotenv.config()

const app = express()

app.use(express.json())
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Connected to mongoose'))
  .catch((e) => console.log(e.message))

app.post('/signup', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword
    })
    await user.save()
    res.sendStatus(201)
  } catch {
    res.status(400).json({ message: 'error while creating user, change your username or email' })
  }
})

app.post('/login', loginUser, async (req, res) => {
  const userId = req.userId
  const accessToken = generateAccessToken({ userId })
  const refreshToken = new RefreshToken({
    userId,
    token: jwt.sign(userId, process.env.REFRESH_TOKEN_SECRET)
  })
  try {
    await refreshToken.save()
    res.status(200).json({
      message: 'successfully logged in, save your refreshToken somewhere secure',
      accessToken,
      refreshToken
    })
  } catch {
    if (RefreshToken.findOne({ token: refreshToken })) {
      res.status(200).json({
        message: "you're already logged in, here's your refreshToken",
        refreshToken: refreshToken.token
      })
    } else {
      res.sendStatus(500)
    }
  }
})

app.post('/refresh-token', (req, res) => {
  const refreshToken = req.body.refreshToken
  if (refreshToken == null) res.sendStatus(401)
  if (!RefreshToken.findOne({ token: refreshToken })) return res.sendStatus(403)
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    const accessToken = generateAccessToken({ userId: user.userId })
    res.json({ accessToken })
  })
})

app.delete('/logout', (req, res) => {
  RefreshToken.deleteOne()
  res.sendStatus(204)
})

// TEST: list all users
app.get('/all', async (req, res) => {
  res.json(await User.find())
})

// TEST: list all tokens
app.get('/alltokens', async (req, res) => {
  res.json(await RefreshToken.find())
})

function generateAccessToken (user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '2m'
  })
}

async function loginUser (req, res, next) {
  const user = await User.findOne({ email: req.body.email })
  if (user == null) { return res.status(400).json({ message: 'cannot find user' }) }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      req.userId = user.id
      next()
    } else {
      res.status(403).json({ message: 'wrong password' })
    }
  } catch {
    res.sendStatus(500)
  }
}

app.listen(4000)
