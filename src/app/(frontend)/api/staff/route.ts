import { appAuth } from '@/lib/app-auth'
import { getPayloadClient } from '@/lib/payload'

const noStore = { 'Cache-Control': 'private, no-store' }
type Role = 'customer' | 'cashier' | 'owner'

function roleOf(user: Awaited<ReturnType<typeof appAuth.currentUser>>): Role {
  return user?.role === 'owner' || user?.role === 'cashier' ? user.role : 'customer'
}

function jsonError(error: string, status = 400, errors?: Record<string, string>) {
  return Response.json({ error, errors }, { status, headers: noStore })
}

function requestAllowed(request: Request) {
  const origin = request.headers.get('origin')
  const allowed = [process.env.FIGMA_PUBLIC_URL, process.env.NEXT_PUBLIC_SITE_URL]
    .filter(Boolean)
    .map((value) => new URL(value!).origin)
  if (process.env.NODE_ENV === 'development')
    allowed.push(`http://localhost:${process.env.PORT || 3000}`)
  return (
    !!origin &&
    allowed.includes(origin) &&
    request.headers.get('content-type')?.includes('application/json')
  )
}

export async function GET() {
  const user = await appAuth.currentUser()
  const role = roleOf(user)
  if (!user || role === 'customer' || user.active === false)
    return jsonError('Akses staf diperlukan.', 403)
  const payload = await getPayloadClient()
  const [products, sales] = await Promise.all([
    payload.find({
      collection: 'products',
      user,
      overrideAccess: false,
      depth: 0,
      limit: 100,
      sort: 'sortOrder',
    }),
    payload.find({
      collection: 'sales',
      user,
      overrideAccess: false,
      depth: 1,
      limit: 50,
      sort: '-createdAt',
    }),
  ])

  const response: Record<string, unknown> = {
    role,
    products: products.docs.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      active: product.active !== false,
      ...(role === 'owner' ? { costPrice: product.costPrice ?? 0 } : {}),
    })),
    sales: sales.docs.map((sale) => ({
      id: sale.id,
      receiptNumber: sale.receiptNumber,
      cashier: typeof sale.cashier === 'object' && sale.cashier ? sale.cashier.name : 'Kasir',
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      createdAt: sale.createdAt,
      ...(role === 'owner'
        ? { grossProfit: sale.grossProfit ?? 0, totalCost: sale.totalCost ?? 0 }
        : {}),
    })),
  }
  if (role === 'owner') {
    const [people, expenses] = await Promise.all([
      payload.find({
        collection: 'users',
        user,
        overrideAccess: false,
        depth: 0,
        limit: 100,
        sort: 'name',
      }),
      payload.find({
        collection: 'expenses',
        user,
        overrideAccess: false,
        depth: 0,
        limit: 100,
        sort: '-expenseDate',
      }),
    ])
    response.employees = people.docs
      .filter((employee) => employee.role === 'cashier' || employee.role === 'owner')
      .map((employee) => ({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: roleOf(employee),
        active: employee.active !== false,
        cashierCanViewAllSales: employee.cashierCanViewAllSales === true,
      }))
    response.customers = people.docs
      .filter((customer) => customer.role !== 'cashier' && customer.role !== 'owner')
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        points: customer.points ?? 0,
        stamps: customer.stamps ?? 0,
        active: customer.active !== false,
      }))
    response.expenses = expenses.docs.map((expense) => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      expenseDate: expense.expenseDate,
    }))
    const suppliers = await payload.find({
      collection: 'suppliers',
      user,
      overrideAccess: false,
      depth: 0,
      limit: 100,
      sort: 'name',
    })
    response.suppliers = suppliers.docs.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      phone: supplier.phone,
    }))
  }
  return Response.json(response, { headers: noStore })
}

export async function POST(request: Request) {
  if (!requestAllowed(request)) return jsonError('Permintaan tidak diizinkan.', 403)
  const user = await appAuth.currentUser()
  const role = roleOf(user)
  if (!user || role === 'customer' || user.active === false)
    return jsonError('Akses staf diperlukan.', 403)

  let body: Record<string, unknown>
  try {
    body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error()
  } catch {
    return jsonError('Data tidak valid.')
  }
  const payload = await getPayloadClient()

  try {
    if (body.action === 'checkout') {
      const rawItems = Array.isArray(body.items) ? body.items : []
      const items = rawItems
        .map((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) return null
          const value = item as Record<string, unknown>
          const product = typeof value.product === 'string' ? value.product : ''
          const quantity = Number(value.quantity)
          return product && Number.isSafeInteger(quantity) && quantity > 0 && quantity <= 100
            ? { product, quantity }
            : null
        })
        .filter((item): item is { product: string; quantity: number } => !!item)
      if (!items.length || items.length !== rawItems.length)
        return jsonError('Item transaksi tidak valid.')
      const paymentMethod = ['cash', 'qris', 'card'].includes(String(body.paymentMethod))
        ? (String(body.paymentMethod) as 'cash' | 'qris' | 'card')
        : null
      const amountPaid = Number(body.amountPaid)
      if (!paymentMethod || !Number.isFinite(amountPaid) || amountPaid < 0)
        return jsonError('Pembayaran tidak valid.')
      const sale = await payload.create({
        collection: 'sales',
        user,
        overrideAccess: false,
        data: {
          items: items.map((item) => ({
            ...item,
            productName: 'pending',
            unitPrice: 0,
            unitCost: 0,
            lineTotal: 0,
          })),
          paymentMethod,
          amountPaid,
          change: 0,
          receiptNumber: 'pending',
          cashier: user.id,
          subtotal: 0,
          total: 0,
          totalCost: 0,
          grossProfit: 0,
          status: 'completed',
        },
      })
      return Response.json(
        {
          success: true,
          receiptNumber: sale.receiptNumber,
          total: sale.total,
          change: sale.change,
        },
        { headers: noStore },
      )
    }

    if (role !== 'owner') return jsonError('Hanya Owner yang dapat melakukan tindakan ini.', 403)

    if (body.action === 'create-cashier') {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      const errors: Record<string, string> = {}
      if (name.length < 2 || name.length > 80) errors.name = 'Nama harus berisi 2–80 karakter.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email tidak valid.'
      if (password.length < 8 || password.length > 128)
        errors.password = 'Kata sandi harus 8–128 karakter.'
      if (Object.keys(errors).length) return jsonError('Periksa data kasir.', 400, errors)
      await payload.create({
        collection: 'users',
        user,
        overrideAccess: false,
        data: { name, email, password, role: 'cashier', active: true },
      })
      return Response.json({ success: true }, { headers: noStore })
    }

    if (body.action === 'update-product') {
      const id = typeof body.id === 'string' ? body.id : ''
      const price = Number(body.price)
      const costPrice = Number(body.costPrice)
      const stock = Number(body.stock)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const description = typeof body.description === 'string' ? body.description.trim() : ''
      const category = ['Kopi', 'Non-kopi', 'Pastry'].includes(String(body.category))
        ? (String(body.category) as 'Kopi' | 'Non-kopi' | 'Pastry')
        : null
      if (
        !id ||
        name.length < 2 ||
        description.length < 2 ||
        !category ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(costPrice) ||
        costPrice < 0 ||
        !Number.isSafeInteger(stock) ||
        stock < 0
      )
        return jsonError('Data produk tidak valid.')
      await payload.update({
        collection: 'products',
        id,
        user,
        overrideAccess: false,
        data: {
          name,
          description,
          category,
          price,
          costPrice,
          stock,
          active: body.active !== false,
        },
      })
      return Response.json({ success: true }, { headers: noStore })
    }

    if (body.action === 'create-product') {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const description = typeof body.description === 'string' ? body.description.trim() : ''
      const category = ['Kopi', 'Non-kopi', 'Pastry'].includes(String(body.category))
        ? (String(body.category) as 'Kopi' | 'Non-kopi' | 'Pastry')
        : null
      const price = Number(body.price)
      const costPrice = Number(body.costPrice)
      const stock = Number(body.stock)
      if (
        name.length < 2 ||
        description.length < 2 ||
        !category ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(costPrice) ||
        costPrice < 0 ||
        !Number.isSafeInteger(stock) ||
        stock < 0
      )
        return jsonError('Data produk baru tidak valid.')
      await payload.create({
        collection: 'products',
        user,
        overrideAccess: false,
        data: { name, slug: name, description, category, price, costPrice, stock, active: true },
      })
      return Response.json({ success: true }, { headers: noStore })
    }

    if (body.action === 'delete-product') {
      const id = typeof body.id === 'string' ? body.id : ''
      if (!id) return jsonError('Produk tidak valid.')
      const used = await payload.count({
        collection: 'sales',
        user,
        overrideAccess: false,
        where: { 'items.product': { equals: id } },
      })
      if (used.totalDocs > 0)
        return jsonError(
          'Produk sudah memiliki riwayat transaksi. Nonaktifkan produk agar laporan lama tetap utuh.',
        )
      await payload.delete({ collection: 'products', id, user, overrideAccess: false })
      return Response.json({ success: true }, { headers: noStore })
    }

    if (body.action === 'update-employee') {
      const id = typeof body.id === 'string' ? body.id : ''
      const employeeRole =
        body.role === 'owner' ? 'owner' : body.role === 'cashier' ? 'cashier' : null
      if (!id || !employeeRole) return jsonError('Data karyawan tidak valid.')
      await payload.update({
        collection: 'users',
        id,
        user,
        overrideAccess: false,
        data: {
          role: employeeRole,
          active: body.active !== false,
          cashierCanViewAllSales:
            employeeRole === 'cashier' && body.cashierCanViewAllSales === true,
        },
      })
      return Response.json({ success: true }, { headers: noStore })
    }

    if (body.action === 'update-customer') {
      const id = typeof body.id === 'string' ? body.id : ''
      const points = Number(body.points)
      const stamps = Number(body.stamps)
      if (
        !id ||
        !Number.isSafeInteger(points) ||
        points < 0 ||
        !Number.isSafeInteger(stamps) ||
        stamps < 0 ||
        stamps > 10
      )
        return jsonError('Saldo loyalty pelanggan tidak valid.')
      await payload.update({
        collection: 'users',
        id,
        user,
        overrideAccess: false,
        data: { points, stamps, active: body.active !== false },
      })
      return Response.json({ success: true }, { headers: noStore })
    }

    if (body.action === 'create-expense') {
      const description = typeof body.description === 'string' ? body.description.trim() : ''
      const amount = Number(body.amount)
      const allowedCategories = [
        'Bahan baku',
        'Gaji',
        'Sewa',
        'Utilitas',
        'Pemasaran',
        'Lainnya',
      ] as const
      const category = allowedCategories.find((value) => value === String(body.category))
      if (description.length < 2 || !Number.isFinite(amount) || amount < 0 || !category)
        return jsonError('Data pengeluaran tidak valid.')
      await payload.create({
        collection: 'expenses',
        user,
        overrideAccess: false,
        data: { description, amount, category, expenseDate: new Date().toISOString() },
      })
      return Response.json({ success: true }, { headers: noStore })
    }
    if (body.action === 'create-supplier') {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const contactName = typeof body.contactName === 'string' ? body.contactName.trim() : ''
      const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
      if (name.length < 2) return jsonError('Nama supplier minimal 2 karakter.')
      await payload.create({
        collection: 'suppliers',
        user,
        overrideAccess: false,
        data: { name, contactName, phone },
      })
      return Response.json({ success: true }, { headers: noStore })
    }
    if (body.action === 'delete-supplier') {
      const id = typeof body.id === 'string' ? body.id : ''
      if (!id) return jsonError('Supplier tidak valid.')
      const used = await payload.count({
        collection: 'expenses',
        user,
        overrideAccess: false,
        where: { supplier: { equals: id } },
      })
      if (used.totalDocs > 0)
        return jsonError('Supplier sudah terhubung ke pengeluaran dan tidak dapat dihapus.')
      await payload.delete({ collection: 'suppliers', id, user, overrideAccess: false })
      return Response.json({ success: true }, { headers: noStore })
    }
    return jsonError('Tindakan tidak dikenal.')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operasi gagal.'
    return jsonError(message)
  }
}
