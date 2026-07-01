/**
 * GRGH API client â€" replaces db client.
 * All requests go to the Node.js/Express backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, "");

// â"€â"€â"€ Token management â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export const tokenStorage = {
  getAccess: () => localStorage.getItem("grgh_access_token"),
  getRefresh: () => localStorage.getItem("grgh_refresh_token"),
  setTokens: (access: string, refresh?: string) => {
    localStorage.setItem("grgh_access_token", access);
    if (refresh) localStorage.setItem("grgh_refresh_token", refresh);
  },
  clear: () => {
    localStorage.removeItem("grgh_access_token");
    localStorage.removeItem("grgh_refresh_token");
  },
};

// â"€â"€â"€ Core fetch wrapper â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

type RequestOptions = {
  method?: string;
  body?: unknown;
  isFormData?: boolean;
  requireAuth?: boolean;
};

async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, isFormData = false, requireAuth = false } = options;

  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = tokenStorage.getAccess();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (requireAuth) {
    throw new Error("Not authenticated.");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData
      ? (body as FormData)
      : body !== undefined
      ? JSON.stringify(body)
      : undefined,
  });

  // Handle 401
  if (response.status === 401) {
    // For auth endpoints (login/register), read the server message directly
    if (path.startsWith("/auth/")) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Invalid email or password.");
    }

    // For other endpoints, attempt token refresh
    const refreshed = await _tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${tokenStorage.getAccess()}`;
      const retryResponse = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: isFormData
          ? (body as FormData)
          : body !== undefined
          ? JSON.stringify(body)
          : undefined,
      });
      const retryData = await retryResponse.json();
      if (!retryResponse.ok) throw new Error(retryData.message || "Request failed.");
      return retryData.data as T;
    }
    tokenStorage.clear();
    window.dispatchEvent(new Event("grgh:logout"));
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed.");

  return data.data as T;
}

async function _tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.data?.accessToken) {
      tokenStorage.setTokens(data.data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// â"€â"€â"€ Auth API â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export const authApi = {
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    institution?: string;
  }) => apiRequest("/auth/register", { method: "POST", body: payload }),

  registerWithMembership: (payload: {
    email: string;
    password: string;
    fullName: string;
    institution?: string;
    planId: string;
    requestFeatured?: boolean;
    screenshotFile: File;
  }) => {
    const form = new FormData();
    form.append("email", payload.email);
    form.append("password", payload.password);
    form.append("fullName", payload.fullName);
    if (payload.institution) form.append("institution", payload.institution);
    form.append("planId", payload.planId);
    form.append("requestFeatured", String(!!payload.requestFeatured));
    form.append("screenshot", payload.screenshotFile);
    return apiRequest("/auth/register-with-membership", {
      method: "POST",
      body: form,
      isFormData: true,
    });
  },

  login: (email: string, password: string) =>
    apiRequest<{ accessToken: string; refreshToken: string; user: unknown; membership: unknown }>(
      "/auth/login",
      { method: "POST", body: { email, password } }
    ),

  getMe: () => apiRequest("/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest("/auth/change-password", {
      method: "PATCH",
      body: { currentPassword, newPassword },
      requireAuth: true,
    }),
};

// â"€â"€â"€ Users API â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export const usersApi = {
  getMe: () => apiRequest("/users/me"),
  updateProfile: (data: Record<string, unknown>) =>
    apiRequest("/users/me", { method: "PATCH", body: data }),
  getById: (id: string) => apiRequest(`/users/${id}`),
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/users${qs}`);
  },
  // Public — no auth required, used by the public Authors/Reviewers pages
  listPublicDirectory: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/users/public/directory${qs}`);
  },
  assignRoles: (userId: string, roles: string[]) =>
    apiRequest(`/users/${userId}/roles`, { method: "PATCH", body: { roles } }),
  addRole: (userId: string, role: string) =>
    apiRequest(`/users/${userId}/roles/add`, { method: "POST", body: { role } }),
  removeRole: (userId: string, role: string) =>
    apiRequest(`/users/${userId}/roles/remove`, { method: "POST", body: { role } }),
  toggleActive: (userId: string) =>
    apiRequest(`/users/${userId}/toggle-active`, { method: "PATCH" }),
  getRoleModuleAccess: () => apiRequest("/users/admin/role-module-access"),
  setRoleModuleAccess: (roleName: string, moduleKey: string, canAccess: boolean) =>
    apiRequest("/users/admin/role-module-access", {
      method: "POST",
      body: { roleName, moduleKey, canAccess },
    }),
  delete: (userId: string) => apiRequest(`/users/${userId}`, { method: "DELETE" }),
};


// â"€â"€â"€ Content API â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export const contentApi = {
  listPublished: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/content/published${qs}`);
  },
  getHomepage: () => apiRequest("/content/homepage"),
  getBySlug: (slug: string) => apiRequest(`/content/slug/${slug}`),
  getMySubmissions: () => apiRequest("/content/my-submissions"),
  create: (data: Record<string, unknown>) =>
    apiRequest("/content", { method: "POST", body: data }),
  submit: (id: string, data?: Record<string, unknown>) =>
    apiRequest(`/content/${id}/submit`, { method: "PATCH", body: data }),
  update: (id: string, data: Record<string, unknown>) =>
    apiRequest(`/content/${id}`, { method: "PATCH", body: data }),
  adminList: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/content/admin/all${qs}`);
  },
  delete: (id: string) => apiRequest(`/content/${id}`, { method: "DELETE" }),
  track: (id: string, type: "view" | "copy") =>
    apiRequest(`/content/${id}/track`, { method: "POST", body: { type } }),
};

export const journalApi = {
  getFeatured: () => apiRequest("/journals/featured"),
  listPublished: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/journals/published${qs}`);
  },
  getBySlug: (slug: string) => apiRequest(`/journals/slug/${slug}`),
  getMySubmissions: () => apiRequest("/journals/my-submissions"),
  createDraft: (data: FormData) =>
    apiRequest("/journals", { method: "POST", body: data, isFormData: true }),
  submit: (data: FormData) =>
    apiRequest("/journals/submit", { method: "POST", body: data, isFormData: true }),
  update: (id: string, data: FormData) =>
    apiRequest(`/journals/${id}`, { method: "PATCH", body: data, isFormData: true }),
  submitDraft: (id: string, data: FormData) =>
    apiRequest(`/journals/${id}/submit`, { method: "PATCH", body: data, isFormData: true }),
  adminList: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/journals/admin/all${qs}`);
  },
  adminUpload: (data: FormData) =>
    apiRequest("/journals/admin/upload", { method: "POST", body: data, isFormData: true }),
  delete: (id: string) => apiRequest(`/journals/${id}`, { method: "DELETE" }),
  withdraw: (id: string, reason: string) =>
    apiRequest(`/journals/${id}/withdraw`, { method: "PATCH", body: { reason } }),
  verifyPayment: (id: string, approve: boolean, reason?: string) =>
    apiRequest(`/journals/${id}/verify-payment`, { method: "PATCH", body: { approve, reason } }),
  track: (id: string, type: "view" | "copy") =>
    apiRequest(`/journals/${id}/track`, { method: "POST", body: { type } }),
};

// ─── Notifications API ────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (params?: { unreadOnly?: boolean; limit?: number }) => {
    const qs = params
      ? "?" + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return apiRequest(`/notifications${qs}`);
  },
  markRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => apiRequest("/notifications/mark-all-read", { method: "PATCH" }),

  // Author/user-facing — own notifications only
  listMine: (params?: { unreadOnly?: boolean; limit?: number }) => {
    const qs = params
      ? "?" + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return apiRequest(`/notifications/my${qs}`);
  },
  markMineRead: (id: string) => apiRequest(`/notifications/my/${id}/read`, { method: "PATCH" }),
  markAllMineRead: () => apiRequest("/notifications/my/mark-all-read", { method: "PATCH" }),
};

// â"€â"€â"€ Workflow API â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export const workflowApi = {
  listTemplates: () => apiRequest("/workflow/templates"),
  createTemplate: (name: string) =>
    apiRequest("/workflow/templates", { method: "POST", body: { name } }),
  updateTemplate: (id: string, data: Record<string, unknown>) =>
    apiRequest(`/workflow/templates/${id}`, { method: "PATCH", body: data }),
  deleteTemplate: (id: string) =>
    apiRequest(`/workflow/templates/${id}`, { method: "DELETE" }),
  getStages: (templateId: string) => apiRequest(`/workflow/templates/${templateId}/stages`),
  upsertStages: (templateId: string, stages: unknown[]) =>
    apiRequest(`/workflow/templates/${templateId}/stages`, {
      method: "PUT",
      body: { stages },
    }),
  getMyQueue: () => apiRequest("/workflow/my-queue"),
  reviewAction: (contentId: string, action: string, comment?: string) =>
    apiRequest(`/workflow/content/${contentId}/action`, {
      method: "POST",
      body: { action, comment },
    }),
  getContentLogs: (contentId: string) => apiRequest(`/workflow/content/${contentId}/logs`),
  getMyLogs: () => apiRequest("/workflow/my-logs"),
  getAllLogs: () => apiRequest("/workflow/all-logs"),
  getMyScore: () => apiRequest("/workflow/my-score"),
};

// â"€â"€â"€ Reviews API â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export const reviewsApi = {
  getMyReviews: () => apiRequest("/reviews/my-reviews"),
  accept: (id: string) => apiRequest(`/reviews/${id}/accept`, { method: "PATCH" }),
  selectPaper: (id: string) => apiRequest(`/reviews/${id}/select-paper`, { method: "PATCH" }),
  decline: (id: string) => apiRequest(`/reviews/${id}/decline`, { method: "PATCH" }),
  submit: (
    id: string,
    data: { recommendation: string; commentsToEditor?: string; commentsToAuthor?: string }
  ) => apiRequest(`/reviews/${id}/submit`, { method: "PATCH", body: data }),
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/reviews${qs}`);
  },
  assign: (contentId: string, reviewerUserId: string, dueDate?: string) =>
    apiRequest("/reviews/assign", {
      method: "POST",
      body: { contentId, reviewerUserId, dueDate },
    }),
  assignBucket: (reviewerUserId: string, paperIds: string[], dueDate?: string) =>
    apiRequest("/reviews/assign-bucket", {
      method: "POST",
      body: { reviewerUserId, paperIds, dueDate },
    }),
  recordDecision: (contentId: string, decision: string, decisionNotes?: string) =>
    apiRequest("/reviews/decision", {
      method: "POST",
      body: { contentId, decision, decisionNotes },
    }),
};

// â"€â"€â"€ Membership API â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export const membershipApi = {
  listPlans: () => apiRequest("/memberships/plans"),
  createPlan: (data: Record<string, unknown>) =>
    apiRequest("/memberships/plans", { method: "POST", body: data }),
  updatePlan: (id: string, data: Record<string, unknown>) =>
    apiRequest(`/memberships/plans/${id}`, { method: "PATCH", body: data }),
  deletePlan: (id: string) => apiRequest(`/memberships/plans/${id}`, { method: "DELETE" }),

  getMy: () => apiRequest("/memberships/my"),
  apply: (planId: string, screenshotFile?: File) => {
    const form = new FormData();
    form.append("planId", planId);
    if (screenshotFile) form.append("screenshot", screenshotFile);
    return apiRequest("/memberships/apply", { method: "POST", body: form, isFormData: true });
  },
  cancel: () => apiRequest("/memberships/cancel", { method: "POST" }),

  adminList: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/memberships/all${qs}`);
  },
  approve: (membershipId: string, approve: boolean, durationMonths?: number) =>
    apiRequest(`/memberships/${membershipId}/approve`, {
      method: "PATCH",
      body: { approve, durationMonths },
    }),
  renew: (membershipId: string) =>
    apiRequest(`/memberships/${membershipId}/renew`, { method: "PATCH" }),

  getMyInvoices: () => apiRequest("/memberships/invoices/my"),
  getAllInvoices: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/memberships/invoices/all${qs}`);
  },

  checkPPVAccess: (contentId: string) => apiRequest(`/memberships/ppv/check/${contentId}`),
  purchasePPV: (contentId: string) =>
    apiRequest("/memberships/ppv/purchase", { method: "POST", body: { contentId } }),
};

// â"€â"€â"€ Library API â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export const libraryApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/library${qs}`);
  },
  adminList: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/library/admin/all${qs}`);
  },
  getMySaved: () => apiRequest("/library/saved"),
  getMySubmissions: () => apiRequest("/library/my-submissions"),
  save: (itemId: string) => apiRequest(`/library/save/${itemId}`, { method: "POST" }),
  unsave: (itemId: string) => apiRequest(`/library/save/${itemId}`, { method: "DELETE" }),
  create: (data: FormData) =>
    apiRequest("/library", { method: "POST", body: data, isFormData: true }),
  update: (id: string, data: FormData) =>
    apiRequest(`/library/${id}`, { method: "PATCH", body: data, isFormData: true }),
  reviewSubmission: (id: string, action: "approve" | "reject" | "request_changes", note?: string) =>
    apiRequest(`/library/admin/${id}/review`, { method: "PATCH", body: { action, note } }),
  delete: (id: string) => apiRequest(`/library/${id}`, { method: "DELETE" }),
  track: (id: string, type: "view" | "copy") =>
    apiRequest(`/library/${id}/track`, { method: "POST", body: { type } }),
};

// â"€â"€â"€ Featured Users API â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export const featuredApi = {
  list: () => apiRequest("/featured"),
  submitRequest: (note?: string) =>
    apiRequest("/featured/request", { method: "POST", body: { note } }),
  getMyRequests: () => apiRequest("/featured/my-requests"),
  adminList: () => apiRequest("/featured/admin/all"),
  adminListRequests: () => apiRequest("/featured/admin/requests"),
  reviewRequest: (requestId: string, approve: boolean, adminNote?: string) =>
    apiRequest(`/featured/admin/requests/${requestId}/review`, {
      method: "PATCH",
      body: { approve, adminNote },
    }),
  removeFeatured: (userId: string) =>
    apiRequest(`/featured/admin/${userId}`, { method: "DELETE" }),
};

// ─── Happenings API ────────────────────────────────────────────────────────────────

export const happeningsApi = {
  list: () => apiRequest("/happenings"),
  create: (data: Record<string, unknown>) =>
    apiRequest("/happenings", { method: "POST", body: data }),
  update: (id: string, data: Record<string, unknown>) =>
    apiRequest(`/happenings/${id}`, { method: "PUT", body: data }),
  delete: (id: string) => apiRequest(`/happenings/${id}`, { method: "DELETE" }),
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return apiRequest<{ url: string }>("/happenings/upload", { method: "POST", body: form, isFormData: true });
  },
};

// â"€â"€â"€ Admin API â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export const adminApi = {
  getAnalytics: () => apiRequest("/admin/analytics"),
  getPipeline: () => apiRequest("/admin/pipeline"),
  getSubAdminLeaderboard: () => apiRequest("/admin/sub-admins/leaderboard"),
  getSubAdminUsers: () => apiRequest("/admin/sub-admins/users"),
};

