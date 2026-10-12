import { Buffer } from 'node:buffer'
import process from 'node:process'
import { findManagementUserById, verifyManagementToken } from '../services/managementAuthService.js'

export async function requireManagementCredential(request, response, next) {
  // The setup key is used only during account creation. A separate secret signs
  // short-lived login tokens, so the bootstrap key can be removed afterward.
  const signingSecret = process.env.MANAGEMENT_SESSION_SECRET
  if (!signingSecret || Buffer.byteLength(signingSecret) < 32) {
    return response.status(503).json({
      error: 'Management access is not configured on the server.',
    })
  }

  response.set('Cache-Control', 'no-store')
  const authorization = request.get('authorization') ?? ''
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''
  const userId = verifyManagementToken(token, signingSecret)

  if (!userId) {
    return response.status(401).json({ error: 'Please sign in to management.' })
  }

  const user = await findManagementUserById(userId)
  if (!user) {
    return response.status(401).json({ error: 'Please sign in to management.' })
  }

  request.managementUser = user
  return next()
}

export function requireManagementAdmin(request, response, next) {
  if (request.managementUser?.role !== 'Admin') {
    return response.status(403).json({
      error: 'Admin access is required for this action.',
    })
  }
  return next()
}
