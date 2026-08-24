import { parse } from 'node:url'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requireAuth } from './middleware/requireAuth.js'
import { validateRequest } from './middleware/validateRequest.js'
import { signupController, loginController, googleController, forgotController, logoutController, deleteAccountController } from './controllers/auth.controller.js'
import { countriesController } from './controllers/countries.controller.js'
import { profileDeleteController, profileGetController, profilePatchController } from './controllers/profile.controller.js'
import { progressGetController, answerController } from './controllers/progress.controller.js'
import { quizAttemptController } from './controllers/quiz.controller.js'
import { achievementsController } from './controllers/achievements.controller.js'

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export function createApp() {
  return async function handler(req, res) {
    try {
      const url = parse(req.url, true)
      const path = url.pathname
      const method = req.method || 'GET'
      const body = method === 'GET' ? {} : await readJson(req)

      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', env.corsOrigin)
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
      if (method === 'OPTIONS') {
        res.statusCode = 204
        res.end()
        return
      }

      if (path === '/countries' && method === 'GET') return countriesController(req, res)

      if (path === '/auth/signup' && method === 'POST') {
        validateRequest(body, ['fullName', 'email', 'password'])
        return signupController(req, res, body)
      }
      if (path === '/auth/login' && method === 'POST') return loginController(req, res, body)
      if (path === '/auth/google' && method === 'POST') return googleController(req, res, body)
      if (path === '/auth/forgot-password' && method === 'POST') return forgotController(req, res, body)
      if (path === '/auth/logout' && method === 'POST') return logoutController(req, res, body)

      const auth = await requireAuth(req, res)
      if (!auth) return

      if (path === '/profile' && method === 'GET') return profileGetController(req, res)
      if (path === '/profile' && method === 'PATCH') return profilePatchController(req, res, body)
      if (path === '/profile' && method === 'DELETE') return profileDeleteController(req, res)
      if (path === '/progress' && method === 'GET') return progressGetController(req, res)
      if (path === '/progress/answer' && method === 'POST') return answerController(req, res, body)
      if (path === '/quiz-attempts' && method === 'POST') return quizAttemptController(req, res, body)
      if (path === '/achievements' && method === 'GET') return achievementsController(req, res)
      if (path === '/auth/logout' && method === 'POST') return logoutController(req, res, body)
      if (path === '/profile' && method === 'DELETE') return deleteAccountController(req, res)

      res.statusCode = 404
      res.end(JSON.stringify({ error: 'Not found' }))
    } catch (error) {
      errorHandler(error, res)
    }
  }
}
