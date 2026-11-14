import type { CollectionConfig } from 'payload'
import { ownerOnly } from '@/access/staff'

export const Expenses: CollectionConfig = {
  slug: 'expenses',
  admin: { useAsTitle: 'description', group: 'Keuangan Kopikita' },
  access: { create: ownerOnly, read: ownerOnly, update: ownerOnly, delete: ownerOnly },
  fields: [
    { name: 'description', label: 'Keterangan', type: 'text', required: true },
    { name: 'amount', label: 'Jumlah', type: 'number', required: true, min: 0 },
    {
      name: 'category',
      label: 'Kategori',
      type: 'select',
      required: true,
      options: ['Bahan baku', 'Gaji', 'Sewa', 'Utilitas', 'Pemasaran', 'Lainnya'],
    },
    { name: 'expenseDate', label: 'Tanggal', type: 'date', required: true },
    { name: 'supplier', label: 'Supplier', type: 'relationship', relationTo: 'suppliers' },
  ],
}
