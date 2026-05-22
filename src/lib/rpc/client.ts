import { authClient, resolveApiBaseUrl } from '$lib/auth/client';

const API_BASE_URL = resolveApiBaseUrl();

export type Category = {
  id: number;
  userId: string;
  name: string;
  color: string | null;
};

export type Transaction = {
  id: number;
  userId: string;
  categoryId: number | null;
  amount: number;
  description: string | null;
  date: string;
};

export type Budget = {
  id: number;
  userId: string;
  categoryId: number;
  amount: number;
  month: number;
};

export type Summary = {
  month: number;
  income: number;
  expense: number;
  balance: number;
  budget: number;
  remainingBudget: number;
};

export type TransactionFilters = {
  search?: string;
  categoryId?: string;
  type?: string;
  from?: string;
  to?: string;
};

export type PeriodOptions = {
  month?: number;
  startDay?: number;
};

export type WeeklyFlow = {
  month: number;
  points: Array<{
    label: string;
    income: number;
    expense: number;
  }>;
};

export type CategorySpend = {
  month: number;
  categories: Array<{
    categoryId: number;
    name: string;
    color: string | null;
    amount: number;
  }>;
};

export type BudgetUsage = {
  month: number;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  items: Array<{
    budgetId: number;
    categoryId: number;
    categoryName: string;
    color: string | null;
    budget: number;
    spent: number;
    remaining: number;
    percent: number;
    status: 'ok' | 'warning' | 'exceeded';
  }>;
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

export type UserSettings = {
  id: number;
  userId: string;
  currency: 'CLP' | 'USD';
  monthStart: number;
  density: 'comfortable' | 'compact';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  sidebarCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiEnvelope<T> = {
  data: T;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error ? JSON.stringify(payload.error) : 'Error de API');
  }

  return (payload as ApiEnvelope<T>).data;
}

function toQueryString(filters: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

function unwrapAuthResult<T>(result: { data?: T | null; error?: { message?: string } | null }) {
  if (result.error) {
    throw new Error(result.error.message ?? 'Error de autenticacion');
  }

  return result.data ?? null;
}

export const api = {
  auth: {
    me: async () => {
      const session = unwrapAuthResult(await authClient.getSession());
      return session?.user ?? null;
    },
    login: async (body: { email: string; password: string }) => {
      const result = unwrapAuthResult(await authClient.signIn.email({
        email: body.email,
        password: body.password
      }));
      return result?.user ?? null;
    },
    register: async (body: { email: string; password: string }) => {
      const result = unwrapAuthResult(await authClient.signUp.email({
        email: body.email,
        password: body.password,
        name: body.email
      }));
      return result?.user ?? null;
    },
    logout: async () => {
      await authClient.signOut();
      return { ok: true };
    }
  },
  analytics: {
    weeklyFlow: (options: PeriodOptions = {}) =>
      request<WeeklyFlow>(`/api/v1/analytics/weekly-flow${toQueryString(options)}`),
    categorySpend: (options: PeriodOptions = {}) =>
      request<CategorySpend>(`/api/v1/analytics/category-spend${toQueryString(options)}`),
    budgetUsage: (options: PeriodOptions = {}) =>
      request<BudgetUsage>(`/api/v1/analytics/budget-usage${toQueryString(options)}`)
  },
  summary: (options: PeriodOptions = {}) => request<Summary>(`/api/v1/summary${toQueryString(options)}`),
  settings: {
    get: () => request<UserSettings>('/api/v1/settings'),
    update: (body: Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) =>
      request<UserSettings>('/api/v1/settings', {
        method: 'PATCH',
        body: JSON.stringify(body)
      })
  },
  categories: {
    list: () => request<Category[]>('/api/v1/categories'),
    create: (body: { name: string; color: string }) =>
      request<Category>('/api/v1/categories', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    update: (id: number, body: Partial<{ name: string; color: string }>) =>
      request<Category>(`/api/v1/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      }),
    remove: (id: number) =>
      request<Category>(`/api/v1/categories/${id}`, {
        method: 'DELETE'
      })
  },
  transactions: {
    list: (filters: TransactionFilters = {}) =>
      request<Transaction[]>(`/api/v1/transactions${toQueryString(filters)}`),
    get: (id: number) => request<Transaction>(`/api/v1/transactions/${id}`),
    create: (body: { categoryId?: number | null; amount: number; description: string; date: string }) =>
      request<Transaction>('/api/v1/transactions', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    update: (id: number, body: Partial<{ categoryId: number | null; amount: number; description: string; date: string }>) =>
      request<Transaction>(`/api/v1/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      }),
    remove: (id: number) =>
      request<Transaction>(`/api/v1/transactions/${id}`, {
        method: 'DELETE'
      })
  },
  budgets: {
    list: () => request<Budget[]>('/api/v1/budgets'),
    create: (body: { categoryId: number; amount: number; month: number }) =>
      request<Budget>('/api/v1/budgets', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    update: (id: number, body: Partial<{ categoryId: number; amount: number; month: number }>) =>
      request<Budget>(`/api/v1/budgets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      }),
    remove: (id: number) =>
      request<Budget>(`/api/v1/budgets/${id}`, {
        method: 'DELETE'
      })
  }
};

export function formatMoney(cents: number, currency: 'CLP' | 'USD' = 'CLP') {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(cents / 100);
}

export function currentMonthValue() {
  const now = new Date();
  return now.getFullYear() * 100 + now.getMonth() + 1;
}
