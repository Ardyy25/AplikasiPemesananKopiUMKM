import type {
  CollectionAfterChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Where,
} from 'payload'
import { getAppRole, isOwner, isStaff, ownerField, ownerOnly, staffOnly } from '@/access/staff'

const prepareSale: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data
  if (!isStaff(req.user) || req.user?.collection !== 'users') {
    throw new Error('Hanya Kasir atau Owner aktif yang dapat membuat transaksi.')
  }
  const staff = await req.payload.findByID({
    collection: 'users',
    id: req.user.id,
    overrideAccess: true,
    req,
  })
  if (staff.active === false) throw new Error('Akun staf sedang dinonaktifkan.')

  const rawItems = Array.isArray(data.items) ? data.items : []
  if (!rawItems.length) throw new Error('Transaksi harus memiliki minimal satu produk.')

  let subtotal = 0
  let totalCost = 0
  const items = []
  for (const rawItem of rawItems) {
    const quantity = Number(rawItem.quantity)
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new Error('Jumlah produk harus berupa bilangan bulat antara 1 dan 100.')
    }
    const productID =
      typeof rawItem.product === 'object' && rawItem.product ? rawItem.product.id : rawItem.product
    const product = await req.payload.findByID({
      collection: 'products',
      id: productID,
      overrideAccess: true,
      req,
    })
    if (product.active === false) throw new Error(`${product.name} sedang tidak dijual.`)
    if ((product.stock ?? 0) < quantity) throw new Error(`Stok ${product.name} tidak mencukupi.`)
    const unitPrice = product.price
    const unitCost = product.costPrice ?? 0
    subtotal += unitPrice * quantity
    totalCost += unitCost * quantity
    items.push({
      product: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      unitCost,
      lineTotal: unitPrice * quantity,
    })
  }
  if (Number(data.amountPaid ?? 0) < subtotal) throw new Error('Jumlah pembayaran belum mencukupi.')
  return {
    ...data,
    cashier: req.user.id,
    receiptNumber: `KK-${Date.now().toString(36).toUpperCase()}`,
    items,
    subtotal,
    total: subtotal,
    totalCost,
    grossProfit: subtotal - totalCost,
    status: 'completed',
    change: Math.max(0, Number(data.amountPaid ?? 0) - subtotal),
  }
}

const reduceStock: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  for (const item of doc.items ?? []) {
    const productID = typeof item.product === 'object' ? item.product.id : item.product
    const product = await req.payload.findByID({
      collection: 'products',
      id: productID,
      overrideAccess: true,
      req,
    })
    await req.payload.update({
      collection: 'products',
      id: productID,
      data: { stock: Math.max(0, (product.stock ?? 0) - item.quantity) },
      overrideAccess: true,
      req,
    })
  }
  return doc
}

export const Sales: CollectionConfig = {
  slug: 'sales',
  admin: {
    useAsTitle: 'receiptNumber',
    group: 'Keuangan Kopikita',
    defaultColumns: ['receiptNumber', 'cashier', 'total', 'paymentMethod', 'createdAt'],
  },
  access: {
    create: staffOnly,
    read: ({ req }) => {
      if (isOwner(req.user)) return true
      if (req.user?.collection !== 'users') return false
      if (getAppRole(req.user) === 'cashier') {
        if (req.user.cashierCanViewAllSales) return true
        const ownSales: Where = { cashier: { equals: req.user.id } }
        return ownSales
      }
      const ownPurchases: Where = { customer: { equals: req.user.id } }
      return ownPurchases
    },
    update: ownerOnly,
    delete: ownerOnly,
  },
  hooks: { beforeValidate: [prepareSale], afterChange: [reduceStock] },
  fields: [
    {
      name: 'receiptNumber',
      label: 'Nomor struk',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    { name: 'cashier', label: 'Kasir', type: 'relationship', relationTo: 'users', required: true },
    { name: 'customer', type: 'relationship', relationTo: 'users' },
    {
      name: 'items',
      label: 'Item transaksi',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'productName', label: 'Nama produk', type: 'text', required: true },
        { name: 'quantity', label: 'Jumlah', type: 'number', required: true, min: 1 },
        { name: 'unitPrice', label: 'Harga satuan', type: 'number', required: true, min: 0 },
        {
          name: 'unitCost',
          label: 'HPP satuan',
          type: 'number',
          required: true,
          min: 0,
          access: { read: ownerField },
        },
        { name: 'lineTotal', label: 'Subtotal item', type: 'number', required: true, min: 0 },
      ],
    },
    { name: 'subtotal', type: 'number', required: true, min: 0 },
    { name: 'total', type: 'number', required: true, min: 0 },
    {
      name: 'totalCost',
      label: 'Total HPP',
      type: 'number',
      required: true,
      min: 0,
      access: { read: ownerField },
    },
    {
      name: 'grossProfit',
      label: 'Laba kotor',
      type: 'number',
      required: true,
      access: { read: ownerField },
    },
    {
      name: 'paymentMethod',
      label: 'Metode pembayaran',
      type: 'select',
      required: true,
      options: [
        { label: 'Tunai', value: 'cash' },
        { label: 'QRIS', value: 'qris' },
        { label: 'Kartu', value: 'card' },
      ],
    },
    { name: 'amountPaid', label: 'Jumlah dibayar', type: 'number', required: true, min: 0 },
    { name: 'change', label: 'Kembalian', type: 'number', required: true, min: 0 },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: ['completed', 'void'],
      defaultValue: 'completed',
    },
  ],
}
