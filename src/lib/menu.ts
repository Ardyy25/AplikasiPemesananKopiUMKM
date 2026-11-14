import { getPayloadClient } from '@/lib/payload'

export type MenuProduct = {
  id: string
  name: string
  desc: string
  price: number
  category: string
  image: string
  tag: string
}

export async function getMenu(): Promise<MenuProduct[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    overrideAccess: false,
    depth: 1,
    limit: 100,
    sort: 'sortOrder',
    where: { active: { not_equals: false } },
  })
  return docs.map((product) => ({
    id: String(product.id),
    name: product.name,
    desc: product.description,
    price: product.price,
    category: product.category,
    image: product.image && typeof product.image === 'object' ? (product.image.url ?? '') : '',
    tag: product.tag ?? '',
  }))
}
