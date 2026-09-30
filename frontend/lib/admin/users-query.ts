/** Stan listy użytkowników w URL panelu admina (?q=&sort=&order=&page=). */

export const USER_SORTS = ["name", "email", "role", "workoutCount"] as const;
export type UserSort = (typeof USER_SORTS)[number];
export type SortOrder = "asc" | "desc";

export type UserListQuery = { q: string; sort: UserSort; order: SortOrder; page: number; limit: number };

/** Rozmiary strony do wyboru; backend przyjmuje do 100. */
export const PAGE_SIZES = [10, 20, 50, 100] as const;

export const DEFAULT_USER_QUERY: UserListQuery = { q: "", sort: "name", order: "asc", page: 1, limit: 20 };

/** Kierunek przy pierwszym kliknięciu kolumny: liczby i role od największych, tekst od A. */
export function defaultOrder(sort: UserSort): SortOrder {
  return sort === "workoutCount" || sort === "role" ? "desc" : "asc";
}

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function parseUserQuery(params: Params): UserListQuery {
  const sort = first(params.sort);
  const order = first(params.order);
  const page = Number(first(params.page));
  const limit = Number(first(params.limit));
  return {
    q: (first(params.q) ?? "").slice(0, 100),
    sort: USER_SORTS.includes(sort as UserSort) ? (sort as UserSort) : DEFAULT_USER_QUERY.sort,
    order: order === "asc" || order === "desc" ? order : DEFAULT_USER_QUERY.order,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: (PAGE_SIZES as readonly number[]).includes(limit) ? limit : DEFAULT_USER_QUERY.limit,
  };
}

/** Link do /admin z danym stanem listy; domyślne wartości nie trafiają do URL. */
export function usersHref(query: UserListQuery) {
  const params = new URLSearchParams();
  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.sort !== DEFAULT_USER_QUERY.sort || query.order !== DEFAULT_USER_QUERY.order) {
    params.set("sort", query.sort);
    params.set("order", query.order);
  }
  if (query.page > 1) params.set("page", String(query.page));
  if (query.limit !== DEFAULT_USER_QUERY.limit) params.set("limit", String(query.limit));
  const search = params.toString();
  return search ? `/admin?${search}#admin-users` : "/admin";
}
