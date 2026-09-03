export interface CategoryItem {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
}

export interface ProductItem {
  id: string
  name: string
  slug: string
  description: string
  categoryId: string
  categoryName?: string
  price: number | null
  unit: string
  minOrderQty: number
  inStock: boolean
  featured: boolean
  specs: Record<string, string> | null
  imageUrl: string | null
}

export interface InquiryItem {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  subject: string
  message: string
  status: 'PENDING' | 'REVIEWED' | 'CONTACTED' | 'COMPLETED'
  createdAt: Date
}

export interface QuoteRequestItem {
  id: string
  clientName: string
  email: string
  phone: string
  companyName: string | null
  productName: string
  quantity: number
  unit: string
  targetPrice: number | null
  deliveryLocation: string | null
  notes: string | null
  status: 'PENDING' | 'QUOTED' | 'ACCEPTED' | 'REJECTED'
  createdAt: Date
}

export const MOCK_CATEGORIES: CategoryItem[] = []
export const MOCK_PRODUCTS: ProductItem[] = []
