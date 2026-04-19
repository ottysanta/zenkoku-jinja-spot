/**
 * FastAPI バックエンドに対する薄いクライアント。
 * 同一オリジンでプロキシするため、基本は相対パスで呼ぶ。
 * SSR からは NEXT_PUBLIC_API_BASE を使う（サーバー->サーバー通信）。
 */

const serverBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

function base(): string {
  if (typeof window === 'undefined') return serverBase;
  return ''; // ブラウザ側は rewrites 経由
}

export type RequestOptions = RequestInit & {
  /** Authorization: Bearer として付与する API トークン */
  token?: string | null;
};

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((init?.headers as Record<string, string> | undefined) || {}),
  };
  if (init?.token) {
    headers['authorization'] = `Bearer ${init.token}`;
  }
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    let detail: string | undefined;
    try { detail = (await res.json())?.detail; } catch { /* ignore */ }
    throw new ApiError(res.status, detail || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ===== Types（apps/api/schemas.py と対応。後に packages/types へ自動生成予定）=====

export type Spot = {
  id: number;
  name: string;
  slug?: string | null;
  address?: string | null;
  lat: number;
  lng: number;
  shrine_type?: string | null;
  deity?: string | null;
  benefits?: string | null;
  shrine_rank?: string | null;
  founded?: string | null;
  goshuin_available?: boolean | null;
  goshuin_info?: string | null;
  juyohin_info?: string | null;
  prefecture?: string | null;
  city?: string | null;
  accepts_offerings?: number | boolean | null;
  website?: string | null;
  external_id?: string | null;
  source_layer?: string | null;
  access_info?: string | null;
  source_url?: string | null;
  // 詳細・画像（Phase 1d）
  photo_url?: string | null;
  photo_attribution?: string | null;
  description?: string | null;
  history?: string | null;
  highlights?: string | null;
  wikipedia_title?: string | null;
  wikipedia_url?: string | null;
  // canonical 運用 (migration 008)
  canonical_name?: string | null;
  primary_source?: string | null;
  confidence_score?: number | null;
  official_status?: string | null;
  published_status?: string | null;
  last_synced_at?: string | null;
  data_freshness_status?: string | null;
};

/** slug が無い spot は 'spot-{id}' を暗黙的に使う */
export function spotSlug(s: Pick<Spot, "id" | "slug">): string {
  return (s.slug && s.slug.trim()) || `spot-${s.id}`;
}

export type SpotWithDistance = Spot & { distance_meters?: number | null };

export type CheckinStats = {
  total: number;
  month: number;
  unique_visitors: number;
  last_at?: string | null;
};

export type Checkin = {
  id: number;
  spot_id: number;
  distance_m: number;
  wish_type?: string | null;
  comment?: string | null;
  nickname?: string | null;
  created_at: string;
};

export type Me = {
  id: number;
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  locale?: string | null;
  role: string;
};

export type Review = {
  id: number;
  user_id: number;
  spot_id: number;
  score_atmosphere?: number | null;
  score_manners?: number | null;
  score_access?: number | null;
  score_facilities?: number | null;
  score_overall?: number | null;
  body?: string | null;
  visited_at?: string | null;
  locale?: string | null;
  created_at: string;
  updated_at?: string | null;
  author_name?: string | null;
  author_avatar?: string | null;
};

export type ReviewAggregate = {
  count: number;
  avg_atmosphere?: number | null;
  avg_manners?: number | null;
  avg_access?: number | null;
  avg_facilities?: number | null;
  avg_overall?: number | null;
};

export type ReviewInput = {
  score_atmosphere?: number | null;
  score_manners?: number | null;
  score_access?: number | null;
  score_facilities?: number | null;
  score_overall?: number | null;
  body?: string | null;
  visited_at?: string | null;
};

export type Notification = {
  id: number;
  kind: string;
  payload?: string | null;
  is_read: boolean;
  created_at: string;
};

export type OfferingItem = {
  id: number;
  spot_id: number;
  kind: string;
  title: string;
  description?: string | null;
  amount_jpy: number;
  is_active: boolean;
  sort_order: number;
};

export type OfferingCheckoutInput = {
  offering_item_id?: number | null;
  amount_jpy?: number | null;
  message?: string | null;
  anonymous?: boolean;
  campaign_id?: number | null;
};

export type OfferingCheckoutResult = {
  offering_id: number;
  checkout_url: string;
  session_id: string;
};

export type Offering = {
  id: number;
  spot_id: number;
  offering_item_id?: number | null;
  campaign_id?: number | null;
  amount_jpy: number;
  status: string;            // pending / paid / failed / refunded
  message?: string | null;
  anonymous: boolean;
  created_at: string;
  paid_at?: string | null;
};

// ===== Multi-source admin types (apps/api/admin_sources.py と対応) =====

export type SourceInfo = {
  source_type: string;
  display_name: string;
  priority: number;
  default_confidence: number;
  allow_persist: boolean;
  non_persistable_raw: boolean;
  health_ok: boolean;
  health_message: string;
  last_import_at: string | null;
  last_import_status: string | null;
  last_inserted: number | null;
  last_updated: number | null;
  last_failed: number | null;
  record_count: number;
};

export type SourceImportRow = {
  id: number;
  source_type: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  error_message: string | null;
  triggered_by: string | null;
};

export type PendingMergeRow = {
  id: number;
  primary_shrine_id: number;
  primary_name: string;
  candidate_shrine_id: number;
  candidate_name: string;
  match_score: number;
  match_reasons: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
};

export type ShrineSourceRow = {
  id: number;
  source_type: string;
  source_object_id: string | null;
  source_name: string | null;
  source_address: string | null;
  source_lat: number | null;
  source_lng: number | null;
  source_url: string | null;
  fetched_at: string | null;
  match_status: string;
  match_score: number | null;
};

export type FreshnessSummary = {
  total: number;
  fresh: number;
  aging: number;
  stale: number;
  unknown: number;
  last_synced_p50: string | null;
  last_synced_p99: string | null;
};

export type StatsReferenceRow = {
  id: number;
  source_name: string;
  source_url: string | null;
  reference_year: number;
  reference_as_of: string | null;
  metric_key: string;
  metric_value: number;
  note: string | null;
  published_at: string | null;
};

// ===== Bookmarks (client_id ベースの軽量お気に入り) =====

export type BookmarkStatus = 'want' | 'saved' | 'visited';

export type Bookmark = {
  id: number;
  client_id: string;
  spot_id: number;
  status: BookmarkStatus;
  note?: string | null;
  created_at: string;
  updated_at: string;
  spot?: Spot | null;
};

export type BookmarkStatusMap = {
  want: boolean;
  saved: boolean;
  visited: boolean;
};

// ===== Endpoints =====

export const api = {
  // /api/spots は Next.js Route Handler が SQLite を直接読んでいるので、
  // 写真・説明など拡張フィールドをそのまま含む。bbox/limit/featured_only に対応。
  listSpots: (opts?: {
    bbox?: [number, number, number, number];
    limit?: number;
    featuredOnly?: boolean;
    prefecture?: string;
  }) => {
    const qs = new URLSearchParams();
    if (opts?.bbox) qs.set('bbox', opts.bbox.join(','));
    if (opts?.limit != null) qs.set('limit', String(opts.limit));
    if (opts?.featuredOnly) qs.set('featured_only', 'true');
    if (opts?.prefecture) qs.set('prefecture', opts.prefecture);
    const q = qs.toString();
    return request<Spot[]>(`/api/spots${q ? `?${q}` : ''}`);
  },
  listShrines: (limit = 500, offset = 0) =>
    request<Spot[]>(`/shrines?limit=${limit}&offset=${offset}`),
  getShrineBySlug: (slug: string) =>
    request<Spot>(`/shrines/${encodeURIComponent(slug)}`),
  getSpot: (id: number) => request<Spot>(`/api/spots/${id}`),
  nearbySpots: (lat: number, lng: number, radius = 5000) =>
    request<SpotWithDistance[]>(`/spots/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  listCheckins: (spotId: number, limit = 20) =>
    request<Checkin[]>(`/spots/${spotId}/checkins?limit=${limit}`),
  getCheckinStats: (spotId: number) =>
    request<CheckinStats>(`/spots/${spotId}/checkin-stats`),
  createCheckin: (spotId: number, body: {
    client_id: string;
    lat: number; lng: number;
    accuracy_m?: number | null;
    wish_type?: string | null;
    comment?: string | null;
    nickname?: string | null;
  }, options?: { token?: string | null }) => request<Checkin>(`/spots/${spotId}/checkins`, {
    method: 'POST',
    body: JSON.stringify(body),
    token: options?.token ?? null,
  }),
  // 認証系
  me: (token: string) => request<Me>('/me', { token }),
  signOut: (token: string) => request<void>('/auth/sessions', {
    method: 'DELETE',
    token,
  }),
  // Reviews
  listReviews: (spotId: number, limit = 20, offset = 0) =>
    request<Review[]>(`/spots/${spotId}/reviews?limit=${limit}&offset=${offset}`),
  reviewAggregate: (spotId: number) =>
    request<ReviewAggregate>(`/spots/${spotId}/review-aggregate`),
  upsertReview: (spotId: number, body: ReviewInput, token: string) =>
    request<Review>(`/spots/${spotId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    }),
  deleteReview: (reviewId: number, token: string) =>
    request<void>(`/reviews/${reviewId}`, { method: 'DELETE', token }),
  // Reactions
  addReaction: (input: { target_type: string; target_id: number; kind: string }, token: string) =>
    request<{ id: number; target_type: string; target_id: number; kind: string; created_at: string }>(
      '/reactions',
      { method: 'POST', body: JSON.stringify(input), token },
    ),
  removeReaction: (q: { target_type: string; target_id: number; kind: string }, token: string) =>
    request<void>(
      `/reactions?target_type=${encodeURIComponent(q.target_type)}&target_id=${q.target_id}&kind=${encodeURIComponent(q.kind)}`,
      { method: 'DELETE', token },
    ),
  // Follows
  follow: (userId: number, token: string) =>
    request<void>(`/follows/${userId}`, { method: 'POST', token }),
  unfollow: (userId: number, token: string) =>
    request<void>(`/follows/${userId}`, { method: 'DELETE', token }),
  // Notifications
  listNotifications: (token: string, unreadOnly = false) =>
    request<Notification[]>(`/notifications?unread_only=${unreadOnly}`, { token }),
  markAllRead: (token: string) =>
    request<void>('/notifications/read-all', { method: 'POST', token }),
  markRead: (id: number, token: string) =>
    request<void>(`/notifications/${id}/read`, { method: 'POST', token }),
  // Offerings
  listOfferingItems: (spotId: number) =>
    request<OfferingItem[]>(`/spots/${spotId}/offering-items`),
  createOfferingCheckout: (spotId: number, body: OfferingCheckoutInput, token?: string | null) =>
    request<OfferingCheckoutResult>(`/spots/${spotId}/offerings/checkout`, {
      method: 'POST',
      body: JSON.stringify(body),
      token: token ?? null,
    }),
  getOffering: (id: number, token?: string | null, sessionId?: string | null) => {
    const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
    return request<Offering>(`/offerings/${id}${qs}`, { token: token ?? null });
  },
  myOfferings: (token: string, limit = 50) =>
    request<Offering[]>(`/me/offerings?limit=${limit}`, { token }),
  // Reports
  report: (input: {
    target_type: string;
    target_id: number;
    reason: string;
    detail?: string | null;
    reporter_client_id?: string | null;
  }, token?: string | null) =>
    request<unknown>('/reports', {
      method: 'POST',
      body: JSON.stringify(input),
      token: token ?? null,
    }),
  // ===== Multi-source admin =====
  listSources: () => request<SourceInfo[]>('/admin/sources'),
  triggerSync: (sourceType: string, body: Record<string, unknown> = {}) =>
    request<{ source_type: string; status: string; source_import_id: number }>(
      `/admin/sources/${encodeURIComponent(sourceType)}/sync`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  listSourceImports: (opts?: { sourceType?: string; status?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (opts?.sourceType) qs.set('source_type', opts.sourceType);
    if (opts?.status) qs.set('status', opts.status);
    if (opts?.limit) qs.set('limit', String(opts.limit));
    const q = qs.toString();
    return request<SourceImportRow[]>(`/admin/source-imports${q ? `?${q}` : ''}`);
  },
  listPendingMerges: (status = 'pending', limit = 50) =>
    request<PendingMergeRow[]>(`/admin/pending-merges?status=${status}&limit=${limit}`),
  decidePendingMerge: (id: number, decision: 'approve' | 'reject', reviewerUserId?: number) =>
    request<{ id: number; status: string }>(
      `/admin/pending-merges/${id}/decision`,
      {
        method: 'POST',
        body: JSON.stringify({ decision, reviewer_user_id: reviewerUserId ?? null }),
      },
    ),
  listShrineSources: (shrineId: number) =>
    request<ShrineSourceRow[]>(`/admin/shrines/${shrineId}/sources`),
  patchShrinePublishStatus: (shrineId: number, status: 'published' | 'draft' | 'hidden' | 'merged') =>
    request<{ id: number; published_status: string }>(
      `/admin/shrines/${shrineId}/publish`,
      { method: 'PATCH', body: JSON.stringify({ published_status: status }) },
    ),
  getFreshnessSummary: () => request<FreshnessSummary>('/admin/freshness-summary'),
  // 公開: 文化庁など参考統計
  listStatsReferences: () => request<StatsReferenceRow[]>('/stats/references'),
  // 検索（神社名 / ご利益 / 祭神）
  searchShrines: (params: {
    q?: string;
    benefit?: string;
    deity?: string;
    prefecture?: string;
    shrine_type?: string;
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.benefit) qs.set('benefit', params.benefit);
    if (params.deity) qs.set('deity', params.deity);
    if (params.prefecture) qs.set('prefecture', params.prefecture);
    if (params.shrine_type) qs.set('shrine_type', params.shrine_type);
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.offset != null) qs.set('offset', String(params.offset));
    const q = qs.toString();
    // /api/search は node:sqlite で直接読むので FastAPI 再起動不要
    return request<Spot[]>(`/api/search${q ? `?${q}` : ''}`);
  },
  /** /search ページ下段の件数付きチェックボックス用 */
  searchFacets: (params: {
    q?: string;
    benefit?: string;
    deity?: string;
    prefecture?: string;
    shrine_type?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.benefit) qs.set('benefit', params.benefit);
    if (params.deity) qs.set('deity', params.deity);
    if (params.prefecture) qs.set('prefecture', params.prefecture);
    if (params.shrine_type) qs.set('shrine_type', params.shrine_type);
    const q = qs.toString();
    return request<{
      total: number;
      benefits: Record<string, number>;
      shrine_types: { value: string; count: number }[];
      prefectures: { value: string; count: number }[];
    }>(`/api/search-facets${q ? `?${q}` : ''}`);
  },
  // ===== Bookmarks =====
  createBookmark: (body: {
    client_id: string;
    spot_id: number;
    status: BookmarkStatus;
    note?: string | null;
  }) =>
    request<Bookmark>('/me/bookmarks', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteBookmark: (id: number, client_id: string) =>
    request<void>(
      `/me/bookmarks/${id}?client_id=${encodeURIComponent(client_id)}`,
      { method: 'DELETE' },
    ),
  listMyBookmarks: (opts: { client_id: string; status?: BookmarkStatus }) => {
    const qs = new URLSearchParams();
    qs.set('client_id', opts.client_id);
    if (opts.status) qs.set('status', opts.status);
    return request<Bookmark[]>(`/me/bookmarks?${qs.toString()}`);
  },
  getBookmarkStatusForSpot: (client_id: string, spot_id: number) => {
    const qs = new URLSearchParams();
    qs.set('client_id', client_id);
    qs.set('spot_id', String(spot_id));
    return request<BookmarkStatusMap>(`/me/bookmarks/status?${qs.toString()}`);
  },
  /** 匿名の自分のチェックイン履歴（client_id ベース） */
  listMyCheckins: (client_id: string) =>
    request<Array<{
      spot_id: number;
      name?: string | null;
      created_at: string;
      wish_type?: string | null;
      comment?: string | null;
    }>>(
      `/me/checkins?client_id=${encodeURIComponent(client_id)}`,
    ),
};
