import Link from 'next/link'

/**
 * Custom not-found page for the frontend.
 * This renders when `notFound()` is called from any page in the (frontend) route group.
 *
 * Customize this component to match your app's design and provide helpful navigation.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-8 py-16 text-center">
      <h1 className="font-serif text-3xl tracking-tight">Halaman belum ditemukan</h1>
      <p className="mt-4 text-zinc-600">
        Halaman yang kamu cari tidak tersedia. Kembali dan temukan seduhan favoritmu.
      </p>
      <Link className="mt-6 font-medium text-[#224b38] underline-offset-4 hover:underline" href="/">
        &larr; Kembali ke beranda
      </Link>
    </main>
  )
}
