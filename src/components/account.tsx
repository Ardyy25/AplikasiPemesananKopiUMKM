'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type FormEvent,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export type Customer = {
  id: string | number
  name: string
  email: string
  points: number
  stamps: number
  role: 'customer' | 'cashier' | 'owner'
  active: boolean
}
type AccountState = {
  user: Customer | null
  loading: boolean
  error: string
  reload: () => Promise<void>
}
const AccountContext = createContext<AccountState>({
  user: null,
  loading: true,
  error: '',
  reload: async () => {},
})
export const useAccount = () => useContext(AccountContext)

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    setError('')
    try {
      const response = await fetch('/api/account', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setUser(data.user)
    } catch {
      setUser(null)
      setError('Akun belum dapat dimuat. Periksa koneksimu dan coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void reload()
    const onFocus = () => void reload()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [reload])
  return (
    <AccountContext.Provider value={{ user, loading, error, reload }}>
      {children}
    </AccountContext.Provider>
  )
}

function SmallIcon({
  kind,
  className = '',
}: {
  kind: 'user' | 'star' | 'arrow' | 'cup' | 'exit' | 'check'
  className?: string
}) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === 'user' && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </>
      )}
      {kind === 'star' && (
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
      )}
      {kind === 'arrow' && <path d="M5 12h14m-5-5 5 5-5 5" />}
      {kind === 'cup' && (
        <>
          <path d="M5 7h11v7a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5ZM16 9h2a3 3 0 0 1 0 6h-2M8 3v2m4-2v2" />
        </>
      )}
      {kind === 'exit' && <path d="M9 4H4v16h5m3-8h9m-4-4 4 4-4 4" />}
      {kind === 'check' && <path d="m5 12 4 4L19 6" />}
    </svg>
  )
}

const primary =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#224b38] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#163b2a] disabled:cursor-wait disabled:opacity-60'

export function LoyaltyCard({ compact = false }: { compact?: boolean }) {
  const { user, loading } = useAccount()
  const stamps = Math.max(0, Math.min(10, user?.stamps ?? 0))
  return (
    <div>
      <section className="relative overflow-hidden rounded-[26px] bg-[#224b38] p-6 text-white">
        <div className="absolute -right-8 -top-10 size-40 rounded-full border-[26px] border-white/5" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#dbccb6]">
            Kopikita member
          </p>
          <SmallIcon kind="star" className="text-[#f1c766]" />
        </div>
        <p className="mt-5 text-xs text-[#dbccb6]">Poin kamu</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-serif text-5xl">
            {loading ? '—' : user ? user.points.toLocaleString('id-ID') : '—'}
          </span>
          <span className="text-sm text-[#dbccb6]">poin</span>
        </p>
        <div className="mt-5 border-t border-white/15 pt-4">
          {user ? (
            <div className="flex items-center justify-between text-xs">
              <span>{user.points >= 800 ? 'Gold Member' : 'Kopikita Member'}</span>
              <span className="text-[#f1c766]">
                {user.points >= 800
                  ? 'Terima kasih sudah ngopi bersama.'
                  : `${800 - user.points} poin menuju Gold`}
              </span>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-between text-xs font-bold text-[#f4e5b8]"
            >
              Masuk untuk lihat poinmu <SmallIcon kind="arrow" />
            </Link>
          )}
        </div>
      </section>
      {!compact && (
        <section className="mt-6 rounded-[26px] border border-[#e7d7c8] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b765e]">
                Kartu stempel digital
              </p>
              <h3 className="mt-1 font-serif text-2xl">
                {user ? `${stamps} dari 10 seduhan` : 'Mulai cerita kopimu'}
              </h3>
            </div>
            <SmallIcon kind="cup" className="text-[#9b765e]" />
          </div>
          <div className="mt-5 grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }, (_, index) => (
              <div
                key={index}
                className={`grid aspect-square place-items-center rounded-full border text-xs ${index < stamps ? 'border-[#d96c45] bg-[#d96c45] text-white' : 'border-dashed border-[#ddcfc1] bg-[#fffaf4] text-[#b3a192]'}`}
              >
                {index < stamps ? <SmallIcon kind="check" /> : index + 1}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-[#8f8177]">
            10 stempel, 1 seduhan gratis. Stempel dicatat pengelola setelah transaksi terverifikasi.
          </p>
        </section>
      )}
    </div>
  )
}

export function AccountPage() {
  const { user, loading, error, reload } = useAccount()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  async function logout() {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
      if (!response.ok) throw new Error()
      await reload()
      router.refresh()
    } catch {
      setMessage('Belum berhasil keluar. Silakan coba lagi.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="px-5 pb-28 pt-3">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9b765e]">
        Ruang untukmu
      </p>
      <h1 className="mt-2 font-serif text-[32px]">Akun saya</h1>
      {loading ? (
        <p role="status" className="py-10 text-sm text-[#8f8177]">
          Menyiapkan akunmu…
        </p>
      ) : error ? (
        <div role="alert" className="my-6 rounded-2xl bg-[#f6e7d6] p-5">
          <p className="text-sm">{error}</p>
          <button onClick={() => void reload()} className="mt-3 font-bold text-[#224b38]">
            Coba lagi
          </button>
        </div>
      ) : user ? (
        <>
          <section className="mb-6 mt-5 flex items-center gap-4 rounded-3xl border border-[#e7d7c8] bg-white p-5">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#f4e5b8] font-serif text-2xl text-[#78542d]">
              {user.name.trim().slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-serif text-2xl">{user.name}</h2>
              <p className="mt-1 break-all text-xs text-[#8f8177]">{user.email}</p>
              <span className="mt-2 inline-block rounded-full bg-[#e8f0eb] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#35634d]">
                {user.role === 'owner'
                  ? 'Owner Kopikita'
                  : user.role === 'cashier'
                    ? 'Kasir Kopikita'
                    : 'Member Kopikita'}
              </span>
            </div>
          </section>
          {user.role === 'customer' ? (
            <LoyaltyCard />
          ) : (
            <section className="rounded-[26px] bg-[#224b38] p-6 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#d8c7ad]">
                Ruang operasional
              </p>
              <h3 className="mt-2 font-serif text-2xl">
                {user.role === 'owner' ? 'Kendali penuh bisnis' : 'Siap melayani transaksi'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#d8c7ad]">
                {user.role === 'owner'
                  ? 'Lihat omzet, laba, HPP, stok, dan kelola tim dari satu dashboard.'
                  : 'Buka POS, proses pembayaran, dan lihat transaksi yang kamu kerjakan.'}
              </p>
              <Link
                href="/staff"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f1c766] px-5 py-3 text-sm font-bold text-[#403225]"
              >
                Buka dashboard <SmallIcon kind="arrow" />
              </Link>
            </section>
          )}
          <div className="mt-6 space-y-2">
            <Link
              href={user.role === 'customer' ? '/rewards' : '/staff'}
              className="flex items-center justify-between rounded-2xl border border-[#e7d7c8] bg-white p-4 text-sm font-bold"
            >
              <span className="flex items-center gap-3">
                <SmallIcon kind="star" />
                {user.role === 'customer' ? 'Tentang rewards' : 'Dashboard operasional'}
              </span>
              <SmallIcon kind="arrow" />
            </Link>
            <Link
              href="/pesanan"
              className="flex items-center justify-between rounded-2xl border border-[#e7d7c8] bg-white p-4 text-sm font-bold"
            >
              Pesanan saya
              <SmallIcon kind="arrow" />
            </Link>
          </div>
          <button
            onClick={logout}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-[#e7d7c8] py-3.5 text-sm font-bold text-[#a5543b] disabled:opacity-50"
          >
            <SmallIcon kind="exit" />
            {busy ? 'Sedang keluar…' : 'Keluar dari akun'}
          </button>
          {message && (
            <p role="alert" className="mt-3 text-sm text-[#a5543b]">
              {message}
            </p>
          )}
        </>
      ) : (
        <>
          <section className="my-6 rounded-[28px] border border-[#e7d7c8] bg-[#f6e7d6] p-6 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#fffaf4] text-[#78542d]">
              <SmallIcon kind="user" />
            </div>
            <h2 className="mt-4 font-serif text-2xl">Kopimu, ceritamu.</h2>
            <p className="mt-3 text-sm leading-6 text-[#8b7565]">
              Masuk untuk melihat poin dan stempel digitalmu. Semua tersimpan dalam satu akun.
            </p>
            <Link href="/login" className={`${primary} mt-6`}>
              Masuk / Daftar
              <SmallIcon kind="arrow" />
            </Link>
          </section>
          <LoyaltyCard />
        </>
      )}
      <p className="mt-7 text-center text-[10px] tracking-wide text-[#b0a093]">
        KOPIKITA · SEDUH DEKAT, CERITA HANGAT
      </p>
    </main>
  )
}

export function LoginPage() {
  const { user, loading, reload } = useAccount()
  const router = useRouter()
  const [register, setRegister] = useState(false)
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setFields({})
    try {
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: register ? 'register' : 'login',
          name: form.get('name'),
          email: form.get('email'),
          password: form.get('password'),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Terjadi kendala. Coba lagi.')
        setFields(data.errors || {})
        return
      }
      await reload()
      router.push('/akun')
      router.refresh()
    } catch {
      setError('Koneksi terputus. Silakan coba lagi.')
    } finally {
      setBusy(false)
    }
  }
  if (user && !loading)
    return (
      <main className="px-6 pb-28 pt-10 text-center">
        <div className="mx-auto w-fit text-[#35634d]">
          <SmallIcon kind="check" />
        </div>
        <h1 className="mt-4 font-serif text-3xl">Kamu sudah masuk.</h1>
        <p className="mt-2 text-sm text-[#8f8177]">Selamat datang kembali, {user.name}.</p>
        <Link href="/akun" className={`${primary} mt-6`}>
          Lihat akun saya
        </Link>
      </main>
    )
  return (
    <main className="px-6 pb-28 pt-4">
      <div className="mb-7 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#9b765e]">
        <span className="h-px w-6 bg-[#c7ab89]" />
        Lebih dekat, lewat secangkir
      </div>
      <h1 className="font-serif text-[38px] leading-[1.1]">
        {register ? (
          <>
            Awal cerita
            <br />
            kopi kita.
          </>
        ) : (
          <>
            Senang kamu
            <br />
            kembali.
          </>
        )}
      </h1>
      <p className="mt-4 max-w-[330px] text-sm leading-6 text-[#8f8177]">
        {register
          ? 'Buat akun Kopikita dan mulai kumpulkan momen, poin, serta seduhan favoritmu.'
          : 'Masuk ke Kopikita. Seduhan favorit dan poin setiamu menunggu di sini.'}
      </p>
      {!register && (
        <div className="mt-5 flex gap-2 text-[10px] font-bold uppercase tracking-wider text-[#7c6b60]">
          {['Customer', 'Kasir', 'Owner'].map((role) => (
            <span key={role} className="rounded-full border border-[#dfd3c7] bg-white px-3 py-1.5">
              {role}
            </span>
          ))}
        </div>
      )}
      <div
        className="mt-7 flex rounded-full bg-[#eee6dc] p-1"
        role="group"
        aria-label="Pilih masuk atau daftar"
      >
        {[false, true].map((value) => (
          <button
            key={String(value)}
            type="button"
            disabled={busy}
            aria-pressed={register === value}
            onClick={() => {
              setRegister(value)
              setError('')
              setFields({})
            }}
            className={`min-h-11 flex-1 rounded-full text-xs font-bold transition ${register === value ? 'bg-white text-[#224b38] shadow-sm' : 'text-[#9b8879]'}`}
          >
            {value ? 'Daftar akun' : 'Masuk'}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-6 space-y-5">
        {register && (
          <Input
            name="name"
            label="Nama lengkap"
            placeholder="Nama panggilanmu di kedai"
            autoComplete="name"
            error={fields.name}
            minLength={2}
            maxLength={80}
          />
        )}
        <Input
          name="email"
          label="Email"
          placeholder="nama@email.com"
          type="email"
          autoComplete="email"
          error={fields.email}
          maxLength={254}
        />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-bold">
              Kata sandi
            </label>
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className="text-[11px] font-bold text-[#35634d]"
              aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {visible ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
          <input
            id="password"
            name="password"
            type={visible ? 'text' : 'password'}
            autoComplete={register ? 'new-password' : 'current-password'}
            required
            minLength={register ? 8 : 1}
            maxLength={128}
            placeholder={register ? 'Minimal 8 karakter' : 'Masukkan kata sandimu'}
            aria-invalid={!!fields.password}
            aria-describedby={fields.password ? 'password-error' : undefined}
            className="min-h-13 w-full rounded-2xl border border-[#e4d8cc] bg-white px-4 text-sm placeholder:text-[#b3a497]"
          />
          {fields.password && (
            <p id="password-error" className="mt-2 text-xs text-[#a5543b]">
              {fields.password}
            </p>
          )}
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-[#eac9bb] bg-[#faeae2] p-3 text-xs leading-5 text-[#a5543b]"
          >
            {error}
          </div>
        )}
        <button type="submit" disabled={busy} className={primary}>
          {busy ? 'Sebentar, ya…' : register ? 'Buat akun Kopikita' : 'Masuk ke Kopikita'}
          {!busy && <SmallIcon kind="arrow" />}
        </button>
      </form>
      <Link href="/menu" className="mt-5 block py-2 text-center text-xs font-bold text-[#8f8177]">
        Lihat menu dulu tanpa masuk
      </Link>
      <div className="mt-7 flex items-start gap-3 rounded-2xl bg-[#f6e7d6] p-4">
        <SmallIcon kind="cup" className="shrink-0 text-[#9b765e]" />
        <p className="text-xs leading-5 text-[#8b7565]">
          Satu akun, banyak cerita.
          <br />
          <span className="font-bold text-[#664c39]">
            Poinmu tersimpan, di mana pun kamu ngopi.
          </span>
        </p>
      </div>
    </main>
  )
}

function Input({
  name,
  label,
  error,
  ...props
}: { name: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-xs font-bold">
        {label}
      </label>
      <input
        {...props}
        id={name}
        name={name}
        required
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className="min-h-13 w-full rounded-2xl border border-[#e4d8cc] bg-white px-4 text-sm placeholder:text-[#b3a497]"
      />
      {error && (
        <p id={`${name}-error`} className="mt-2 text-xs text-[#a5543b]">
          {error}
        </p>
      )}
    </div>
  )
}
