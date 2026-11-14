import type { CollectionConfig } from 'payload'
import { ownerOnly } from '@/access/staff'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  admin: { useAsTitle: 'name', group: 'Operasional Kopikita' },
  access: { create: ownerOnly, read: ownerOnly, update: ownerOnly, delete: ownerOnly },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'contactName', label: 'Nama kontak', type: 'text' },
    { name: 'phone', label: 'Nomor telepon', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'address', label: 'Alamat', type: 'textarea' },
    { name: 'notes', label: 'Catatan', type: 'textarea' },
  ],
}
