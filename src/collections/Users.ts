import type { Access, CollectionConfig, FieldAccess } from 'payload'
import { getAppRole, isOwner, ownerField } from '@/access/staff'

const adminField: FieldAccess = ({ req }) => req.user?.collection === 'admins'
const ownProfile: Access = ({ req }) => {
  if (isOwner(req.user)) return true
  if (req.user?.collection === 'users') return { id: { equals: req.user.id } }
  return false
}

const ownerOrOwnProfile: Access = ({ req }) => {
  if (isOwner(req.user)) return true
  if (req.user?.collection === 'users') return { id: { equals: req.user.id } }
  return false
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: { tokenExpiration: 60 * 60 * 24 * 7, maxLoginAttempts: 5, lockTime: 600000 },
  admin: { useAsTitle: 'name', group: 'Kopikita' },
  access: {
    admin: () => false,
    create: ({ req }) => !req.user || isOwner(req.user),
    read: ownProfile,
    update: ownerOrOwnProfile,
    delete: ({ req }) => isOwner(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true, minLength: 2, maxLength: 80 },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'customer',
      saveToJWT: true,
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Kasir', value: 'cashier' },
        { label: 'Owner', value: 'owner' },
      ],
      access: { create: ownerField, update: ownerField },
      admin: {
        position: 'sidebar',
        description:
          'Pendaftaran publik selalu menjadi Customer. Hanya Owner/pengelola yang dapat mengubah role.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      access: { create: ownerField, update: ownerField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'cashierCanViewAllSales',
      type: 'checkbox',
      defaultValue: false,
      saveToJWT: true,
      access: {
        create: ownerField,
        read: ({ req }) => req.user?.collection === 'users' || req.user?.collection === 'admins',
        update: ownerField,
      },
      admin: {
        condition: (_, siblingData) => siblingData.role === 'cashier',
        description: 'Jika aktif, kasir dapat melihat laporan penjualan seluruh kasir.',
      },
    },
    {
      name: 'points',
      type: 'number',
      defaultValue: 0,
      min: 0,
      validate: (value: number | null | undefined) =>
        value == null || Number.isSafeInteger(value) || 'Poin harus berupa bilangan bulat.',
      access: { create: adminField, update: ({ req }) => isOwner(req.user) },
      admin: { description: 'Saldo poin pelanggan. Hanya pengelola yang dapat mengubahnya.' },
    },
    {
      name: 'stamps',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 10,
      validate: (value: number | null | undefined) =>
        value == null || Number.isSafeInteger(value) || 'Stempel harus berupa bilangan bulat.',
      access: { create: adminField, update: ({ req }) => isOwner(req.user) },
    },
  ],
}
