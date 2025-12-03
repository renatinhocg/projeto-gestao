import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import multer from 'multer'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'

const app = express()
const port = process.env.PORT || 4000
const prisma = new PrismaClient()

// Manual CORS headers - robust configuration
app.use((req, res, next) => {
  const origin = req.headers.origin

  // Log for debugging
  console.log(`🔍 Request: ${req.method} ${req.path} | Origin: ${origin || 'undefined'}`)

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Range')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  next()
})

app.use(express.json({ limit: '5mb' }))

const UPLOADS_DIR = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR)
}
app.use('/uploads', express.static(UPLOADS_DIR))

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
    : undefined,
  endpoint: process.env.AWS_S3_ENDPOINT || undefined
})

// Multer setup for handling multipart/form-data in memory
const upload = multer({ storage: multer.memoryStorage() })

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Middleware: authenticate JWT
function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'missing authorization' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'malformed token' })
  const token = parts[1]
  try {
    const payload: any = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' })
  }
}

// Middleware: require admin
async function adminOnly(req: any, res: any, next: any) {
  try {
    const userId = req.user && req.user.sub
    if (!userId) return res.status(401).json({ error: 'missing user' })
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } })
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'forbidden' })
    next()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
}

// ==================== S3 & USER ENDPOINTS ====================

// Public: request presigned URL for direct upload to S3
app.post('/s3/presign', async (req, res) => {
  try {
    const { filename, contentType } = req.body
    if (!filename) return res.status(400).json({ error: 'filename is required' })

    const key = `${uuidv4()}-${filename}`
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType || 'application/octet-stream'
    })
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    console.log('[s3/presign] key=', key, 'publicUrl=', publicUrl)
    res.json({ url, key, publicUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to create presigned url' })
  }
})

// Public: upload file to S3 via server (avoids CORS)
app.post('/s3/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = (req as any).file
    if (!file) return res.status(400).json({ error: 'file is required' })

    const key = `${uuidv4()}-${file.originalname}`

    // Try S3 if configured
    if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID) {
      try {
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        })
        await s3Client.send(command)
        const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
        console.log('[POST /s3/upload] uploaded to S3 key=', key, 'publicUrl=', publicUrl)
        return res.json({ publicUrl })
      } catch (s3Err) {
        console.error('S3 upload failed, falling back to local:', s3Err)
      }
    }

    // Fallback to local
    const localPath = path.join(UPLOADS_DIR, key)
    fs.writeFileSync(localPath, file.buffer)
    const protocol = req.protocol
    const host = req.get('host')
    const publicUrl = `${protocol}://${host}/uploads/${key}`
    console.log('[POST /s3/upload] uploaded to local key=', key, 'publicUrl=', publicUrl)
    res.json({ publicUrl })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'upload failed' })
  }
})

// New: upload via multer -> server uploads to S3 and updates user
app.post('/users/:id/photo', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const requesterId = Number(req.user?.sub)
    // only allow admin or owner
    if (!requesterId) return res.status(401).json({ error: 'unauthorized' })
    const requester = await prisma.user.findUnique({ where: { id: requesterId } })
    if (!requester) return res.status(401).json({ error: 'unauthorized' })
    if (!requester.isAdmin && requesterId !== id) return res.status(403).json({ error: 'forbidden' })

    const file = (req as any).file
    if (!file) return res.status(400).json({ error: 'file is required' })

    const key = `${uuidv4()}-${file.originalname}`
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    })
    await s3Client.send(command)
    const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    console.log('[POST /users/:id/photo] uploaded key=', key, 'publicUrl=', publicUrl)

    const user = await prisma.user.update({ where: { id }, data: { photoUrl: publicUrl } })
    console.log('[POST /users/:id/photo] updated user id=', user.id, 'photoUrl=', user.photoUrl)
    res.json({ publicUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'upload failed' })
  }
})

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, photoUrl } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'user already exists' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, photoUrl }
    })
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, photoUrl: user.photoUrl } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'register failed' })
  }
})

// Admin: create a user (without issuing token)
app.post('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, password, photoUrl, isAdmin } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'user already exists' })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { name, email, password: hashed, photoUrl, isAdmin: !!isAdmin } })
    console.log('[POST /users] created user id=', user.id, 'photoUrl=', photoUrl)
    res.status(201).json({ id: user.id, email: user.email, name: user.name, photoUrl: user.photoUrl, isAdmin: user.isAdmin })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'create failed' })
  }
})

// Admin: delete user
app.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.user.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'delete failed' })
  }
})

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'invalid credentials' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'invalid credentials' })

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, photoUrl: user.photoUrl } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'login failed' })
  }
})

// Protected: list users (admin)
app.get('/users', authMiddleware, adminOnly, async (req, res) => {
  // Support simple pagination used by react-admin's simple REST provider
  // react-admin typically sends `_start` and `_end` query params for ranges.
  const total = await prisma.user.count();
  const start = parseInt((req.query._start as string) || '0', 10) || 0;
  const end = parseInt((req.query._end as string) || String(start + 9), 10) || (start + 9);
  const take = Math.max(0, end - start + 1);

  const users = await prisma.user.findMany({
    skip: start,
    take,
    select: {
      id: true,
      email: true,
      name: true,
      photoUrl: true,
      isAdmin: true,
      createdAt: true,
      _count: {
        select: { assignedTasks: true }
      }
    },
    orderBy: { id: 'asc' },
  });

  // Expose Content-Range for CORS and set the header expected by react-admin
  // Format: <resource> <start>-<end>/<total>
  const contentRange = `users ${start}-${start + users.length - 1}/${total}`;
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
  res.setHeader('Content-Range', contentRange);

  res.json(users);
})

// Protected: list available assignees (all auth users)
app.get('/assignees', authMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, photoUrl: true },
      orderBy: { name: 'asc' }
    })
    res.set('Content-Range', `assignees 0-${users.length - 1}/${users.length}`)
    res.set('Access-Control-Expose-Headers', 'Content-Range')
    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to get assignees' })
  }
})

// Update user (admin or self)
app.put('/users/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const requesterId = Number(req.user?.sub)
    const requester = await prisma.user.findUnique({ where: { id: requesterId } })
    if (!requester) return res.status(401).json({ error: 'unauthorized' })

    // allow if admin or updating own profile
    if (!requester.isAdmin && requesterId !== id) return res.status(403).json({ error: 'forbidden' })

    const { name, email, password, photoUrl, isAdmin } = req.body
    console.log('[PUT /users/:id] Received request body:', { name, email, photoUrl: photoUrl || 'NOT PROVIDED', hasPassword: !!password })
    console.log('[PUT /users/:id] photoUrl type:', typeof photoUrl, 'value:', photoUrl)

    // Build data object with explicit field checks
    const data: any = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) data.email = email
    if (photoUrl !== undefined) {
      data.photoUrl = photoUrl
      console.log('[PUT /users/:id] Including photoUrl in update:', photoUrl)
    }
    if (req.body.oab !== undefined) data.oab = req.body.oab
    if (password) data.password = await bcrypt.hash(password, 10)
    // only admin can change isAdmin
    if (typeof isAdmin !== 'undefined' && requester.isAdmin) data.isAdmin = isAdmin

    console.log('[PUT /users/:id] Data object to be saved:', { ...data, password: data.password ? '[REDACTED]' : undefined })
    const user = await prisma.user.update({ where: { id }, data })
    console.log('[PUT /users/:id] RESULT - User saved with photoUrl:', user.photoUrl)
    res.json({ id: user.id, email: user.email, name: user.name, photoUrl: user.photoUrl, isAdmin: user.isAdmin, oab: user.oab })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'update failed' })
  }
})

// Get single user (admin or self)
app.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const requesterId = Number(req.user?.sub)
    const requester = await prisma.user.findUnique({ where: { id: requesterId } })
    if (!requester) return res.status(401).json({ error: 'unauthorized' })

    // allow if admin or requesting own record
    if (!requester.isAdmin && requesterId !== id) return res.status(403).json({ error: 'forbidden' })

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, photoUrl: true, isAdmin: true, createdAt: true, oab: true }
    })
    if (!user) return res.status(404).json({ error: 'not found' })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to get user' })
  }
})

// ==================== PROJECTS ====================

app.get('/projects', authMiddleware, async (req, res) => {
  try {
    const { _sort, _order } = req.query
    const projects = await prisma.project.findMany({
      include: {
        team: true,
        _count: { select: { tasks: true } }
      },
      orderBy: {
        [(_sort as string) || 'createdAt']: (_order as string)?.toLowerCase() || 'desc'
      }
    })
    res.header('X-Total-Count', projects.length.toString())
    res.json(projects)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

app.get('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { team: true }
    })
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

app.post('/projects', authMiddleware, async (req, res) => {
  try {
    const { name, description, dueDate, teamId } = req.body
    const project = await prisma.project.create({
      data: {
        name,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId: teamId ? parseInt(teamId) : null
      }
    })
    res.json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

app.put('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, dueDate, teamId } = req.body
    const project = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId: teamId ? parseInt(teamId) : null
      }
    })
    res.json(project)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' })
  }
})

app.delete('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id)
    await prisma.task.deleteMany({ where: { projectId } })
    await prisma.column.deleteMany({ where: { projectId } })
    await prisma.project.delete({ where: { id: projectId } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

// ==================== COLUMNS ====================

app.get('/columns', authMiddleware, async (req, res) => {
  try {
    const { projectId, filter } = req.query
    console.log('[GET /columns] Query:', req.query)
    let where: any = {}
    if (projectId) {
      where.projectId = parseInt(projectId as string)
    } else if (filter) {
      try {
        const parsed = JSON.parse(filter as string)
        if (parsed.projectId) where.projectId = parseInt(parsed.projectId)
      } catch (e) {
        console.error('Failed to parse filter', e)
      }
    }
    console.log('[GET /columns] Where:', where)
    const columns = await prisma.column.findMany({
      where,
      orderBy: { order: 'asc' }
    })
    console.log(`[GET /columns] Found ${columns.length} columns`)
    res.header('X-Total-Count', columns.length.toString())
    res.header('Content-Range', `columns 0-${columns.length}/${columns.length}`)
    res.json(columns)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch columns' })
  }
})

app.post('/columns', authMiddleware, async (req, res) => {
  try {
    const { title, order, projectId } = req.body
    console.log('[POST /columns] Body:', req.body)
    const column = await prisma.column.create({
      data: {
        title,
        order,
        projectId: projectId ? parseInt(projectId) : null
      }
    })
    console.log('[POST /columns] Created:', column)
    res.json(column)
  } catch (err) {
    console.error('[POST /columns] Error:', err)
    res.status(500).json({ error: 'Failed to create column' })
  }
})

app.put('/columns/:id', authMiddleware, async (req, res) => {
  try {
    const { title, order } = req.body
    const column = await prisma.column.update({
      where: { id: req.params.id },
      data: { title, order }
    })
    res.json(column)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update column' })
  }
})

app.delete('/columns/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.column.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete column' })
  }
})

// ==================== TASKS ====================

app.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const { _sort, _order, _end, _start, q, projectId, filter } = req.query

    const where: any = {}
    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } }
      ]
    }
    if (projectId) {
      where.projectId = parseInt(projectId as string)
    } else if (filter) {
      try {
        const parsed = JSON.parse(filter as string)
        if (parsed.projectId) where.projectId = parseInt(parsed.projectId)
      } catch (e) {
        console.error('Failed to parse filter', e)
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignees: true,
        subtasks: true,
        attachments: true,
        comments: { include: { author: true } }
      },
      orderBy: {
        [(_sort as string) || 'createdAt']: (_order as string)?.toLowerCase() || 'desc'
      },
      take: _end ? parseInt(_end as string) - (_start ? parseInt(_start as string) : 0) : undefined,
      skip: _start ? parseInt(_start as string) : undefined
    })

    const total = await prisma.task.count({ where })
    const start = _start ? parseInt(_start as string) : 0
    const end = start + tasks.length
    res.header('X-Total-Count', total.toString())
    res.header('Content-Range', `tasks ${start}-${end}/${total}`)
    res.json(tasks)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

app.post('/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, description, columnId, priority, dueDate, assigneeIds, projectId } = req.body

    const task = await prisma.task.create({
      data: {
        title,
        description,
        columnId,
        priority,
        projectId: projectId ? parseInt(projectId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignees: assigneeIds ? {
          connect: assigneeIds.map((id: number) => ({ id }))
        } : undefined
      },
      include: { assignees: true }
    })
    res.json(task)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

app.put('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, status, columnId, priority, dueDate, assigneeIds } = req.body

    const data: any = {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
    }

    if (columnId) data.columnId = columnId
    if (assigneeIds !== undefined) {
      data.assignees = {
        set: assigneeIds.map((id: number) => ({ id }))
      }
    }

    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: {
        assignees: { select: { id: true, name: true, email: true, photoUrl: true } },
        subtasks: true,
        attachments: true,
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true, photoUrl: true } }
          }
        }
      }
    })
    res.json(task)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to update task' })
  }
})

app.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to delete task' })
  }
})

// Subtasks
app.post('/tasks/:id/subtasks', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body
    const subtask = await prisma.subtask.create({
      data: {
        title,
        taskId: parseInt(req.params.id)
      }
    })
    res.json(subtask)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to create subtask' })
  }
})

app.put('/subtasks/:id', authMiddleware, async (req, res) => {
  try {
    const { title, completed } = req.body
    const subtask = await prisma.subtask.update({
      where: { id: parseInt(req.params.id) },
      data: { title, completed }
    })
    res.json(subtask)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to update subtask' })
  }
})

app.delete('/subtasks/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.subtask.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to delete subtask' })
  }
})

// Attachments
app.post('/tasks/:id/attachments', authMiddleware, async (req, res) => {
  try {
    const { name, size, url } = req.body
    const attachment = await prisma.attachment.create({
      data: {
        name,
        size,
        url,
        taskId: parseInt(req.params.id)
      }
    })
    res.json(attachment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to create attachment' })
  }
})

app.delete('/attachments/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.attachment.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to delete attachment' })
  }
})

// Comments
app.post('/tasks/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body
    const userId = (req as any).user.sub
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId: parseInt(req.params.id),
        authorId: parseInt(userId)
      },
      include: {
        author: { select: { id: true, name: true, email: true, photoUrl: true } }
      }
    })
    res.json(comment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'failed to create comment' })
  }
})

// ==================== DATAJUD PROXY ====================

app.post('/api/lawsuits/search', authMiddleware, async (req, res) => {
  try {
    const { processNumber } = req.body
    if (!processNumber) return res.status(400).json({ error: 'processNumber is required' })

    // Clean process number
    const cleanNumber = processNumber.replace(/\D/g, '')
    if (cleanNumber.length !== 20) return res.status(400).json({ error: 'Invalid CNJ format' })

    console.log(`[Escavador] Searching for ${cleanNumber}`)

    // 1. Check Cache
    const cached = await prisma.lawsuit.findUnique({ where: { cnj: cleanNumber } })
    if (cached) {
      console.log(`[Cache] Found lawsuit ${cleanNumber} in DB`)
      return res.json([cached.data])
    }

    // 2. Call API
    try {
      const result = await searchEscavador(cleanNumber)
      if (result) {
        // 3. Save to Cache
        await prisma.lawsuit.create({
          data: {
            cnj: cleanNumber,
            title: `Processo ${cleanNumber}`,
            tribunal: result.tribunal,
            classe: result.classe,
            assuntos: result.assuntos,
            data: result as any,
            lastUpdate: new Date()
          }
        })
        res.json([result])
      } else {
        console.log('[Escavador] No results found')
        res.json([])
      }
    } catch (err) {
      console.error('[Escavador] Error:', err)
      // Return empty so manual registration can be used
      res.json([])
    }

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro interno no servidor durante a busca' })
  }
})

// ==================== ESCAVADOR SERVICE ====================
const ESCAVADOR_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYTcwZTQ0NGU2ZGEyMDc4YzZjZGVjNGM0ZjMyOWIyNDQ2ZTVmNWNhZmEzZTMzODc4ZmRkNTM0MWI3YTQ2YTdlZWVmMTgzN2VjNGNhODhhMWIiLCJpYXQiOjE3NjQ2ODExNDguMzE3MDM2LCJuYmYiOjE3NjQ2ODExNDguMzE3MDM3LCJleHAiOjIwODAyMTM5NDguMzEyODA3LCJzdWIiOiIyOTg4MDA3Iiwic2NvcGVzIjpbImFjZXNzYXJfYXBpX3BhZ2EiLCJhY2Vzc2FyX2FwaV9wbGF5Z3JvdW5kIl19.T-3NAH963DQ3q4BzjQTkEEKjjjS9IFlQbc1rtq5RX9M1gqvtFPBXX0tPfDGwkh9Jha_WQNgOHgfcNPrH1tmYTifHVZQeE15qtpVtH9d_Rm7h8I_O245CHvxCday0IOtjy-cXISVWOt797K2v8faW_LLQXw1ZBp2Y3ArDhzT36AXAtaoAyfXPWPObIRs0R_GWTZdM6KuFY-QQjAq1pYq0k8W0per9uqKMxpHPNJ1BuDueSerFzPQIJnaRX3BD7lgRWoD4aOmEzt2coxuA3lEPrhfVOlhdCY0HVfXm5CIwnLv1ZB20GWNrIrd14QKWHAVivcNpSF08Mhv0KYLA9LgxTTXp_kkdxl4xgcWIMk2H-AAU9P7kLgztUQFSe0pOUaeuJpScj8p0j2upyhJD_Rq3mnyeZXojPdjmSEuaQ836yyVE1LmyerJDAbNfOH84F1fwK0a91DIY6Xl7UZQDAjY7OOiSSX8eMjR29LRamBms1jn0w3DXDiTlB2QIHOuTSt_vlqq6XONgBeR9QjW8euo6EN5K9p8dai3tBAzm8QiYAV69SMSQARUKYYGv023MMOCJii01VTh5ljvc7N2JZw7zGe0eFL_8tgIzTH4ouLQS_jgLi8Q6YveOLYtgIoRFwvI1xzhc7baNDWFPRCqzv3NyBzIZBb57UXO-u7URd-11pWo'

async function searchEscavador(cnj: string) {
  console.log(`[Escavador] Searching for ${cnj}...`)
  const url = `https://api.escavador.com/api/v2/processos/numero_cnj/${cnj}`

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${ESCAVADOR_TOKEN}`,
        'X-Requested-With': 'XMLHttpRequest'
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data) {
        return {
          id: `ESCAVADOR_${data.id}`,
          numeroProcesso: data.numero_cnj,
          classe: 'Não informado (Escavador)',
          assuntos: ['Processo encontrado via Escavador'],
          tribunal: 'TRT1 (Escavador)',
          ultimaMovimentacao: data.ultima_movimentacao?.conteudo || 'Ver no site do Escavador',
          dataUltimaMovimentacao: data.ultima_movimentacao?.data || new Date().toISOString(),
          fonte: 'Escavador',
          link: data.link
        }
      }
    } else {
      console.error(`[Escavador] API Error ${response.status}: ${await response.text()}`)
    }
  } catch (error) {
    console.error(`[Escavador] Request failed:`, error)
  }

  // Fallback to Mock Data if API fails or returns nothing (e.g. no credits)
  console.log('[Escavador] Falling back to mock data')
  return {
    id: `MOCK_${uuidv4()}`,
    numeroProcesso: cnj,
    classe: 'Reclamação Trabalhista (MOCK)',
    assuntos: ['Verbas Rescisórias', 'Dano Moral'],
    tribunal: 'TRT-RJ (MOCK)',
    ultimaMovimentacao: 'Conclusos para julgamento (Dados fictícios - API sem saldo)',
    dataUltimaMovimentacao: new Date().toISOString(),
    fonte: 'Simulação',
    link: '#'
  }
}

async function getProcessMovements(cnj: string) {
  console.log(`[Escavador] Getting movements for ${cnj}...`)
  const url = `https://api.escavador.com/api/v2/processos/numero_cnj/${cnj}/movimentacoes`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${ESCAVADOR_TOKEN}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  })

  if (!response.ok) {
    console.error(`[Escavador] Movements Error ${response.status}`)
    return []
  }

  const data = await response.json()
  return data.items || []
}

async function requestAIUpdate(cnj: string) {
  console.log(`[Escavador] Requesting AI update for ${cnj}...`)
  const url = `https://api.escavador.com/api/v2/processos/numero_cnj/${cnj}/ia/resumo/solicitar-atualizacao`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ESCAVADOR_TOKEN}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`[Escavador] AI Update Error ${response.status}: ${text}`)
    throw new Error(text)
  }

  return await response.json()
}

async function createMonitor(cnj: string) {
  console.log(`[Escavador] Creating monitor for ${cnj}...`)
  const url = `https://api.escavador.com/api/v2/monitoramentos/processos`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ESCAVADOR_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      tipo: 'unico',
      valor: cnj,
      frequencia: 'DIARIA' // Default frequency
    })
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`[Escavador] Monitor Error ${response.status}: ${text}`)
    throw new Error(text)
  }

  return await response.json()
}

// New Routes
app.get('/api/lawsuits/:cnj/movements', authMiddleware, async (req, res) => {
  try {
    const { cnj } = req.params

    // 1. Check Cache
    const lawsuit = await prisma.lawsuit.findUnique({ where: { cnj } })
    if (lawsuit && lawsuit.movements) {
      console.log(`[Cache] Found movements for ${cnj}`)
      return res.json(lawsuit.movements)
    }

    // 2. Call API
    const movements = await getProcessMovements(cnj)

    // 3. Save to Cache
    if (lawsuit) {
      await prisma.lawsuit.update({
        where: { id: lawsuit.id },
        data: { movements: movements as any }
      })
    } else {
      // If lawsuit doesn't exist (edge case), create it? 
      // Better to just return movements, or create a partial record.
      // For now, just return.
    }

    res.json(movements)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movements' })
  }
})

app.post('/api/lawsuits/:cnj/ai-update', authMiddleware, async (req, res) => {
  try {
    const result = await requestAIUpdate(req.params.cnj)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to request AI update' })
  }
})

app.post('/api/lawsuits/monitor', authMiddleware, async (req, res) => {
  try {
    const { cnj } = req.body
    const userId = (req as any).user.sub

    if (!cnj) return res.status(400).json({ error: 'CNJ is required' })

    // Create monitor in Escavador
    const result = await createMonitor(cnj)

    // Update Lawsuit with responsible user
    // We try to find it first (it should exist from search)
    const lawsuit = await prisma.lawsuit.findUnique({ where: { cnj } })
    if (lawsuit) {
      await prisma.lawsuit.update({
        where: { id: lawsuit.id },
        data: { responsibleId: parseInt(userId) }
      })
    } else {
      // If not in cache (weird), create it
      await prisma.lawsuit.create({
        data: {
          cnj,
          responsibleId: parseInt(userId),
          assuntos: ['Monitoramento Manual']
        }
      })
    }

    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create monitor' })
  }
})

// ==================== NOTIFICATIONS ====================

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.sub
    const notifications = await prisma.notification.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    res.json(notifications)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

app.post('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.sub
    const notificationId = parseInt(req.params.id)

    // Verify ownership
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: parseInt(userId) }
    })

    if (!notification) return res.status(404).json({ error: 'Notification not found' })

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

app.post('/api/notifications/test', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.sub
    const { title, description, type } = req.body

    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        title: title || 'Teste de Notificação',
        description: description || 'Esta é uma notificação de teste criada manualmente.',
        type: type || 'info'
      }
    })
    res.json(notification)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create test notification' })
  }
})

// ==================== TEAMS ====================

app.get('/teams', authMiddleware, async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: { id: true, name: true, email: true, photoUrl: true, isAdmin: true }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(teams)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch teams' })
  }
})

app.post('/teams', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, logoUrl } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const team = await prisma.team.create({
      data: { name, logoUrl }
    })
    res.json(team)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create team' })
  }
})

app.post('/teams/:id/members', authMiddleware, adminOnly, async (req, res) => {
  try {
    const teamId = parseInt(req.params.id)
    const { userId, userIds } = req.body

    if (userIds && Array.isArray(userIds)) {
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { teamId }
      })
    } else if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { teamId }
      })
    }
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add member to team' })
  }
})

app.delete('/teams/:id/members/:userId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)

    await prisma.user.update({
      where: { id: userId },
      data: { teamId: null }
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to remove member from team' })
  }
})

// ==================== MIGRATION ====================

const migrateOrphanData = async () => {
  try {
    const projectCount = await prisma.project.count()
    if (projectCount === 0) {
      console.log('No projects found. Creating default "General" project and migrating data...')
      const generalProject = await prisma.project.create({
        data: {
          name: 'Geral',
          description: 'Projeto padrão para tarefas existentes'
        }
      })

      await prisma.task.updateMany({
        where: { projectId: null },
        data: { projectId: generalProject.id }
      })

      await prisma.column.updateMany({
        where: { projectId: null },
        data: { projectId: generalProject.id }
      })
      console.log('Migration complete.')
    }
  } catch (e) {
    console.error('Migration failed:', e)
  }
}

// ==================== WEBHOOKS ====================

app.post('/api/webhooks/escavador', async (req, res) => {
  try {
    const event = req.body
    console.log('[Webhook] Received event:', event)

    if (event.tipo === 'nova_movimentacao') {
      const cnj = event.conteudo.numero_cnj
      const movimento = event.conteudo.movimentacao

      // Find lawsuit to see who is responsible
      const lawsuit = await prisma.lawsuit.findUnique({
        where: { cnj },
        include: { responsible: true }
      })

      if (lawsuit && lawsuit.responsible) {
        // Notify ONLY the responsible lawyer
        console.log(`[Webhook] Notifying responsible lawyer: ${lawsuit.responsible.email}`)
        await prisma.notification.create({
          data: {
            userId: lawsuit.responsible.id,
            title: `Nova Movimentação: ${cnj}`,
            description: `${movimento.conteudo} - ${new Date(movimento.data).toLocaleDateString()}`,
            type: 'info'
          }
        })
      } else {
        // Fallback: Notify ALL admins if no responsible found
        console.log('[Webhook] No responsible found, notifying all admins')
        const admins = await prisma.user.findMany({ where: { isAdmin: true } })
        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              title: `Nova Movimentação: ${cnj}`,
              description: `${movimento.conteudo} - ${new Date(movimento.data).toLocaleDateString()}`,
              type: 'info'
            }
          })
        }
      }

      // Update Cache Timestamp
      if (lawsuit) {
        await prisma.lawsuit.update({
          where: { id: lawsuit.id },
          data: { lastUpdate: new Date() }
        })
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('[Webhook] Error:', err)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

app.listen(Number(port), '0.0.0.0', async () => {
  try {
    await migrateOrphanData()
    console.log(`🚀 Server running on port ${port} (0.0.0.0)`)
    console.log(`📅 Started at: ${new Date().toISOString()}`)
    console.log(`✅ Server ready to accept connections`)
  } catch (err) {
    console.error('❌ Error during startup migration:', err)
  }
})
