import type { Access, FieldAccess, PayloadRequest } from 'payload'

type AppRole = 'customer' | 'cashier' | 'owner'

export const getAppRole = (user: PayloadRequest['user']): AppRole | null => {
  if (user?.collection !== 'users') return null
  const role = (user as typeof user & { role?: AppRole }).role
  return role === 'owner' || role === 'cashier' ? role : 'customer'
}

export const isOwner = (user: PayloadRequest['user']) =>
  user?.collection === 'admins' || getAppRole(user) === 'owner'

export const isStaff = (user: PayloadRequest['user']) => {
  const role = getAppRole(user)
  return role === 'owner' || role === 'cashier'
}

export const ownerOnly: Access = ({ req }) => isOwner(req.user)
export const ownerField: FieldAccess = ({ req }) => isOwner(req.user)
export const staffOnly: Access = ({ req }) => isStaff(req.user)
