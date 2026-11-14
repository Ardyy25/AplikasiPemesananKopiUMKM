'use client'

import { useMemo, useState, createContext, useContext, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { MenuProduct } from '@/lib/menu'
import { AccountProvider, AccountPage, LoginPage, LoyaltyCard, useAccount } from './account'
const MenuContext = createContext<MenuProduct[]>([])

type IconName =
  | 'user'
  | 'home'
  | 'cup'
  | 'gift'
  | 'receipt'
  | 'bell'
  | 'search'
  | 'pin'
  | 'clock'
  | 'star'
  | 'plus'
  | 'minus'
  | 'arrow'
  | 'back'
  | 'check'
  | 'bag'
  | 'chevron'

function Icon({
  name,
  size = 22,
  strokeWidth = 1.8,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
}) {
  const paths: Record<IconName, React.ReactNode> = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
      </>
    ),
    cup: (
      <>
        <path d="M5 7h11v7a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" />
        <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16M8 3v2m4-2v2" />
      </>
    ),
    gift: (
      <>
        <path d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9H7.8a2.3 2.3 0 1 1 2.1-3.3ZM12 9h4.2a2.3 2.3 0 1 0-2.1-3.3Z" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 8h6m-6 4h6" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    arrow: (
      <>
        <path d="M5 12h14m-5-5 5 5-5 5" />
      </>
    ),
    back: (
      <>
        <path d="M19 12H5m5-5-5 5 5 5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    bag: (
      <>
        <path d="M5 8h14l-1 13H6Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    chevron: <path d="m9 6 6 6-6 6" />,
  }
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

const rupiah = (value: number) => `Rp${value.toLocaleString('id-ID')}`

function AppHeader({ onCart, cartCount }: { onCart: () => void; cartCount: number }) {
  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-3">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Kopikita beranda"
          className="grid size-10 -rotate-6 place-items-center rounded-2xl bg-[#224b38] text-[#f4e5b8]"
        >
          <Icon name="cup" size={25} />
        </Link>
        <div>
          <p className="text-[11px] font-bold tracking-[.18em] text-[#96735c]">KEDAI LOKAL</p>
          <p className="font-serif text-xl font-bold leading-none text-[#2b1e18]">Kopikita.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          className="relative grid size-10 place-items-center rounded-full border border-[#e8ded4] bg-white/75 text-[#4c3a30] relative"
          aria-label="Keranjang"
          onClick={onCart}
        >
          <Icon name="bag" size={20} />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-[#d96c45] px-1 text-[9px] font-extrabold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

function ProductCard({ product, onSelect }: { product: MenuProduct; onSelect: () => void }) {
  return (
    <article className="rounded-[22px] border border-[#ebe2d9] bg-white p-1.5 shadow-[0_10px_26px_#432f220e] group">
      <div className="relative h-36 overflow-hidden rounded-[18px]">
        <Image
          width={350}
          height={300}
          src={product.image || '/coffee-placeholder.svg'}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.tag && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[#f4e5b8] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#533c2f]">
            {product.tag}
          </span>
        )}
        <button
          className="absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full bg-[#224b38] text-white shadow-lg"
          aria-label={`Tambah ${product.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <Icon name="plus" size={18} />
        </button>
      </div>
      <div className="px-1 pb-1 pt-3">
        <h3 className="font-serif text-[17px] font-bold leading-tight text-[#2b1e18]">
          <button onClick={onSelect} className="text-left">
            {product.name}
          </button>
        </h3>
        <p className="mt-1 min-h-8 text-[11px] leading-4 text-[#8f8177]">{product.desc}</p>
        <p className="mt-2 text-sm font-extrabold text-[#224b38]">{rupiah(product.price)}</p>
      </div>
    </article>
  )
}

function Home({
  onSelect,
  onViewMenu,
}: {
  onSelect: (p: MenuProduct) => void
  onViewMenu: () => void
}) {
  const products = useContext(MenuContext)
  const { user } = useAccount()
  return (
    <main className="pb-28">
      <section className="px-5 pt-2">
        <p className="text-sm text-[#8f8177]">Selamat pagi,</p>
        <h1 className="mt-1 font-serif text-[32px] font-bold leading-[1.08] text-[#2b1e18]">
          Mau ngopi apa
          <br />
          hari ini{user ? `, ${user.name.split(' ')[0]}` : ''}?
        </h1>
      </section>
      <section className="mx-5 mt-5 overflow-hidden rounded-[26px] bg-[#224b38] text-white">
        <div className="flex min-h-40">
          <div className="z-10 w-[58%] p-5">
            <span className="rounded-full bg-[#f1c766] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-[#3f3125]">
              Khusus member
            </span>
            <h2 className="mt-4 font-serif text-[23px] leading-tight">
              Seduh favorit,
              <br />
              panen poin.
            </h2>
            <button
              onClick={onViewMenu}
              className="mt-4 flex items-center gap-2 text-xs font-bold text-[#f4e5b8]"
            >
              Pesan sekarang <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="relative w-[42%]">
            <Image
              width={300}
              height={350}
              src={products[0]?.image || '/coffee-placeholder.svg'}
              alt="Es kopi susu di meja kayu"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[#224b38]/15" />
          </div>
        </div>
      </section>
      <section className="mx-5 mt-4 flex items-center justify-between rounded-2xl border border-[#e9dfd4] bg-white p-3.5 shadow-[0_8px_30px_rgba(63,44,31,.05)]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4e5b8] text-[#78542d]">
            <Icon name="pin" size={19} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a08e82]">
              Ambil pesanan di
            </p>
            <p className="mt-0.5 text-sm font-bold text-[#35251e]">Kopikita — Dipatiukur</p>
            <p className="mt-1 text-[10px] text-[#9b765e]">Lokasi contoh · prototype pemesanan</p>
          </div>
        </div>
      </section>
      <section className="mt-7">
        <div className="flex items-end justify-between px-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase leading-tight tracking-[.16em] text-[#9b765e]">
              Pilihan pelanggan
            </p>
            <h2 className="mt-1 font-serif text-2xl leading-tight text-[#2b1e18]">
              Sering dipesan
            </h2>
          </div>
          <button onClick={onViewMenu} className="text-xs font-extrabold text-[#35634d]">
            Lihat semua
          </button>
        </div>
        <div className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden mt-4 flex gap-3 overflow-x-auto px-5 pb-3">
          {products.slice(0, 3).map((product) => (
            <div key={product.id} className="w-[178px] shrink-0">
              <ProductCard product={product} onSelect={() => onSelect(product)} />
            </div>
          ))}
          {products.length === 0 && (
            <p className="py-5 text-sm text-[#8f8177]">
              Menu sedang disiapkan. Silakan kembali lagi nanti.
            </p>
          )}
        </div>
      </section>
      <section className="mx-5 mt-5">
        <LoyaltyCard compact />
      </section>
    </main>
  )
}

function Menu({ onSelect }: { onSelect: (p: MenuProduct) => void }) {
  const products = useContext(MenuContext)
  const [category, setCategory] = useState('Semua')
  const [query, setQuery] = useState('')
  const shown = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (category === 'Semua' || p.category === category),
  )
  return (
    <main className="px-5 pb-28 pt-2">
      <p className="text-[10px] font-extrabold uppercase leading-tight tracking-[.16em] text-[#9b765e]">
        Diracik setelah kamu pesan
      </p>
      <h1 className="font-serif text-[32px] font-bold text-[#2b1e18]">Pilih seduhanmu</h1>
      <label className="mt-5 flex h-12 items-center gap-3 rounded-2xl border border-[#e5dbd0] bg-white px-4 text-[#8c7d73] shadow-[0_8px_25px_rgba(65,43,30,.04)]">
        <Icon name="search" size={20} />
        <input
          aria-label="Cari kopi atau kudapan"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari kopi atau kudapan..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#a99b91]"
        />
      </label>
      <div className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden mt-4 flex gap-2 overflow-x-auto">
        {['Semua', 'Kopi', 'Non-kopi', 'Pastry'].map((item) => (
          <button
            key={item}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${category === item ? 'bg-[#224b38] text-white' : 'border border-[#e5dbd0] bg-white text-[#7c6b60]'}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {shown.map((product) => (
          <ProductCard key={product.id} product={product} onSelect={() => onSelect(product)} />
        ))}
      </div>
      {shown.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-serif text-xl font-bold">Menu belum ditemukan</p>
          <p className="mt-2 text-sm text-[#8f8177]">Coba kata pencarian lain.</p>
        </div>
      )}
    </main>
  )
}

function Rewards() {
  return (
    <main className="px-5 pb-28 pt-3">
      <p className="text-[10px] font-extrabold uppercase leading-tight tracking-[.16em] text-[#9b765e]">
        Kopikita Rewards
      </p>
      <h1 className="mt-2 font-serif text-[32px] leading-tight">
        Seduh, kumpulkan,
        <br />
        nikmati.
      </h1>
      <div className="mt-6">
        <LoyaltyCard />
      </div>
      <section className="mt-7 rounded-3xl border border-[#e7d7c8] bg-white p-5">
        <h2 className="font-serif text-xl">Setiap seduhan punya cerita.</h2>
        <p className="mt-3 text-sm leading-6 text-[#8f8177]">
          Poin dan stempel dari transaksi yang diverifikasi kedai akan tersimpan di akunmu.
          Kumpulkan 10 stempel untuk satu seduhan gratis.
        </p>
        <p className="mt-3 text-xs leading-5 text-[#9b765e]">
          Pesanan simulasi pada prototype tidak menambah saldo poin asli.
        </p>
      </section>
    </main>
  )
}

function Orders({ order }: { order: CartItem[] }) {
  return (
    <main className="px-5 pb-28 pt-3">
      <p className="text-[10px] font-extrabold uppercase leading-tight tracking-[.16em] text-[#9b765e]">
        Antrean digital · simulasi
      </p>
      <h1 className="mt-2 font-serif text-[32px]">Pesananmu</h1>
      {order.length ? (
        <section className="mt-6 rounded-[26px] bg-[#224b38] p-6 text-white">
          <span className="rounded-full bg-[#f1c766] px-3 py-1 text-[10px] font-bold text-[#443322]">
            DEMO · TIDAK DIKIRIM KE KEDAI
          </span>
          <h2 className="mt-5 font-serif text-3xl">Nomor A-01</h2>
          <p className="mt-1 text-sm text-[#dfd4c2]">Contoh antrean · estimasi ± 6 menit</p>
          <div className="my-5 border-t border-white/20" />
          {order.map((item, i) => (
            <div key={i} className="mb-4">
              <p className="font-bold">
                {item.qty}× {item.product.name}
              </p>
              <p className="mt-1 text-xs text-[#dfd4c2]">
                {item.sugar} gula · {item.ice} es · {item.milk} · {item.topping}
              </p>
              {item.note && <p className="mt-1 text-xs">Catatan: {item.note}</p>}
            </div>
          ))}
          <div className="mt-6 flex justify-between text-xs">
            <span>Diterima</span>
            <span className="text-[#f1c766]">Diracik</span>
            <span className="text-white/40">Siap</span>
          </div>
          <p className="mt-5 border-t border-white/20 pt-4 text-sm font-bold">
            Total {rupiah(order.reduce((sum, item) => sum + item.total, 0))}
          </p>
        </section>
      ) : (
        <section className="mt-6 rounded-3xl border border-[#e7d7c8] bg-white p-8 text-center">
          <div className="mx-auto w-fit text-[#35634d]">
            <Icon name="receipt" size={36} />
          </div>
          <h2 className="mt-4 font-serif text-2xl">Belum ada pesanan</h2>
          <p className="mt-2 text-sm leading-6 text-[#8f8177]">
            Pilih menu favoritmu dan coba alur pemesanan mandiri.
          </p>
          <Link
            href="/menu"
            className="mt-5 inline-flex rounded-full bg-[#224b38] px-6 py-3 text-sm font-bold text-white"
          >
            Lihat menu
          </Link>
        </section>
      )}
    </main>
  )
}

function ProductDetail({
  product,
  onClose,
  onAdd,
}: {
  product: MenuProduct
  onClose: () => void
  onAdd: (item: CartItem) => void
}) {
  const [sugar, setSugar] = useState('Normal')
  const [ice, setIce] = useState('Normal')
  const [milk, setMilk] = useState('Fresh milk')
  const [qty, setQty] = useState(1)
  const [topping, setTopping] = useState('Tanpa topping')
  const [note, setNote] = useState('')
  const extra = (milk === 'Oat milk' ? 6000 : 0) + (topping === 'Extra shot' ? 5000 : 0)
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#21170f]/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative overflow-hidden rounded-t-[30px] shadow-[0_-20px_60px_#1f150e33] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-h-[94vh] w-full max-w-[500px] overflow-y-auto bg-[#fffaf4]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64">
          <Image
            width={700}
            height={450}
            src={product.image || '/coffee-placeholder.svg'}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <button
            onClick={onClose}
            aria-label="Tutup detail menu"
            className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[#2b1e18] shadow-md"
          >
            <Icon name="back" size={20} />
          </button>
        </div>
        <div className="px-5 pb-32 pt-5">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase leading-tight tracking-[.16em] text-[#9b765e]">
                Racikan khas Kopikita
              </p>
              <h2 className="mt-1 font-serif text-[30px] font-bold leading-tight">
                {product.name}
              </h2>
            </div>
            <p className="mt-5 whitespace-nowrap font-extrabold text-[#224b38]">
              {rupiah(product.price)}
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#7f7066]">
            {product.desc}. Diracik segar setelah kamu pesan.
          </p>
          <Choice
            title="Tingkat manis"
            value={sugar}
            options={['Tanpa', 'Less', 'Normal']}
            onChange={setSugar}
          />
          <Choice
            title="Es batu"
            value={ice}
            options={['Tanpa', 'Less', 'Normal']}
            onChange={setIce}
          />
          <Choice
            title="Pilihan susu"
            value={milk}
            options={['Fresh milk', 'Oat milk']}
            onChange={setMilk}
            note="+Rp6.000"
          />
          <Choice
            title="Topping"
            value={topping}
            options={['Tanpa topping', 'Extra shot']}
            onChange={setTopping}
            note="+Rp5.000"
          />
          <div className="mt-6">
            <label htmlFor="barista-note" className="text-sm font-extrabold">
              Catatan untuk barista <span className="font-normal text-[#a3948a]">(opsional)</span>
            </label>
            <textarea
              id="barista-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              className="mt-2 h-20 w-full resize-none rounded-2xl border border-[#e4d8cc] bg-white p-3 text-sm outline-none focus:border-[#56806a]"
              placeholder="Contoh: foam tipis saja..."
            />
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-60 border-t border-[#e9ded4] bg-[#fffaf4]/95 px-5 pb-5 pt-3.5 backdrop-blur-lg mx-auto flex max-w-[500px] items-center gap-3">
          <div className="flex items-center rounded-full border border-[#dfd3c7] bg-white p-1">
            <button
              aria-label="Kurangi jumlah"
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="grid size-[34px] place-items-center rounded-full text-[#224b38]"
            >
              <Icon name="minus" size={17} />
            </button>
            <span className="w-8 text-center text-sm font-black">{qty}</span>
            <button
              aria-label="Tambah jumlah"
              onClick={() => setQty(Math.min(20, qty + 1))}
              className="grid size-[34px] place-items-center rounded-full text-[#224b38]"
            >
              <Icon name="plus" size={17} />
            </button>
          </div>
          <button
            onClick={() =>
              onAdd({
                product,
                qty,
                sugar,
                ice,
                milk,
                topping,
                note,
                total: (product.price + extra) * qty,
              })
            }
            className="flex h-13 flex-1 items-center justify-between rounded-full bg-[#224b38] px-5 font-bold text-white shadow-lg"
          >
            <span>Tambah pesanan</span>
            <span>{rupiah((product.price + extra) * qty)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function Choice({
  title,
  value,
  options,
  onChange,
  note,
}: {
  title: string
  value: string
  options: string[]
  onChange: (v: string) => void
  note?: string
}) {
  return (
    <div className="mt-6">
      <div className="flex justify-between">
        <p className="text-sm font-extrabold">{title}</p>
        {note && <span className="text-xs text-[#98867a]">{note}</span>}
      </div>
      <div className={`mt-2 grid gap-2 ${options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {options.map((option) => (
          <button
            key={option}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`rounded-xl border px-2 py-3 text-xs font-bold transition ${value === option ? 'border-[#224b38] bg-[#e8f0eb] text-[#224b38]' : 'border-[#e4d8cc] bg-white text-[#85766c]'}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

type CartItem = {
  product: MenuProduct
  qty: number
  sugar: string
  ice: string
  milk: string
  total: number
  topping: string
  note: string
}

function Cart({
  items,
  onClose,
  onOrder,
}: {
  items: CartItem[]
  onClose: () => void
  onOrder: () => void
}) {
  const total = items.reduce((sum, item) => sum + item.total, 0)
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#21170f]/45"
      onClick={onClose}
    >
      <div
        className="relative overflow-hidden rounded-t-[30px] shadow-[0_-20px_60px_#1f150e33] w-full max-w-[500px] bg-[#fffaf4] p-5 pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-[#d9cdc1]" />
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold">Keranjangmu</h2>
          <button onClick={onClose} className="text-xs font-bold text-[#8c786a]">
            Tutup
          </button>
        </div>
        {items.length === 0 ? (
          <div className="py-14 text-center text-[#8c7d73]">
            <Icon name="bag" size={35} />
            <p className="mt-3 text-sm">Belum ada menu dipilih.</p>
          </div>
        ) : (
          <>
            <div className="my-5 max-h-72 space-y-4 overflow-auto">
              {items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <Image
                    width={100}
                    height={100}
                    src={item.product.image || '/coffee-placeholder.svg'}
                    className="h-16 w-16 rounded-xl object-cover"
                    alt=""
                  />
                  <div className="flex-1">
                    <div className="flex justify-between gap-3">
                      <p className="font-bold">
                        {item.qty}× {item.product.name}
                      </p>
                      <p className="text-sm font-bold">{rupiah(item.total)}</p>
                    </div>
                    <p className="mt-1 text-xs text-[#8f8177]">
                      {item.sugar} gula · {item.ice} es · {item.milk} · {item.topping}
                      {item.note && <span className="mt-1 block">Catatan: {item.note}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#e6ddd4] pt-4">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#224b38]">{rupiah(total)}</span>
              </div>
              <button
                onClick={onOrder}
                className="mt-4 h-13 w-full rounded-full bg-[#224b38] font-bold text-white"
              >
                Simulasikan pesanan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const navItems: { id: string; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Beranda', icon: 'home' },
  { id: 'menu', label: 'Menu', icon: 'cup' },
  { id: 'rewards', label: 'Rewards', icon: 'gift' },
  { id: 'orders', label: 'Pesanan', icon: 'receipt' },
  { id: 'account', label: 'Akun', icon: 'user' },
]

const routes: Record<string, string> = {
  home: '/',
  menu: '/menu',
  rewards: '/rewards',
  orders: '/pesanan',
  account: '/akun',
  login: '/login',
}

export default function KopikitaApp({
  products,
  children,
}: {
  products: MenuProduct[]
  children: ReactNode
}) {
  return (
    <AccountProvider>
      <MenuContext.Provider value={products}>
        <App>{children}</App>
      </MenuContext.Provider>
    </AccountProvider>
  )
}

function App({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const tab = Object.keys(routes).find((key) => routes[key] === pathname)
  const setTab = (key: string) => router.push(routes[key] || '/')
  const [selected, setSelected] = useState<MenuProduct | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [lastOrder, setLastOrder] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart])
  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item])
    setSelected(null)
    setShowCart(true)
  }
  const placeOrder = () => {
    setLastOrder(cart)
    setCart([])
    setShowCart(false)
    setTab('orders')
  }
  return (
    <div className="min-h-screen bg-[#e7ddd2] bg-[radial-gradient(circle_at_center,#ffffff80_1px,transparent_1px)] bg-size-[22px_22px]">
      <div className="relative mx-auto min-h-screen w-full max-w-[500px] overflow-hidden bg-[#fffaf4] shadow-[0_0_60px_#37271c20] sm:my-[18px] sm:min-h-[calc(100vh-36px)] sm:rounded-[32px]">
        <AppHeader onCart={() => setShowCart(true)} cartCount={cartCount} />
        {tab === 'home' && <Home onSelect={setSelected} onViewMenu={() => setTab('menu')} />}
        {tab === 'menu' && <Menu onSelect={setSelected} />}
        {tab === 'rewards' && <Rewards />}
        {tab === 'orders' && <Orders order={lastOrder} />}
        {tab === 'account' && <AccountPage />}
        {tab === 'login' && <LoginPage />}
        {children}
        <nav
          aria-label="Navigasi utama"
          className="fixed bottom-0 left-1/2 z-30 grid h-[76px] w-full max-w-[500px] -translate-x-1/2 grid-cols-5 border-t border-[#ded3c9] bg-[#fffcf8]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_#3a281d0f] backdrop-blur-lg sm:bottom-[18px] sm:rounded-b-[32px]"
        >
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={routes[item.id]}
              aria-current={tab === item.id ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold transition-colors ${tab === item.id ? 'text-[#224b38]' : 'text-[#9c8c81]'}`}
            >
              <Icon name={item.icon} size={21} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      {selected && (
        <ProductDetail product={selected} onClose={() => setSelected(null)} onAdd={addToCart} />
      )}
      {showCart && <Cart items={cart} onClose={() => setShowCart(false)} onOrder={placeOrder} />}
    </div>
  )
}
