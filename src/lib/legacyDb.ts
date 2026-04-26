// Transitional data client while pages are migrated to the Node API.
// Do not use this for new code. Prefer functions from src/lib/api.ts.

export type { UserRole, UserProfile, UserWithRoles } from "@/contexts/AuthContext";

export {
  isAdmin,
  isSuperAdmin,
  isSubAdmin,
  isReviewer,
  isAuthor,
  isMember,
  isSubscriber,
} from "@/contexts/AuthContext";

type QueryResult<T> = { data: T; error: null; count: number | null };

class QueryBuilder {
  private singleMode = false;
  private maybeSingleMode = false;
  private countRequested = false;
  private mutationMode = false;

  constructor(mutationMode = false) {
    this.mutationMode = mutationMode;
  }

  select(_columns?: string, options?: { count?: string }) {
    this.countRequested = options?.count === "exact";
    return this;
  }

  eq(_column: string, _value: unknown) { return this; }
  neq(_column: string, _value: unknown) { return this; }
  in(_column: string, _values: unknown[]) { return this; }
  not(_column: string, _operator: string, _value: unknown) { return this; }
  is(_column: string, _value: unknown) { return this; }
  like(_column: string, _pattern: string) { return this; }
  ilike(_column: string, _pattern: string) { return this; }
  gte(_column: string, _value: unknown) { return this; }
  lte(_column: string, _value: unknown) { return this; }
  gt(_column: string, _value: unknown) { return this; }
  lt(_column: string, _value: unknown) { return this; }
  or(_filters: string) { return this; }
  contains(_column: string, _value: unknown) { return this; }
  match(_query: Record<string, unknown>) { return this; }
  order(_column: string, _options?: { ascending?: boolean }) { return this; }
  limit(_count: number) { return this; }
  range(_from: number, _to: number) { return this; }

  insert(_payload: unknown) {
    this.mutationMode = true;
    return this;
  }

  update(_payload: unknown) {
    this.mutationMode = true;
    return this;
  }

  delete() {
    this.mutationMode = true;
    return this;
  }

  upsert(_payload: unknown, _options?: unknown) {
    this.mutationMode = true;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleMode = true;
    return this;
  }

  private resolve(): Promise<QueryResult<unknown>> {
    if (this.mutationMode) {
      const mutationData = this.singleMode ? {} : null;
      return Promise.resolve({ data: mutationData, error: null, count: null });
    }

    if (this.singleMode) {
      return Promise.resolve({ data: {}, error: null, count: this.countRequested ? 0 : null });
    }

    if (this.maybeSingleMode) {
      return Promise.resolve({ data: null, error: null, count: this.countRequested ? 0 : null });
    }

    return Promise.resolve({ data: [], error: null, count: this.countRequested ? 0 : null });
  }

  then<TResult1 = QueryResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.resolve().then(onfulfilled as any, onrejected as any);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ): Promise<QueryResult<unknown> | TResult> {
    return this.resolve().catch(onrejected as any);
  }

  finally(onfinally?: (() => void) | null): Promise<QueryResult<unknown>> {
    return this.resolve().finally(onfinally as any);
  }
}

export const db = {
  from: () => new QueryBuilder(),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    updateUser: () => Promise.resolve({ data: null, error: null }),
  },
  rpc: () => Promise.resolve({ data: [], error: null }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
      createSignedUrl: () => Promise.resolve({ data: { signedUrl: "" }, error: null }),
    }),
  },
} as any;
