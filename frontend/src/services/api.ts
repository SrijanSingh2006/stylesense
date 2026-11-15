import axios from "axios";
import { useAuthStore, type AuthReply } from "../auth/state";
declare module "axios" {
  interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _quiet?: boolean;
    _retriedAuth?: boolean;
    _authUserId?: number | null;
  }
}
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
} from "../types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  config._authUserId = state.user?.id ?? null;
  if (state.accessToken)
    config.headers.set("Authorization", `Bearer ${state.accessToken}`);
  else config.headers.delete("Authorization");
  if (state.csrfToken) config.headers.set("X-CSRF-Token", state.csrfToken);
  return config;
});
let refreshPromise: Promise<AuthReply> | null = null;
export function refreshSession(): Promise<AuthReply> {
  if (!refreshPromise) {
    const revision = useAuthStore.getState().revision;
    refreshPromise = (async () => {
      const options = { _skipAuthRefresh: true, _quiet: true };
      if (!useAuthStore.getState().csrfToken) {
        const result = await api.get("/auth/csrf", options);
        if (useAuthStore.getState().revision !== revision)
          throw new axios.CanceledError("Account context changed");
        useAuthStore.setState({ csrfToken: result.data.csrf_token });
      }
      const reply = (await api.post<AuthReply>("/auth/refresh", {}, options))
        .data;
      if (useAuthStore.getState().revision === revision)
        useAuthStore.getState().accept(reply);
      return reply;
    })()
      .catch((error) => {
        if (useAuthStore.getState().revision === revision)
          useAuthStore.getState().clear();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}
api.interceptors.response.use(
  (response) => {
    if (
      response.config._authUserId !== (useAuthStore.getState().user?.id ?? null)
    )
      throw new axios.CanceledError("Account context changed", response.config);
    return response;
  },
  async (error) => {
    const config = error.config;
    if (
      config &&
      config._authUserId !== (useAuthStore.getState().user?.id ?? null) &&
      error.response?.status === 401
    )
      return Promise.reject(error);
    if (
      error.response?.status === 401 &&
      config &&
      !config._skipAuthRefresh &&
      !config._retriedAuth
    ) {
      config._retriedAuth = true;
      try {
        await refreshSession();
      } catch {
        return Promise.reject(error);
      }
      if (
        config._authUserId !== null &&
        config._authUserId !== (useAuthStore.getState().user?.id ?? null)
      )
        return Promise.reject(
          new axios.CanceledError("Account context changed", config),
        );
      return api.request(config);
    }
    if (error.response?.status === 401 && config?._retriedAuth)
      useAuthStore.getState().clear();
    if (!config?._quiet && typeof window !== "undefined")
      window.dispatchEvent(
        new CustomEvent("stylesense-api-error", { detail: error }),
      );
    return Promise.reject(error);
  },
);
export const fetchWishlist = async (_customerId?: number): Promise<Product[]> =>
  (await api.get("/users/me/wishlist")).data;
export const saveWishlist = async (_customerId: number, productId: number) =>
  api.put(`/users/me/wishlist/${productId}`);
export const removeWishlist = async (_customerId: number, productId: number) =>
  api.delete(`/users/me/wishlist/${productId}`);

// Products & Search
export const fetchProducts = async (params: Record<string, any> = {}) => {
  const res = await api.get<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }>("/products", { params });
  return res.data;
};

export const fetchProductById = async (id: number) => {
  const res = await api.get<Product>(`/products/${id}`);
  return res.data;
};

export const searchProducts = async (payload: {
  query?: string;
  category?: string;
  colour?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await api.post<SearchResponse>("/search", payload);
  return res.data;
};

export const visualSearch = async (formData: FormData) => {
  const res = await api.post<VisualSearchResponse>("/visual-search", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Recommendations & Size
export const fetchRecommendations = async (
  customerId: number,
  limit = 10,
  category?: string,
) => {
  const res = await api.get<RecommendationResponse>(
    `/recommendations/${customerId}`,
    {
      params: { limit, category },
    },
  );
  return res.data;
};

export const fetchCompleteLook = async (
  customerId: number,
  productId?: number,
) => {
  const res = await api.get<CompleteLookResponse>(
    `/recommendations/${customerId}/complete-look`,
    {
      params: { product_id: productId },
    },
  );
  return res.data;
};

export const calculateSize = async (req: SizeRequest) => {
  const res = await api.post<SizeResponse>("/size-recommendation", req);
  return res.data;
};

// Shopping & Events
export const recordCartEvent = async (payload: {
  customer_id?: number | null;
  session_id: string;
  product_id: number;
  action: string;
  quantity: number;
  selected_size?: string;
}) => {
  const res = await api.post("/cart/events", {
    ...payload,
    customer_id: payload.customer_id || null,
  });
  return res.data;
};

export const createOrder = async (payload: {
  address_id: number;
  customer_id: number;
  session_id?: string;
  idempotency_key: string;
  items: Array<{
    product_id: number;
    quantity: number;
    selected_size?: string;
  }>;
}) => {
  const res = await api.post("/orders", payload);
  return res.data;
};

export const trackEvent = async (payload: {
  customer_id?: number | null;
  session_id: string;
  product_id?: number;
  event_type: string;
  event_key?: string;
  metadata?: Record<string, any>;
  experiment_id?: number;
  variant?: string;
}) => {
  const res = await api.post("/events", {
    ...payload,
    customer_id: payload.customer_id || null,
  });
  return res.data;
};

// Product Analytics
export const fetchOverviewMetrics = async (days = 30) => {
  const res = await api.get<OverviewMetrics>("/analytics/overview", {
    params: { days },
  });
  return res.data;
};

export const fetchFunnel = async (days = 30) => {
  const res = await api.get<FunnelResponse>("/analytics/funnel", {
    params: { days },
  });
  return res.data;
};

export const fetchCohorts = async () => {
  const res = await api.get<CohortResponse>("/analytics/cohorts");
  return res.data;
};

export const fetchProductPerformance = async (limit = 50, days = 30) => {
  const res = await api.get<ProductPerformanceItem[]>("/analytics/products", {
    params: { limit, days },
  });
  return res.data;
};

export const fetchNorthStar = async () => {
  const res = await api.get<NorthStarResponse>("/analytics/north-star");
  return res.data;
};

export const fetchSegments = async () => {
  const res = await api.get<SegmentationResponse>("/segments");
  return res.data;
};

// Experimentation & Flags
export const fetchExperiments = async () => {
  const res = await api.get<Experiment[]>("/experiments");
  return res.data;
};

export const createExperiment = async (data: Partial<Experiment>) => {
  const res = await api.post<Experiment>("/experiments", data);
  return res.data;
};

export const updateExperiment = async (
  id: number,
  data: Partial<Experiment>,
) => {
  const res = await api.patch<Experiment>(`/experiments/${id}`, data);
  return res.data;
};

export const fetchExperimentResults = async (id: number) => {
  const res = await api.get<ExperimentResults>(`/experiments/${id}/results`);
  return res.data;
};

export const assignExperiment = async (expId: number, customerId: number) => {
  const res = await api.post<{
    experiment_id: number;
    customer_id: number;
    variant: string;
  }>(`/experiments/${expId}/assign`, null, {
    params: { customer_id: customerId },
  });
  return res.data;
};

export const fetchFeatureFlags = async () => {
  const res = await api.get<FeatureFlag[]>("/feature-flags");
  return res.data;
};

export const updateFeatureFlag = async (
  id: number,
  data: Partial<FeatureFlag>,
) => {
  const res = await api.patch<FeatureFlag>(`/feature-flags/${id}`, data);
  return res.data;
};

// Business Operations
export const fetchInventory = async () => {
  const res = await api.get<InventoryOverview>("/inventory");
  return res.data;
};

export const fetchInventoryForecast = async (productId: number) => {
  const res = await api.get<InventoryForecast>(
    `/inventory/forecast/${productId}`,
  );
  return res.data;
};

export const createInventoryMovement = async (payload: {
  product_id: number;
  movement_type: string;
  quantity: number;
  reference?: string;
}) => {
  const res = await api.post("/inventory/movements", payload);
  return res.data;
};

export const fetchReturns = async () => {
  const res = await api.get<ReturnOverview>("/returns/overview");
  return res.data;
};

export const fetchCatalogueQuality = async () => {
  const res = await api.get<CatalogueQuality>("/catalogue/quality");
  return res.data;
};

export const resolveCatalogueIssue = async (id: number) => {
  const res = await api.patch(`/catalogue/issues/${id}`, { is_resolved: true });
  return res.data;
};

export const simulatePromotion = async (req: PromotionSimulateRequest) => {
  const res = await api.post<PromotionSimulateResponse>(
    "/promotions/simulate",
    req,
  );
  return res.data;
};

// Roadmap, Releases & Feedback
export const fetchRoadmapTasks = async (status?: string) => {
  const res = await api.get<RoadmapTask[]>("/roadmap/tasks", {
    params: { status },
  });
  return res.data;
};

export const createRoadmapTask = async (data: Partial<RoadmapTask>) => {
  const res = await api.post<RoadmapTask>("/roadmap/tasks", data);
  return res.data;
};

export const updateRoadmapTask = async (
  id: number,
  data: Partial<RoadmapTask>,
) => {
  const res = await api.patch<RoadmapTask>(`/roadmap/tasks/${id}`, data);
  return res.data;
};

export const deleteRoadmapTask = async (id: number) => {
  const res = await api.delete(`/roadmap/tasks/${id}`);
  return res.data;
};

export const fetchReleases = async () => {
  const res = await api.get<Release[]>("/releases");
  return res.data;
};

export const updateRelease = async (id: number, data: Partial<Release>) => {
  const res = await api.patch<Release>(`/releases/${id}`, data);
  return res.data;
};

export const fetchFeedback = async () => {
  const res = await api.get<Feedback[]>("/feedback");
  return res.data;
};

export const createFeedback = async (data: Partial<Feedback>) => {
  const res = await api.post<Feedback>("/feedback", data);
  return res.data;
};

export const updateFeedback = async (id: number, data: Partial<Feedback>) => {
  const res = await api.patch<Feedback>(`/feedback/${id}`, data);
  return res.data;
};

// Uploaded media belongs to the API origin when frontend and API use separate hosts.
export function mediaUrl(path: string) {
  return new URL(
    path,
    new URL(api.defaults.baseURL || "/api/v1", window.location.origin),
  ).href;
}
