'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useAccount } from '@/components/account'

type Product = {
  id: string
  name: string
  description: string
  category: 'Kopi' | 'Non-kopi' | 'Pastry'
  price: number
  costPrice?: number
  stock: number
  lowStockThreshold: number
  active: boolean
}
type Sale = {
  id: string
  receiptNumber: string
  cashier: string
  total: number
  totalCost?: number
  grossProfit?: number
  paymentMethod: string
  createdAt: string
}
type Employee = {
  id: string
  name: string
  email: string
  role: 'cashier' | 'owner'
  active: boolean
  cashierCanViewAllSales: boolean
}
type CustomerAccount = {
  id: string
  name: string
  email: string
  points: number
  stamps: number
  active: boolean
}
type Expense = {
  id: string
  description: string
  amount: number
  category: string
  expenseDate: string
}
type Supplier = { id: string; name: string; contactName?: string; phone?: string }
type StaffData = {
  role: 'cashier' | 'owner'
  products: Product[]
  sales: Sale[]
  employees?: Employee[]
  customers?: CustomerAccount[]
  expenses?: Expense[]
  suppliers?: Supplier[]
}

const rupiah = (value: number) => `Rp${value.toLocaleString('id-ID')}`
const field =
  'min-h-11 w-full rounded-xl border border-[#dfd3c7] bg-white px-3 text-sm outline-none focus:border-[#35634d]'
const action =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-[#224b38] px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-50'

async function postStaff(body: Record<string, unknown>) {
  const response = await fetch('/api/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Operasi gagal.')
  return data
}

export function StaffDashboard() {
  const { user, loading: accountLoading } = useAccount()
  const [data, setData] = useState<StaffData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('pos')
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/staff', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setData(result)
    } catch (reason) {
      setData(null)
      setError(reason instanceof Error ? reason.message : 'Dashboard tidak dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    if (!accountLoading) void load()
  }, [accountLoading, load])

  if (accountLoading || loading) {
    return (
      <main className="px-5 pb-28 pt-8">
        <p role="status" className="text-sm text-[#8f8177]">
          Menyiapkan ruang kerja…
        </p>
      </main>
    )
  }
  if (!user) {
    return (
      <StaffGate
        title="Masuk sebagai staf"
        text="Gunakan akun Kasir atau Owner untuk membuka ruang operasional."
      />
    )
  }
  if (user.role === 'customer' || !user.active || error || !data) {
    return (
      <StaffGate
        title="Akses staf diperlukan"
        text={error || 'Akun Customer tidak memiliki akses ke sistem toko.'}
      />
    )
  }
  const tabs =
    data.role === 'owner'
      ? [
          ['pos', 'POS'],
          ['report', 'Laporan'],
          ['inventory', 'Produk'],
          ['team', 'Tim'],
        ]
      : [
          ['pos', 'POS'],
          ['history', 'Transaksi saya'],
        ]
  return (
    <main className="pb-28">
      <header className="px-5 pt-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9b765e]">
              {data.role === 'owner' ? 'Owner command center' : 'Kasir · shift aktif'}
            </p>
            <h1 className="mt-2 font-serif text-[32px]">
              {data.role === 'owner' ? 'Kendali Kopikita' : 'Meja kasir'}
            </h1>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase ${data.role === 'owner' ? 'bg-[#f1c766] text-[#4b3825]' : 'bg-[#e8f0eb] text-[#224b38]'}`}
          >
            {data.role}
          </span>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${tab === id ? 'bg-[#224b38] text-white' : 'border border-[#dfd3c7] bg-white text-[#7c6b60]'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="mt-4 px-5">
        {tab === 'pos' && <POS products={data.products} onSuccess={load} />}
        {(tab === 'history' || tab === 'report') && <SalesReport data={data} />}
        {tab === 'inventory' && data.role === 'owner' && (
          <Inventory products={data.products} suppliers={data.suppliers ?? []} onSuccess={load} />
        )}
        {tab === 'team' && data.role === 'owner' && (
          <Team
            employees={data.employees ?? []}
            customers={data.customers ?? []}
            expenses={data.expenses ?? []}
            onSuccess={load}
          />
        )}
      </div>
    </main>
  )
}

function StaffGate({ title, text }: { title: string; text: string }) {
  return (
    <main className="px-6 pb-28 pt-12 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#f4e5b8] text-2xl">
        K
      </div>
      <h1 className="mt-5 font-serif text-3xl">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-[#8f8177]">{text}</p>
      <Link href="/login" className={`${action} mt-6`}>
        Masuk ke Kopikita
      </Link>
    </main>
  )
}

function POS({ products, onSuccess }: { products: Product[]; onSuccess: () => Promise<void> }) {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [payment, setPayment] = useState('qris')
  const [paid, setPaid] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const available = products.filter((product) => product.active)
  const total = useMemo(
    () => available.reduce((sum, product) => sum + product.price * (cart[product.id] ?? 0), 0),
    [available, cart],
  )
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  function add(product: Product) {
    setCart((current) => ({
      ...current,
      [product.id]: Math.min(product.stock, (current[product.id] ?? 0) + 1),
    }))
  }
  async function checkout() {
    setBusy(true)
    setMessage('')
    try {
      const amountPaid = payment === 'cash' ? Number(paid) : total
      if (amountPaid < total) throw new Error('Jumlah tunai belum mencukupi.')
      const result = await postStaff({
        action: 'checkout',
        items: Object.entries(cart)
          .filter(([, quantity]) => quantity > 0)
          .map(([product, quantity]) => ({ product, quantity })),
        paymentMethod: payment,
        amountPaid,
      })
      setMessage(`Transaksi ${result.receiptNumber} selesai · kembalian ${rupiah(result.change)}`)
      setCart({})
      setPaid('')
      await onSuccess()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Transaksi gagal.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-5">
      <section>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b765e]">
              Point of sale
            </p>
            <h2 className="mt-1 font-serif text-2xl">Pilih produk</h2>
          </div>
          <span className="text-xs text-[#8f8177]">{itemCount} item</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {available.map((product) => (
            <button
              key={product.id}
              onClick={() => add(product)}
              disabled={product.stock < 1}
              className="rounded-2xl border border-[#e7d7c8] bg-white p-4 text-left shadow-[0_8px_24px_#432f220a] disabled:opacity-45"
            >
              <span className="block font-serif text-lg">{product.name}</span>
              <span className="mt-2 block text-sm font-bold text-[#224b38]">
                {rupiah(product.price)}
              </span>
              <span
                className={`mt-2 block text-[10px] ${product.stock <= product.lowStockThreshold ? 'font-bold text-[#b2553c]' : 'text-[#8f8177]'}`}
              >
                Stok {product.stock}
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="rounded-[26px] bg-[#224b38] p-5 text-white">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#d8c7ad]">Total transaksi</p>
            <p className="mt-1 font-serif text-3xl">{rupiah(total)}</p>
          </div>
          <span className="text-xs text-[#d8c7ad]">{itemCount} item</span>
        </div>
        <div className="mt-4 space-y-2 text-xs text-[#e7ddd0]">
          {Object.entries(cart)
            .filter(([, quantity]) => quantity > 0)
            .map(([id, quantity]) => {
              const product = products.find((item) => item.id === id)
              return product ? (
                <div key={id} className="flex justify-between">
                  <span>
                    {quantity}× {product.name}
                  </span>
                  <button
                    onClick={() =>
                      setCart((current) => ({ ...current, [id]: Math.max(0, quantity - 1) }))
                    }
                    className="font-bold text-[#f1c766]"
                  >
                    Kurangi
                  </button>
                </div>
              ) : null
            })}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {['cash', 'qris', 'card'].map((method) => (
            <button
              key={method}
              onClick={() => setPayment(method)}
              aria-pressed={payment === method}
              className={`rounded-xl border py-2.5 text-xs font-bold uppercase ${payment === method ? 'border-[#f1c766] bg-[#f1c766] text-[#403225]' : 'border-white/20'}`}
            >
              {method === 'cash' ? 'Tunai' : method}
            </button>
          ))}
        </div>
        {payment === 'cash' && (
          <input
            value={paid}
            onChange={(event) => setPaid(event.target.value)}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Jumlah uang diterima"
            className={`${field} mt-3 text-[#2b1e18]`}
          />
        )}
        <button
          onClick={checkout}
          disabled={busy || !itemCount}
          className="mt-4 min-h-12 w-full rounded-full bg-[#f1c766] text-sm font-bold text-[#403225] disabled:opacity-50"
        >
          {busy ? 'Memproses…' : 'Proses pembayaran'}
        </button>
        {message && (
          <p role="status" className="mt-3 text-xs leading-5 text-[#f4e5b8]">
            {message}
          </p>
        )}
      </section>
    </div>
  )
}

function SalesReport({ data }: { data: StaffData }) {
  const revenue = data.sales.reduce((sum, sale) => sum + sale.total, 0)
  const grossProfit = data.sales.reduce((sum, sale) => sum + (sale.grossProfit ?? 0), 0)
  const expenses = (data.expenses ?? []).reduce((sum, expense) => sum + expense.amount, 0)
  return (
    <div>
      <div className={`grid gap-3 ${data.role === 'owner' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Metric
          label={data.role === 'owner' ? 'Omzet tercatat' : 'Penjualan saya'}
          value={rupiah(revenue)}
        />
        {data.role === 'owner' && (
          <>
            <Metric label="Laba kotor" value={rupiah(grossProfit)} />
            <Metric label="Pengeluaran" value={rupiah(expenses)} />
            <Metric label="Estimasi laba" value={rupiah(grossProfit - expenses)} />
          </>
        )}
      </div>
      <section className="mt-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b765e]">
          Riwayat transaksi
        </p>
        <div className="mt-3 space-y-2">
          {data.sales.length ? (
            data.sales.map((sale) => (
              <div key={sale.id} className="rounded-2xl border border-[#e7d7c8] bg-white p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold">{sale.receiptNumber}</p>
                    <p className="mt-1 text-xs text-[#8f8177]">
                      {sale.cashier} · {new Date(sale.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <p className="font-bold text-[#224b38]">{rupiah(sale.total)}</p>
                </div>
                {data.role === 'owner' && (
                  <p className="mt-3 text-xs text-[#8f8177]">
                    HPP {rupiah(sale.totalCost ?? 0)} · laba kotor {rupiah(sale.grossProfit ?? 0)}
                  </p>
                )}
              </div>
            ))
          ) : (
            <Empty text="Belum ada transaksi pada laporan ini." />
          )}
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e7d7c8] bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9b765e]">{label}</p>
      <p className="mt-2 font-serif text-2xl">{value}</p>
    </div>
  )
}

function Inventory({
  products,
  suppliers,
  onSuccess,
}: {
  products: Product[]
  suppliers: Supplier[]
  onSuccess: () => Promise<void>
}) {
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  async function save(event: FormEvent<HTMLFormElement>, product: Product) {
    event.preventDefault()
    setBusy(product.id)
    setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      await postStaff({
        action: 'update-product',
        id: product.id,
        name: form.get('name'),
        description: form.get('description'),
        category: form.get('category'),
        price: Number(form.get('price')),
        costPrice: Number(form.get('costPrice')),
        stock: Number(form.get('stock')),
        active: form.get('active') === 'on',
      })
      setMessage(`${product.name} diperbarui.`)
      await onSuccess()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Produk gagal diperbarui.')
    } finally {
      setBusy('')
    }
  }
  async function removeProduct(product: Product) {
    if (
      !window.confirm(
        `Hapus ${product.name}? Produk dengan riwayat transaksi hanya dapat dinonaktifkan.`,
      )
    )
      return
    setBusy(product.id)
    try {
      await postStaff({ action: 'delete-product', id: product.id })
      setMessage(`${product.name} dihapus.`)
      await onSuccess()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Produk gagal dihapus.')
    } finally {
      setBusy('')
    }
  }
  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy('create')
    setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      await postStaff({
        action: 'create-product',
        name: form.get('name'),
        description: form.get('description'),
        category: form.get('category'),
        price: Number(form.get('price')),
        costPrice: Number(form.get('costPrice')),
        stock: Number(form.get('stock')),
      })
      event.currentTarget.reset()
      setMessage(
        'Produk baru ditambahkan. Publish ulang untuk menampilkannya pada katalog Customer.',
      )
      await onSuccess()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Produk gagal dibuat.')
    } finally {
      setBusy('')
    }
  }
  async function createSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy('supplier')
    const form = new FormData(event.currentTarget)
    try {
      await postStaff({
        action: 'create-supplier',
        name: form.get('name'),
        contactName: form.get('contactName'),
        phone: form.get('phone'),
      })
      event.currentTarget.reset()
      setMessage('Supplier ditambahkan.')
      await onSuccess()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Supplier gagal dibuat.')
    } finally {
      setBusy('')
    }
  }
  async function removeSupplier(supplier: Supplier) {
    if (!window.confirm(`Hapus supplier ${supplier.name}?`)) return
    setBusy(`supplier-${supplier.id}`)
    try {
      await postStaff({ action: 'delete-supplier', id: supplier.id })
      setMessage(`${supplier.name} dihapus.`)
      await onSuccess()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Supplier gagal dihapus.')
    } finally {
      setBusy('')
    }
  }
  return (
    <section>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b765e]">
          Produk & stok
        </p>
        <h2 className="mt-1 font-serif text-2xl">Harga, HPP, persediaan</h2>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#8f8177]">
        Perubahan menu publik tampil setelah Publish berikutnya; POS membaca stok terbaru.
      </p>
      {message && (
        <p role="status" className="mt-3 rounded-xl bg-[#e8f0eb] p-3 text-xs text-[#224b38]">
          {message}
        </p>
      )}
      <form onSubmit={createProduct} className="mt-4 rounded-2xl bg-[#f6e7d6] p-4">
        <h3 className="font-bold">Tambah produk</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            name="name"
            required
            minLength={2}
            placeholder="Nama produk"
            className={`${field} col-span-2`}
          />
          <input
            name="description"
            required
            minLength={2}
            placeholder="Deskripsi"
            className={`${field} col-span-2`}
          />
          <select name="category" className={field}>
            {['Kopi', 'Non-kopi', 'Pastry'].map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <input
            name="stock"
            required
            type="number"
            min={0}
            step={1}
            placeholder="Stok"
            className={field}
          />
          <input
            name="price"
            required
            type="number"
            min={0}
            placeholder="Harga jual"
            className={field}
          />
          <input
            name="costPrice"
            required
            type="number"
            min={0}
            placeholder="HPP"
            className={field}
          />
        </div>
        <button disabled={busy === 'create'} className={`${action} mt-3 w-full`}>
          Tambah produk
        </button>
      </form>
      <div className="mt-4 space-y-3">
        {products.map((product) => (
          <form
            key={product.id}
            onSubmit={(event) => save(event, product)}
            className="rounded-2xl border border-[#e7d7c8] bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl">{product.name}</h3>
              <label className="flex items-center gap-2 text-xs">
                <input name="active" type="checkbox" defaultChecked={product.active} /> Aktif
              </label>
            </div>
            <div className="mt-3 space-y-2">
              <input
                name="name"
                required
                minLength={2}
                defaultValue={product.name}
                aria-label={`Nama ${product.name}`}
                className={field}
              />
              <input
                name="description"
                required
                minLength={2}
                defaultValue={product.description}
                aria-label={`Deskripsi ${product.name}`}
                className={field}
              />
              <select
                name="category"
                defaultValue={product.category}
                aria-label={`Kategori ${product.name}`}
                className={field}
              >
                {['Kopi', 'Non-kopi', 'Pastry'].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <label className="text-[10px] font-bold text-[#8f8177]">
                Harga jual
                <input
                  name="price"
                  type="number"
                  min={0}
                  defaultValue={product.price}
                  className={`${field} mt-1 px-2`}
                />
              </label>
              <label className="text-[10px] font-bold text-[#8f8177]">
                HPP
                <input
                  name="costPrice"
                  type="number"
                  min={0}
                  defaultValue={product.costPrice ?? 0}
                  className={`${field} mt-1 px-2`}
                />
              </label>
              <label className="text-[10px] font-bold text-[#8f8177]">
                Stok
                <input
                  name="stock"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={product.stock}
                  className={`${field} mt-1 px-2`}
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button disabled={busy === product.id} className={`${action} flex-1`}>
                {busy === product.id ? 'Menyimpan…' : 'Simpan perubahan'}
              </button>
              <button
                type="button"
                onClick={() => removeProduct(product)}
                className="rounded-full border border-[#e5bdae] px-4 text-xs font-bold text-[#a5543b]"
              >
                Hapus
              </button>
            </div>
          </form>
        ))}
      </div>
      <section className="mt-7">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b765e]">
          Database supplier
        </p>
        <div className="mt-3 space-y-2">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-white p-3 text-sm"
            >
              <div>
                <strong>{supplier.name}</strong>
                <p className="mt-1 text-xs text-[#8f8177]">
                  {supplier.contactName || 'Tanpa kontak'}{' '}
                  {supplier.phone ? `· ${supplier.phone}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeSupplier(supplier)}
                className="text-xs font-bold text-[#a5543b]"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
        <form
          onSubmit={createSupplier}
          className="mt-3 rounded-2xl border border-[#e7d7c8] bg-white p-4"
        >
          <div className="space-y-2">
            <input
              name="name"
              required
              minLength={2}
              placeholder="Nama supplier"
              className={field}
            />
            <input name="contactName" placeholder="Nama kontak" className={field} />
            <input name="phone" placeholder="Nomor telepon" className={field} />
          </div>
          <button disabled={busy === 'supplier'} className={`${action} mt-3 w-full`}>
            Tambah supplier
          </button>
        </form>
      </section>
    </section>
  )
}

function Team({
  employees,
  customers,
  expenses,
  onSuccess,
}: {
  employees: Employee[]
  customers: CustomerAccount[]
  expenses: Expense[]
  onSuccess: () => Promise<void>
}) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function createCashier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      await postStaff({
        action: 'create-cashier',
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
      })
      event.currentTarget.reset()
      setMessage('Akun kasir berhasil dibuat.')
      await onSuccess()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Akun kasir gagal dibuat.')
    } finally {
      setBusy(false)
    }
  }
  async function createExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      await postStaff({
        action: 'create-expense',
        description: form.get('description'),
        amount: Number(form.get('amount')),
        category: form.get('category'),
      })
      event.currentTarget.reset()
      setMessage('Pengeluaran dicatat.')
      await onSuccess()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Pengeluaran gagal dicatat.')
    } finally {
      setBusy(false)
    }
  }
  async function updateEmployee(event: FormEvent<HTMLFormElement>, employee: Employee) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      await postStaff({
        action: 'update-employee',
        id: employee.id,
        role: form.get('role'),
        active: form.get('active') === 'on',
        cashierCanViewAllSales: form.get('cashierCanViewAllSales') === 'on',
      })
      setMessage(`Akses ${employee.name} diperbarui.`)
      await onSuccess()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Akses karyawan gagal diperbarui.')
    } finally {
      setBusy(false)
    }
  }
  async function updateCustomer(event: FormEvent<HTMLFormElement>, customer: CustomerAccount) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      await postStaff({
        action: 'update-customer',
        id: customer.id,
        points: Number(form.get('points')),
        stamps: Number(form.get('stamps')),
        active: form.get('active') === 'on',
      })
      setMessage(`Loyalty ${customer.name} diperbarui.`)
      await onSuccess()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Loyalty pelanggan gagal diperbarui.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-6">
      {message && (
        <p role="status" className="rounded-xl bg-[#e8f0eb] p-3 text-xs text-[#224b38]">
          {message}
        </p>
      )}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b765e]">
          Manajemen karyawan
        </p>
        <h2 className="mt-1 font-serif text-2xl">Akun staf</h2>
        <div className="mt-3 space-y-3">
          {employees.map((employee) => (
            <form
              onSubmit={(event) => updateEmployee(event, employee)}
              key={employee.id}
              className="rounded-2xl border border-[#e7d7c8] bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{employee.name}</p>
                  <p className="mt-1 break-all text-xs text-[#8f8177]">{employee.email}</p>
                </div>
                <select
                  name="role"
                  defaultValue={employee.role}
                  className="rounded-full bg-[#f4e5b8] px-2.5 py-1 text-[9px] font-bold uppercase"
                >
                  <option value="cashier">Kasir</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2">
                  <input name="active" type="checkbox" defaultChecked={employee.active} /> Akun
                  aktif
                </label>
                {employee.role === 'cashier' && (
                  <label className="flex items-center gap-2">
                    <input
                      name="cashierCanViewAllSales"
                      type="checkbox"
                      defaultChecked={employee.cashierCanViewAllSales}
                    />{' '}
                    Lihat semua penjualan
                  </label>
                )}
              </div>
              <button disabled={busy} className="mt-3 text-xs font-bold text-[#224b38]">
                Simpan akses
              </button>
            </form>
          ))}
        </div>
        <form onSubmit={createCashier} className="mt-4 rounded-2xl bg-[#f6e7d6] p-4">
          <h3 className="font-bold">Tambah kasir</h3>
          <div className="mt-3 space-y-2">
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="Nama kasir"
              className={field}
            />
            <input name="email" type="email" required placeholder="Email kasir" className={field} />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              placeholder="Kata sandi sementara"
              className={field}
            />
          </div>
          <button disabled={busy} className={`${action} mt-3 w-full`}>
            Buat akun kasir
          </button>
        </form>
      </section>
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b765e]">
          Database pelanggan
        </p>
        <h2 className="mt-1 font-serif text-2xl">Poin & stempel</h2>
        <div className="mt-3 space-y-3">
          {customers.length ? (
            customers.map((customer) => (
              <form
                key={customer.id}
                onSubmit={(event) => updateCustomer(event, customer)}
                className="rounded-2xl border border-[#e7d7c8] bg-white p-4"
              >
                <p className="font-bold">{customer.name}</p>
                <p className="mt-1 break-all text-xs text-[#8f8177]">{customer.email}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-bold text-[#8f8177]">
                    Poin
                    <input
                      name="points"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={customer.points}
                      className={`${field} mt-1`}
                    />
                  </label>
                  <label className="text-[10px] font-bold text-[#8f8177]">
                    Stempel
                    <input
                      name="stamps"
                      type="number"
                      min={0}
                      max={10}
                      step={1}
                      defaultValue={customer.stamps}
                      className={`${field} mt-1`}
                    />
                  </label>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs">
                    <input name="active" type="checkbox" defaultChecked={customer.active} /> Akun
                    aktif
                  </label>
                  <button disabled={busy} className="text-xs font-bold text-[#224b38]">
                    Simpan loyalty
                  </button>
                </div>
              </form>
            ))
          ) : (
            <Empty text="Belum ada akun Customer." />
          )}
        </div>
      </section>
      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b765e]">Laba rugi</p>
        <h2 className="mt-1 font-serif text-2xl">Catat pengeluaran</h2>
        <form
          onSubmit={createExpense}
          className="mt-4 rounded-2xl border border-[#e7d7c8] bg-white p-4"
        >
          <div className="space-y-2">
            <input
              name="description"
              required
              minLength={2}
              placeholder="Contoh: Belanja biji kopi"
              className={field}
            />
            <input
              name="amount"
              required
              type="number"
              min={0}
              placeholder="Jumlah"
              className={field}
            />
            <select name="category" className={field}>
              {['Bahan baku', 'Gaji', 'Sewa', 'Utilitas', 'Pemasaran', 'Lainnya'].map(
                (category) => (
                  <option key={category}>{category}</option>
                ),
              )}
            </select>
          </div>
          <button disabled={busy} className={`${action} mt-3 w-full`}>
            Catat pengeluaran
          </button>
        </form>
        <div className="mt-3 space-y-2">
          {expenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="flex justify-between rounded-xl bg-white p-3 text-xs">
              <span>{expense.description}</span>
              <strong>{rupiah(expense.amount)}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#ddcfc1] p-8 text-center text-sm text-[#8f8177]">
      {text}
    </div>
  )
}
