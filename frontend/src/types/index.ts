export interface Product {
  id: number
  sku: string
  name: string
  brand: string
  category: string
  subcategory?: string
  description?: string
  colour: string
  dominant_colour?: string
  price: number
  original_price?: number
  sizes_available: string[]
  size_chart: Record<string, any>
  fit_type?: string
  material?: string
  occasion?: string
  tags: string[]
  rating: number
  review_count: number
  stock_quantity: number
  reorder_point: number
  image_url?: string
  active: boolean
  created_at?: string
}

export interface Customer {
  id: number
  display_name: string
  email?: string
  preferred_categories: string[]
  preferred_colours: string[]
  preferred_brands: string[]
  budget_min: number
  budget_max: number
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
  selected_size: string
}

export interface SearchFilters {
  category?: string
  colour?: string
  min_price?: number
  max_price?: number
  brand?: string
  occasion?: string
  keywords: string[]
}

export interface SearchResponse {
  items: Product[]
  total: number
  page: number
  limit: number
  pages: number
  query: string
  parsed_filters: SearchFilters
  parser_type: string
}

export interface VisualSearchResponse {
  items: Product[]
  extracted_colour: string
  extracted_histogram: Record<string, number>
  algorithm: string
  notes: string
}

export interface RecommendationItem {
  product: Product
  score: number
  explanation: string
}

export interface RecommendationResponse {
  customer_id?: number
  strategy: string
  items: RecommendationItem[]
}

export interface CompleteLookResponse {
  primary_product: Product
  outfit_items: Product[]
  total_outfit_price: number
  styling_notes: string
}

export interface SizeRequest {
  category?: string
  brand?: string
  height_cm: number
  chest_cm: number
  waist_cm: number
  hips_cm?: number
  preferred_fit: string
}

export interface SizeResponse {
  recommended_size: string
  fit_category: string
  confidence_score: number
  explanation: string
  size_chart_matched: Record<string, string>
  alternative_sizes: string[]
  disclaimer: string
}

export interface FunnelStep {
  step_name: string
  stage_key: string
  count: number
  conversion_from_prev: number
  drop_off_count: number
  drop_off_rate: number
  overall_conversion: number
}

export interface FunnelResponse {
  total_sessions: number
  steps: FunnelStep[]
  biggest_dropoff_stage: string
  methodology: string
}

export interface CohortRetentionWeek {
  week_index: number
  retention_rate: number | null
  observed?: boolean
  active_customers: number
}

export interface CohortRow {
  cohort_week: string
  cohort_size: number
  weeks: CohortRetentionWeek[]
}

export interface CohortResponse {
  cohorts: CohortRow[]
  period: string
}

export interface OverviewMetrics {
  total_revenue: number
  average_order_value: number
  total_sessions: number
  unique_visitors: number
  total_orders: number
  conversion_rate: number
  cart_abandonment_rate: number
  return_rate: number
  repeat_customer_rate: number
  total_products_active: number
}

export interface NorthStarResponse {
  north_star_name: string
  north_star_value: number
  supporting_metrics: Record<string, any>
  metric_tree_description: string
}

export interface ProductPerformanceItem {
  product_id: number
  name: string
  category: string
  views: number
  adds_to_cart: number
  purchases: number
  conversion_rate: number
  revenue: number
  return_count: number
  return_rate: number
}

export interface SegmentSummary {
  segment_name: string
  customer_count: number
  percentage: number
  average_spend: number
  strategy: string
}

export interface SegmentCustomer {
  customer_id: number
  name: string
  segment: string
  recency_days: number
  frequency_orders: number
  monetary_spend: number
  actionable_strategy: string
}

export interface SegmentationResponse {
  summary: SegmentSummary[]
  customers: SegmentCustomer[]
}

export interface VariantMetrics {
  variant: string
  sample_size: number
  conversions: number
  conversion_rate: number
  average_order_value: number
}

export interface ExperimentResults {
  relative_lift_available?: boolean
  attribution?: string
  experiment_id: number
  name: string
  status: string
  primary_metric: string
  control: VariantMetrics
  treatment: VariantMetrics
  absolute_difference: number
  relative_lift_pct: number
  p_value: number
  z_score: number
  confidence_interval_95: number[]
  is_statistically_significant: boolean
  statistical_test: string
  sample_size_adequate: boolean
  decision_recommendation: string
}

export interface Experiment {
  id: number
  name: string
  hypothesis: string
  description?: string
  primary_metric: string
  status: string
  traffic_percentage: number
  start_date?: string
  end_date?: string
  created_at: string
}

export interface FeatureFlag {
  id: number
  name: string
  description?: string
  enabled: boolean
  rollout_percentage: number
  updated_at: string
}

export interface InventoryAlertItem {
  product_id: number
  name: string
  category: string
  current_stock: number
  reorder_point: number
  status: string
  stock_coverage_days: number
  recommended_reorder_qty: number
}

export interface InventoryOverview {
  total_skus: number
  total_inventory_units: number
  total_inventory_valuation: number
  out_of_stock_count: number
  low_stock_count: number
  inventory_turnover_ratio: number
  alerts: InventoryAlertItem[]
}

export interface InventoryForecast {
  product_id: number
  product_name: string
  current_stock: number
  daily_run_rate_units: number
  days_until_stockout: number
  reorder_threshold: number
  status: string
  recommended_po_quantity: number
  historical_weekly_sales: number[]
}

export interface ReturnReasonBreakdown {
  reason: string
  count: number
  percentage: number
}

export interface CategoryReturnItem {
  category: string
  total_orders: number
  returned_orders: number
  return_rate: number
  primary_reason: string
}

export interface ReturnOverview {
  total_orders: number
  total_returns: number
  overall_return_rate: number
  size_related_returns_pct: number
  reasons: ReturnReasonBreakdown[]
  category_breakdown: CategoryReturnItem[]
  top_problematic_products: any[]
  recommendations: string[]
}

export interface CatalogueIssue {
  id: number
  product_id: number
  product_name: string
  issue_type: string
  severity: string
  description: string
  suggested_action?: string
  is_resolved: boolean
  created_at: string
}

export interface CatalogueQuality {
  total_products_checked: number
  catalogue_health_score: number
  critical_issues_count: number
  warning_issues_count: number
  issues_by_type: Record<string, number>
  issues: CatalogueIssue[]
}

export interface PromotionSimulateRequest {
  product_id: number
  discount_percentage: number
  price_elasticity: number
  estimated_cost_per_unit?: number
}

export interface PromotionSimulateResponse {
  product_id: number
  product_name: string
  baseline_price: number
  baseline_units_per_month: number
  baseline_revenue: number
  baseline_gross_margin_pct: number
  discount_percentage: number
  scenario_selling_price: number
  scenario_estimated_units: number
  scenario_projected_revenue: number
  scenario_projected_gross_profit: number
  scenario_gross_margin_pct: number
  revenue_delta_pct: number
  profit_delta_pct: number
  elasticity_applied: number
  assumptions_notice: string
}

export interface RoadmapTask {
  id: number
  title: string
  description?: string
  owner: string
  status: string
  priority: string
  reach: number
  impact: number
  confidence: number
  effort: number
  rice_score: number
  due_date?: string
  created_at: string
}

export interface Release {
  id: number
  version: string
  name: string
  target_date?: string
  status: string
  readiness_percentage: number
  checklist: Record<string, boolean>
  release_notes?: string
  created_at: string
  updated_at: string
}

export interface Feedback {
  id: number
  customer_id?: number
  product_id?: number
  feedback_type: string
  rating: number
  comment?: string
  source: string
  owner: string
  priority: string
  sentiment: string
  status: string
  created_at: string
}
