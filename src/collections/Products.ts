import type { Access, CollectionConfig } from 'payload'
import { isOwner, isStaff, ownerField } from '@/access/staff'

const ownerOnly: Access = ({ req }) => isOwner(req.user)

// Menu pages are intentional build-time snapshots; Publish applies CMS menu edits.
export const Products: CollectionConfig = {
  slug: 'products',
  admin: { useAsTitle: 'name', group: 'Kopikita', defaultColumns: ['name', 'category', 'price'] },
  access: { read: () => true, create: ownerOnly, update: ownerOnly, delete: ownerOnly },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'slug', useAsSlug: 'name' },
    { name: 'description', type: 'textarea', required: true },
    { name: 'price', type: 'number', required: true, min: 0 },
    {
      name: 'costPrice',
      label: 'Harga modal / HPP',
      type: 'number',
      min: 0,
      defaultValue: 0,
      access: { read: ownerField, create: ownerField, update: ownerField },
    },
    {
      name: 'stock',
      type: 'number',
      min: 0,
      defaultValue: 0,
      access: {
        read: ({ req }) => isStaff(req.user),
        create: ownerField,
        update: ownerField,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'lowStockThreshold',
      label: 'Batas stok menipis',
      type: 'number',
      min: 0,
      defaultValue: 5,
      access: {
        read: ({ req }) => isStaff(req.user),
        create: ownerField,
        update: ownerField,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    { name: 'category', type: 'select', required: true, options: ['Kopi', 'Non-kopi', 'Pastry'] },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'tag', type: 'text' },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
}
