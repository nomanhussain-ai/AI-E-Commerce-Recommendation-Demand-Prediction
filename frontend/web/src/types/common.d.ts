export type ApiErrorBody = {
  error: { code: string; message: string; details: Record<string, unknown> };
  request_id: string;
};

export type Paginated<T> = {
  data: T[];
  meta: { pagination: { page: number; page_size: number; total: number; total_pages: number } };
};
