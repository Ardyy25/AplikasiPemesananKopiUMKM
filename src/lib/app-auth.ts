import 'server-only'
import { cookies } from 'next/headers'
import { getPayloadClient } from '@/lib/payload'

export function createAppAuth(appUserCollection: 'users') {
  const cookieName = 'app-session'
  const secure =
    process.env.NODE_ENV === 'production' || !!process.env.FIGMA_PUBLIC_URL?.startsWith('https:')
  const cookieOptions = {
    httpOnly: true,
    secure,
    sameSite: secure ? ('none' as const) : ('lax' as const),
    partitioned: secure,
    path: '/',
  }

  return {
    async currentUser() {
      const token = (await cookies()).get(cookieName)?.value
      if (!token) return null
      const payload = await getPayloadClient()
      const { user } = await payload.auth({
        headers: new Headers({ Authorization: `JWT ${token}` }),
      })
      if (!user || user.collection !== appUserCollection) return null
      // Read fresh loyalty balances rather than relying on JWT profile claims.
      return payload.findByID({
        collection: appUserCollection,
        id: user.id,
        user,
        overrideAccess: false,
        depth: 0,
      })
    },
    async login(email: string, password: string) {
      const payload = await getPayloadClient()
      const result = await payload.login({
        collection: appUserCollection,
        data: { email, password },
      })
      if (!result.token) throw new Error('Login failed')
      const jar = await cookies()
      jar.set(cookieName, result.token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 })
    },
    async logout() {
      // Clear only the application cookie, never the independent CMS session.
      const jar = await cookies()
      jar.set(cookieName, '', { ...cookieOptions, maxAge: 0 })
    },
  }
}

export const appAuth = createAppAuth('users')
