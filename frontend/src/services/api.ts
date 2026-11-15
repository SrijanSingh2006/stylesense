import axios from 'axios'
import * as mock from './mockFallbackData'
import type {
  Product,
  Customer,
  SearchResponse,
  VisualSearchResponse,
  RecommendationResponse,
  CompleteLookResponse,
  SizeRequest,
  SizeResponse,
  FunnelResponse,
  CohortResponse,
  OverviewMetrics,
  NorthStarResponse,
  ProductPerformanceItem,
  SegmentationResponse,
  Experiment,
  ExperimentResults,
  FeatureFlag,
  InventoryOverview,
  InventoryForecast,
  ReturnOverview,
  CatalogueQuality,
  PromotionSimulateRequest,
  PromotionSimulateResponse,
  RoadmapTask,
  Release,
  Feedback,
} from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Offline synthetic fallback interceptor ensuring seamless web deployment preview
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const method = (error.config?.method || 'get').toLowerCase()

    if (url.includes('/products/') && method === 'get') {
      const parts = url.split('/')
      const id = parseInt(parts[parts.length - 1], 10)
      const found = mock.FALLBACK_PRODUCTS.find((p) => p.id === id) || mock.FALLBACK_PRODUCTS[0]
      return Promise.resolve({ data: found, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/products') && method === 'get') {
      return Promise.resolve({
        data: { items: mock.FALLBACK_PRODUCTS, total: mock.FALLBACK_PRODUCTS.length, page: 1, limit: 20, pages: 1 },
        status: 200,
        headers: {},
        config: error.config,
      })
    }

    if (url.includes('/search')) {
      return Promise.resolve({
        data: {
          items: mock.FALLBACK_PRODUCTS,
          total: mock.FALLBACK_PRODUCTS.length,
          page: 1,
          limit: 20,
          pages: 1,
          extracted_facets: { query: 'casual' },
        },
        status: 200,
        headers: {},
        config: error.config,
      })
    }

    if (url.includes('/visual-search')) {
      return Promise.resolve({
        data: {
          items: mock.FALLBACK_PRODUCTS.slice(0, 4),
          extracted_features: { dominant_colour: 'Navy', detected_category: 'Jeans' },
          confidence_score: 0.94,
        },
        status: 200,
        headers: {},
        config: error.config,
      })
    }

    if (url.includes('/recommendations')) {
      return Promise.resolve({
        data: {
          items: mock.FALLBACK_PRODUCTS.slice(0, 4).map((p) => ({
            product: p,
            score: 0.92,
            explanation: 'Curated according to your style preferences and browsing affinity',
          })),
          strategy: 'collaborative_and_content_synergy',
        },
        status: 200,
        headers: {},
        config: error.config,
      })
    }

    if (url.includes('/complete-look')) {
      return Promise.resolve({
        data: {
          primary_product: mock.FALLBACK_PRODUCTS[0],
          outfit_items: [mock.FALLBACK_PRODUCTS[1], mock.FALLBACK_PRODUCTS[2]],
          styling_notes: 'Effortlessly pair the crisp oxford shirt with raw indigo denim and handcrafted leather sneakers.',
          total_outfit_price: 1899 + 3499 + 4299,
        },
        status: 200,
        headers: {},
        config: error.config,
      })
    }

    if (url.includes('/size-assistant/recommend')) {
      return Promise.resolve({
        data: {
          recommended_size: 'M',
          confidence_score: 0.88,
          fit_prediction: 'Regular Comfortable Fit',
          explanation: 'Based on standard 40" chest and preferred comfort profile',
          size_chart_reference: { M: { chest: 40, length: 29 } },
        },
        status: 200,
        headers: {},
        config: error.config,
      })
    }

    if (url.includes('/orders') && method === 'post') {
      return Promise.resolve({
        data: {
          id: Math.floor(Math.random() * 9000) + 1000,
          customer_id: 1,
          total_amount: 5398,
          status: 'COMPLETED',
          created_at: new Date().toISOString(),
          items: [],
        },
        status: 200,
        headers: {},
        config: error.config,
      })
    }

    if (url.includes('/analytics/overview')) {
      return Promise.resolve({ data: mock.FALLBACK_OVERVIEW, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/analytics/north-star')) {
      return Promise.resolve({ data: mock.FALLBACK_NORTH_STAR, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/analytics/funnel')) {
      return Promise.resolve({ data: mock.FALLBACK_FUNNEL, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/analytics/cohorts')) {
      return Promise.resolve({ data: mock.FALLBACK_COHORTS, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/analytics/segments')) {
      return Promise.resolve({ data: mock.FALLBACK_SEGMENTS, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/experiments') && url.includes('/results')) {
      return Promise.resolve({ data: mock.FALLBACK_EXPERIMENT_RESULTS, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/experiments') && method === 'get') {
      return Promise.resolve({ data: mock.FALLBACK_EXPERIMENTS, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/inventory') && method === 'get') {
      return Promise.resolve({ data: mock.FALLBACK_INVENTORY, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/returns')) {
      return Promise.resolve({ data: mock.FALLBACK_RETURNS, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/catalogue-quality')) {
      return Promise.resolve({ data: mock.FALLBACK_CATALOGUE, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/pricing/simulate')) {
      return Promise.resolve({
        data: {
          product_id: 101,
          base_price: 1899,
          discount_percentage: 20,
          discounted_price: 1519.2,
          baseline_units: 100,
          simulated_units: 136,
          baseline_revenue: 189900,
          simulated_revenue: 206611.2,
          revenue_delta_percentage: 8.8,
          baseline_gross_margin: 94950,
          simulated_gross_margin: 97819.2,
          gross_margin_delta_percentage: 3.02,
          pm_recommendation: 'Positive margin tradeoff. The 20% discount generates +8.8% GMV revenue lift with preserved gross profitability.',
        },
        status: 200,
        headers: {},
        config: error.config,
      })
    }

    if (url.includes('/roadmap') && method === 'get') {
      return Promise.resolve({ data: mock.FALLBACK_ROADMAP, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/releases') && method === 'get') {
      return Promise.resolve({ data: mock.FALLBACK_RELEASES, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/feature-flags') && method === 'get') {
      return Promise.resolve({ data: mock.FALLBACK_FLAGS, status: 200, headers: {}, config: error.config })
    }

    if (url.includes('/feedback') && method === 'get') {
      return Promise.resolve({
        data: [
          { id: 1, comment: 'Fit assistant helped me choose size M perfectly! No return needed.', source: 'Storefront Review', feedback_type: 'FIT_ACCURACY', rating: 5.0, priority: 'LOW', status: 'TRIAGED', created_at: new Date().toISOString() },
          { id: 2, comment: 'Would love to see visual search handle matching accessories.', source: 'User Interview', feedback_type: 'FEATURE_REQUEST', rating: 4.0, priority: 'HIGH', status: 'NEW', created_at: new Date().toISOString() },
        ],
        status: 200,
        headers: {},
        config: error.config,
      })
    }

    return Promise.reject(error)
  }
)

// Products & Search
export const fetchProducts = async (params: Record<string, any> = {}) => {
  const res = await api.get<{ items: Product[]; total: number; page: number; limit: number; pages: number }>('/products', { params })
  return res.data
}

export const fetchProductById = async (id: number) => {
  const res = await api.get<Product>(`/products/${id}`)
  return res.data
}

export const searchProducts = async (payload: {
  query?: string
  category?: string
  colour?: string
  brand?: string
  min_price?: number
  max_price?: number
  sort_by?: string
  page?: number
  limit?: number
}) => {
  const res = await api.post<SearchResponse>('/search', payload)
  return res.data
}

export const visualSearch = async (formData: FormData) => {
  const res = await api.post<VisualSearchResponse>('/visual-search', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// Recommendations & Size
export const fetchRecommendations = async (customerId: number, limit = 10, category?: string) => {
  const res = await api.get<RecommendationResponse>(`/recommendations/${customerId}`, {
    params: { limit, category },
  })
  return res.data
}

export const fetchCompleteLook = async (customerId: number, productId?: number) => {
  const res = await api.get<CompleteLookResponse>(`/recommendations/${customerId}/complete-look`, {
    params: { product_id: productId },
  })
  return res.data
}

export const calculateSize = async (req: SizeRequest) => {
  const res = await api.post<SizeResponse>('/size-recommendation', req)
  return res.data
}

// Shopping & Events
export const recordCartEvent = async (payload: {
  customer_id?: number
  session_id: string
  product_id: number
  action: string
  quantity: number
  selected_size?: string
}) => {
  const res = await api.post('/cart/events', payload)
  return res.data
}

export const createOrder = async (payload: {
  customer_id: number
  session_id?: string
  items: Array<{ product_id: number; quantity: number; selected_size?: string }>
}) => {
  const res = await api.post('/orders', payload)
  return res.data
}

export const trackEvent = async (payload: {
  customer_id?: number
  session_id: string
  product_id?: number
  event_type: string
  metadata?: Record<string, any>
  experiment_id?: number
  variant?: string
}) => {
  const res = await api.post('/events', payload)
  return res.data
}

// Product Analytics
export const fetchOverviewMetrics = async (days = 30) => {
  const res = await api.get<OverviewMetrics>('/analytics/overview', { params: { days } })
  return res.data
}

export const fetchFunnel = async (days = 30) => {
  const res = await api.get<FunnelResponse>('/analytics/funnel', { params: { days } })
  return res.data
}

export const fetchCohorts = async () => {
  const res = await api.get<CohortResponse>('/analytics/cohorts')
  return res.data
}

export const fetchProductPerformance = async (limit = 50) => {
  const res = await api.get<ProductPerformanceItem[]>('/analytics/products', { params: { limit } })
  return res.data
}

export const fetchNorthStar = async () => {
  const res = await api.get<NorthStarResponse>('/analytics/north-star')
  return res.data
}

export const fetchSegments = async () => {
  const res = await api.get<SegmentationResponse>('/segments')
  return res.data
}

// Experimentation & Flags
export const fetchExperiments = async () => {
  const res = await api.get<Experiment[]>('/experiments')
  return res.data
}

export const createExperiment = async (data: Partial<Experiment>) => {
  const res = await api.post<Experiment>('/experiments', data)
  return res.data
}

export const updateExperiment = async (id: number, data: Partial<Experiment>) => {
  const res = await api.patch<Experiment>(`/experiments/${id}`, data)
  return res.data
}

export const fetchExperimentResults = async (id: number) => {
  const res = await api.get<ExperimentResults>(`/experiments/${id}/results`)
  return res.data
}

export const assignExperiment = async (expId: number, customerId: number) => {
  const res = await api.post<{ experiment_id: number; customer_id: number; variant: string }>(
    `/experiments/${expId}/assign`,
    null,
    { params: { customer_id: customerId } }
  )
  return res.data
}

export const fetchFeatureFlags = async () => {
  const res = await api.get<FeatureFlag[]>('/feature-flags')
  return res.data
}

export const updateFeatureFlag = async (id: number, data: Partial<FeatureFlag>) => {
  const res = await api.patch<FeatureFlag>(`/feature-flags/${id}`, data)
  return res.data
}

// Business Operations
export const fetchInventory = async () => {
  const res = await api.get<InventoryOverview>('/inventory')
  return res.data
}

export const fetchInventoryForecast = async (productId: number) => {
  const res = await api.get<InventoryForecast>(`/inventory/forecast/${productId}`)
  return res.data
}

export const createInventoryMovement = async (payload: {
  product_id: number
  movement_type: string
  quantity: number
  reference?: string
}) => {
  const res = await api.post('/inventory/movements', payload)
  return res.data
}

export const fetchReturns = async () => {
  const res = await api.get<ReturnOverview>('/returns/overview')
  return res.data
}

export const fetchCatalogueQuality = async () => {
  const res = await api.get<CatalogueQuality>('/catalogue/quality')
  return res.data
}

export const resolveCatalogueIssue = async (id: number) => {
  const res = await api.patch(`/catalogue/issues/${id}`, { is_resolved: true })
  return res.data
}

export const simulatePromotion = async (req: PromotionSimulateRequest) => {
  const res = await api.post<PromotionSimulateResponse>('/promotions/simulate', req)
  return res.data
}

// Roadmap, Releases & Feedback
export const fetchRoadmapTasks = async (status?: string) => {
  const res = await api.get<RoadmapTask[]>('/roadmap/tasks', { params: { status } })
  return res.data
}

export const createRoadmapTask = async (data: Partial<RoadmapTask>) => {
  const res = await api.post<RoadmapTask>('/roadmap/tasks', data)
  return res.data
}

export const updateRoadmapTask = async (id: number, data: Partial<RoadmapTask>) => {
  const res = await api.patch<RoadmapTask>(`/roadmap/tasks/${id}`, data)
  return res.data
}

export const deleteRoadmapTask = async (id: number) => {
  const res = await api.delete(`/roadmap/tasks/${id}`)
  return res.data
}

export const fetchReleases = async () => {
  const res = await api.get<Release[]>('/releases')
  return res.data
}

export const updateRelease = async (id: number, data: Partial<Release>) => {
  const res = await api.patch<Release>(`/releases/${id}`, data)
  return res.data
}

export const fetchFeedback = async () => {
  const res = await api.get<Feedback[]>('/feedback')
  return res.data
}

export const createFeedback = async (data: Partial<Feedback>) => {
  const res = await api.post<Feedback>('/feedback', data)
  return res.data
}

export const updateFeedback = async (id: number, data: Partial<Feedback>) => {
  const res = await api.patch<Feedback>(`/feedback/${id}`, data)
  return res.data
}
