import express from 'express'
import jwt from 'jsonwebtoken'
import('dotenv').then((dotenv) => dotenv.config())
const app = express()

app.use(express.json())

const posts = [
  {
    username: 'kofta',
    title: 'zbyghfhh'
  },
  {
    username: 'Kyle',
    title: 'post1'
  },
  {
    username: 'Kayle',
    title: 'post2'
  }
]

app.get('/posts', authenticateToken, (req, res) => {
  res.json(posts.filter((post) => post.username === req.user.username))
})

function authenticateToken (req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

app.listen(3000)
