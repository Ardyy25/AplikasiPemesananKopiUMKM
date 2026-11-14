import { appAuth } from '@/lib/app-auth'
import { getPayloadClient } from '@/lib/payload'

const noStore = { 'Cache-Control': 'private, no-store' }

export async function GET() {
  try {
    const user = await appAuth.currentUser()
    return Response.json(
      {
        user: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              points: user.points ?? 0,
              stamps: user.stamps ?? 0,
              role: user.role === 'owner' || user.role === 'cashier' ? user.role : 'customer',
              active: user.active !== false,
            }
          : null,
      },
      { headers: noStore },
    )
  } catch {
    return Response.json(
      { error: 'Akun belum dapat dimuat. Silakan coba lagi.' },
      { status: 503, headers: noStore },
    )
  }
}

export async function POST(request: Request) {
  // Require same-origin JSON requests; reject cross-site login/logout CSRF.
  const origin = request.headers.get('origin')
  const allowed = [process.env.FIGMA_PUBLIC_URL, process.env.NEXT_PUBLIC_SITE_URL]
    .filter(Boolean)
    .map((value) => new URL(value!).origin)
  if (process.env.NODE_ENV === 'development') {
    allowed.push(`http://localhost:${process.env.PORT || 3000}`)
  }
  if (
    !origin ||
    !allowed.includes(origin) ||
    !request.headers.get('content-type')?.includes('application/json')
  ) {
    return Response.json(
      { error: 'Permintaan tidak diizinkan.' },
      { status: 403, headers: noStore },
    )
  }
  let body: Record<string, unknown>
  try {
    body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error()
  } catch {
    return Response.json({ error: 'Data formulir tidak valid.' }, { status: 400, headers: noStore })
  }
  if (body.action === 'logout') {
    await appAuth.logout()
    return Response.json({ success: true }, { headers: noStore })
  }
  if (body.action !== 'login' && body.action !== 'register') {
    return Response.json({ error: 'Tindakan tidak dikenal.' }, { status: 400, headers: noStore })
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const errors: Record<string, string> = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    errors.email = 'Masukkan alamat email yang valid.'
  if (password.length < (body.action === 'register' ? 8 : 1) || password.length > 128)
    errors.password = 'Gunakan kata sandi 8–128 karakter.'
  if (body.action === 'register' && (name.length < 2 || name.length > 80))
    errors.name = 'Nama harus berisi 2–80 karakter.'
  if (Object.keys(errors).length)
    return Response.json(
      { error: 'Periksa kembali formulirmu.', errors },
      { status: 400, headers: noStore },
    )
  try {
    if (body.action === 'register') {
      const payload = await getPayloadClient()
      // Allowlist profile fields. Loyalty balances can never be supplied by a visitor.
      await payload.create({
        collection: 'users',
        overrideAccess: false,
        data: { name, email, password },
      })
    }
    await appAuth.login(email, password)
    return Response.json({ success: true }, { headers: noStore })
  } catch {
    return Response.json(
      {
        error:
          body.action === 'register'
            ? 'Pendaftaran belum berhasil. Email mungkin sudah terdaftar; coba masuk atau gunakan email lain.'
            : 'Email atau kata sandi tidak sesuai, atau akun terkunci sementara. Silakan coba lagi.',
      },
      { status: 400, headers: noStore },
    )
  }
}
